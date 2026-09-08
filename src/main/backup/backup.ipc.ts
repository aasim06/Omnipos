import { BrowserWindow, dialog, ipcMain, app } from 'electron';
import { join } from 'node:path';
import { existsSync, copyFileSync, statSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { getPosDbPath, getPrisma, disconnectPrisma, initializeDatabase } from '../database/client';

interface BackupHistory {
  lastBackup?: string;
  lastBackupPath?: string;
  lastBackupSize?: number;
}

function getBackupHistoryPath(): string {
  return join(app.getPath('userData'), 'backup-history.json');
}

function readBackupHistory(): BackupHistory {
  try {
    const file = getBackupHistoryPath();
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, 'utf-8'));
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveBackupHistory(history: BackupHistory): void {
  try {
    writeFileSync(getBackupHistoryPath(), JSON.stringify(history, null, 2), 'utf-8');
  } catch {
    /* ignore */
  }
}

export function registerBackupIpc(): void {
  /**
   * Get Database Status & Stats
   */
  ipcMain.handle('backup:get-status', async () => {
    const dbPath = getPosDbPath();
    let dbSize = 0;
    try {
      if (existsSync(dbPath)) {
        dbSize = statSync(dbPath).size;
      }
    } catch {
      /* ignore */
    }

    const history = readBackupHistory();
    return {
      dbPath,
      dbSize,
      lastBackup: history.lastBackup || null,
      lastBackupPath: history.lastBackupPath || null,
      lastBackupSize: history.lastBackupSize || null,
    };
  });

  /**
   * Create Full SQLite Database Backup (.db file)
   */
  ipcMain.handle('backup:create', async (event, options?: { promptDialog?: boolean }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const dbPath = getPosDbPath();

    if (!existsSync(dbPath)) {
      return { ok: false, error: 'Database file does not exist yet. Please record at least one transaction.' };
    }

    try {
      // 1. Flush SQLite WAL to ensure all latest transactions are written to pos.db
      const prisma = getPrisma();
      try {
        await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL)');
      } catch (checkpointErr) {
        console.warn('[Backup IPC] WAL checkpoint warning:', checkpointErr);
      }

      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const defaultFilename = `Omnipos_Backup_${timestampStr}.db`;

      let targetPath: string | undefined;

      if (options?.promptDialog !== false && win) {
        const result = await dialog.showSaveDialog(win, {
          title: 'Save Omnipos Database Backup',
          defaultPath: defaultFilename,
          filters: [
            { name: 'SQLite Database (.db)', extensions: ['db'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });

        if (result.canceled || !result.filePath) {
          return { ok: false, cancelled: true };
        }
        targetPath = result.filePath;
      } else {
        // Automatic destination inside userData/backups
        const backupDir = join(app.getPath('userData'), 'backups');
        if (!existsSync(backupDir)) {
          mkdirSync(backupDir, { recursive: true });
        }
        targetPath = join(backupDir, defaultFilename);
      }

      // 2. Perform copy
      copyFileSync(dbPath, targetPath);
      const stats = statSync(targetPath);

      // 3. Save History
      saveBackupHistory({
        lastBackup: new Date().toISOString(),
        lastBackupPath: targetPath,
        lastBackupSize: stats.size,
      });

      console.log(`[Backup IPC] Database backup successfully created at: ${targetPath} (${stats.size} bytes)`);
      return {
        ok: true,
        path: targetPath,
        size: stats.size,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[Backup IPC] Failed to create backup:', err);
      return { ok: false, error: err.message || 'Failed to create database backup' };
    }
  });

  /**
   * Restore Database from a .db backup file
   */
  ipcMain.handle('backup:restore', async (event, filePath?: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    let sourceBackupPath = filePath;

    if (!sourceBackupPath) {
      if (!win) return { ok: false, error: 'No active window found' };
      const result = await dialog.showOpenDialog(win, {
        title: 'Select Omnipos Database Backup (.db) to Restore',
        properties: ['openFile'],
        filters: [
          { name: 'SQLite Database (.db)', extensions: ['db', 'sqlite', 'sqlite3'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return { ok: false, cancelled: true };
      }
      sourceBackupPath = result.filePaths[0];
    }

    if (!existsSync(sourceBackupPath)) {
      return { ok: false, error: 'The selected backup file does not exist.' };
    }

    try {
      const dbPath = getPosDbPath();

      // 1. Safety snapshot of current database
      if (existsSync(dbPath)) {
        try {
          copyFileSync(dbPath, `${dbPath}.pre_restore_safety`);
        } catch {
          /* ignore safety copy failure */
        }
      }

      // 2. Disconnect Prisma
      await disconnectPrisma();

      // 3. Remove old WAL & SHM files to prevent schema/index conflicts
      try {
        if (existsSync(`${dbPath}-wal`)) rmSync(`${dbPath}-wal`);
        if (existsSync(`${dbPath}-shm`)) rmSync(`${dbPath}-shm`);
      } catch (rmErr) {
        console.warn('[Backup IPC] Warning cleaning wal/shm:', rmErr);
      }

      // 4. Overwrite pos.db with backup
      copyFileSync(sourceBackupPath, dbPath);

      // 5. Reinitialize Prisma and tables
      await initializeDatabase();

      console.log(`[Backup IPC] Database successfully restored from: ${sourceBackupPath}`);
      return { ok: true, message: 'Database was successfully restored! Please reload the application.' };
    } catch (err: any) {
      console.error('[Backup IPC] Restore failed:', err);
      return { ok: false, error: err.message || 'Failed to restore database.' };
    }
  });

  /**
   * Export All Data as JSON archive
   */
  ipcMain.handle('backup:export-json', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
      const prisma = getPrisma();
      const [
        products,
        categories,
        orders,
        orderItems,
        orderRefunds,
        stockMovements,
        expenses,
        customerKhatas,
        khataTransactions,
        cashDrawers,
        appSettings,
      ] = await Promise.all([
        prisma.product.findMany().catch(() => []),
        prisma.category.findMany().catch(() => []),
        prisma.order.findMany().catch(() => []),
        prisma.orderItem.findMany().catch(() => []),
        prisma.orderRefund.findMany().catch(() => []),
        prisma.stockMovement.findMany().catch(() => []),
        prisma.expense.findMany().catch(() => []),
        prisma.customerKhata.findMany().catch(() => []),
        prisma.khataTransaction.findMany().catch(() => []),
        prisma.cashDrawer.findMany().catch(() => []),
        prisma.appSetting.findMany().catch(() => []),
      ]);

      const archiveData = {
        app: 'Omnipos',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        counts: {
          products: products.length,
          categories: categories.length,
          orders: orders.length,
          refunds: orderRefunds.length,
          khatas: customerKhatas.length,
          expenses: expenses.length,
        },
        data: {
          products,
          categories,
          orders,
          orderItems,
          orderRefunds,
          stockMovements,
          expenses,
          customerKhatas,
          khataTransactions,
          cashDrawers,
          appSettings,
        },
      };

      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const defaultFilename = `Omnipos_Data_Export_${timestampStr}.json`;

      let targetPath: string | undefined;

      if (win) {
        const result = await dialog.showSaveDialog(win, {
          title: 'Export Omnipos Complete JSON Backup',
          defaultPath: defaultFilename,
          filters: [
            { name: 'JSON Document (.json)', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });

        if (result.canceled || !result.filePath) {
          return { ok: false, cancelled: true };
        }
        targetPath = result.filePath;
      } else {
        const backupDir = join(app.getPath('userData'), 'backups');
        if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
        targetPath = join(backupDir, defaultFilename);
      }

      writeFileSync(targetPath, JSON.stringify(archiveData, null, 2), 'utf-8');
      return { ok: true, path: targetPath, counts: archiveData.counts };
    } catch (err: any) {
      console.error('[Backup IPC] JSON Export failed:', err);
      return { ok: false, error: err.message || 'Failed to export JSON backup' };
    }
  });
}
