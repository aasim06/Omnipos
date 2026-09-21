import { BrowserWindow, dialog, ipcMain, app } from 'electron';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { existsSync, copyFileSync, statSync, writeFileSync, readFileSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
import AdmZip from 'adm-zip';
import { getPosDbPath, getPrisma, disconnectPrisma, initializeDatabase } from '../database/client';
import { copyDirRecursive, writeBackupZip } from './backup-zip';
import { getImagesRoot } from './images-paths';
import { sanitizeProduct, sanitizeCategory } from '../backend/routes';
import { getLicenseApiBase, getSavedKey, getHardwareId, getDeviceName } from '../license/license.ipc';

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

function ensureExtension(filePath: string, preferredExt: 'zip' | 'db'): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.zip') || lower.endsWith('.db') || lower.endsWith('.dbbackup')) {
    return filePath;
  }
  return `${filePath}.${preferredExt}`;
}

/**
 * Upload local backup (.zip / .db) to Central Cloud Server Vault
 */
export async function uploadBackupToCloud(
  finalPath: string,
  backupType: string = 'auto',
): Promise<{ ok: boolean; message?: string; cloudId?: string }> {
  try {
    const key = getSavedKey();
    if (!key) {
      console.log('[Backup Cloud Sync] No active license key found, skipping cloud backup.');
      return { ok: false, message: 'No license key configured' };
    }

    const hwid = getHardwareId();
    const deviceName = getDeviceName();
    const isZip = finalPath.toLowerCase().endsWith('.zip');
    const fileName = basename(finalPath);
    const fileBuffer = readFileSync(finalPath);

    const formData = new FormData();
    const blob = new Blob([fileBuffer], {
      type: isZip ? 'application/zip' : 'application/octet-stream',
    });
    formData.append('file', blob, fileName);
    formData.append('key', key);
    formData.append('hwid', hwid);
    formData.append('deviceName', deviceName);
    formData.append('backupType', backupType);

    // If running in development and local omnipos-server (port 4000) is online, prefer it
    let targetBase = getLicenseApiBase();
    if (!app.isPackaged) {
      try {
        const ping = await fetch('http://localhost:4000/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(1000),
        });
        if (ping.ok) {
          targetBase = 'http://localhost:4000/api';
        }
      } catch {
        /* fallback to default targetBase */
      }
    }

    const uploadUrl = `${targetBase}/backup/upload`;
    console.log(`[Backup Cloud Sync] Uploading ${fileName} (${fileBuffer.length} bytes) to ${uploadUrl}...`);

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-License-Key': key,
      },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      console.log('[Backup Cloud Sync] Cloud vault accepted backup:', data);
      return { ok: true, message: 'Cloud backup synced successfully', cloudId: data?.data?.id };
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn('[Backup Cloud Sync] Server returned non-200:', res.status, err);
      return { ok: false, message: err.message || `Server returned ${res.status}` };
    }
  } catch (err: any) {
    console.warn('[Backup Cloud Sync] Upload network error:', err.message);
    return { ok: false, message: err.message };
  }
}

export function registerBackupIpc(): void {
  ipcMain.removeHandler('backup:get-status');
  ipcMain.removeHandler('backup:create');
  ipcMain.removeHandler('backup:restore');
  ipcMain.removeHandler('backup:flush-sync');
  ipcMain.removeHandler('backup:export-json');
  ipcMain.removeHandler('backup:sync-cloud');

  /**
   * Sync Latest Backup to Central Cloud Vault
   */
  ipcMain.handle('backup:sync-cloud', async (_event, filePath?: string) => {
    const history = readBackupHistory();
    const targetFile = filePath || history.lastBackupPath;
    if (!targetFile || !existsSync(targetFile)) {
      return { ok: false, error: 'No recent backup file found to sync' };
    }
    return await uploadBackupToCloud(targetFile, 'manual');
  });

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
   * Direct Pre-Backup Flush: Bulk writes all Dexie & LocalStorage products & categories to SQLite
   */
  ipcMain.handle('backup:flush-sync', async (_event, data?: { products?: any[]; categories?: any[] }) => {
    try {
      const prisma = getPrisma();
      const products = data?.products || [];
      const categories = data?.categories || [];

      let pCount = 0;
      for (const rawP of products) {
        if (!rawP || !rawP.name) continue;
        try {
          const safeData = sanitizeProduct(rawP);
          const id = safeData.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await prisma.product.upsert({
            where: { id },
            update: { ...safeData, updatedAt: new Date() },
            create: { ...safeData, id, updatedAt: new Date() },
          });
          pCount++;
        } catch (pErr: any) {
          console.warn('[backup:flush-sync] Product error:', pErr.message);
        }
      }

      let cCount = 0;
      for (const rawC of categories) {
        if (!rawC || !rawC.name) continue;
        try {
          const safeC = sanitizeCategory(rawC);
          const id = safeC.id || `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await prisma.category.upsert({
            where: { id },
            update: safeC,
            create: { ...safeC, id },
          });
          cCount++;
        } catch (cErr: any) {
          console.warn('[backup:flush-sync] Category error:', cErr.message);
        }
      }

      try {
        await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
      } catch {}

      console.log(`[backup:flush-sync] Successfully flushed ${pCount} products and ${cCount} categories to SQLite`);
      return { ok: true, productsFlushed: pCount, categoriesFlushed: cCount };
    } catch (err: any) {
      console.error('[backup:flush-sync] Error:', err);
      return { ok: false, error: err.message };
    }
  });

  /**
   * Create Full Omnipos Backup (.zip archive containing SQLite database + product images)
   */
  ipcMain.handle('backup:create', async (event, options?: { promptDialog?: boolean }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const dbPath = getPosDbPath();

    if (!existsSync(dbPath)) {
      return { ok: false, error: 'Database file does not exist yet. Please record at least one transaction.' };
    }

    try {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const defaultFilename = `Omnipos_Backup_${stamp}.zip`;

      let targetPath: string | undefined;

      if (options?.promptDialog !== false && win) {
        const result = await dialog.showSaveDialog(win, {
          title: 'Save Omnipos Full System Backup (ZIP)',
          defaultPath: defaultFilename,
          filters: [
            { name: 'Omnipos Full Backup ZIP (*.zip)', extensions: ['zip'] },
            { name: 'SQLite Database Only (*.db)', extensions: ['db'] },
            { name: 'All Files (*.*)', extensions: ['*'] },
          ],
        });

        if (result.canceled || !result.filePath) {
          return { ok: false, cancelled: true };
        }
        targetPath = result.filePath;
      } else {
        const backupDir = join(app.getPath('userData'), 'backups');
        if (!existsSync(backupDir)) {
          mkdirSync(backupDir, { recursive: true });
        }
        targetPath = join(backupDir, defaultFilename);
      }

      const isZip = !targetPath.toLowerCase().endsWith('.db') && !targetPath.toLowerCase().endsWith('.dbbackup');
      const finalPath = isZip ? ensureExtension(targetPath, 'zip') : targetPath;

      if (isZip) {
        await writeBackupZip(finalPath);
      } else {
        // Legacy .db copy: perform checkpoint and copy
        const prisma = getPrisma();
        try {
          await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
        } catch {}
        await disconnectPrisma();
        try {
          copyFileSync(dbPath, finalPath);
        } finally {
          getPrisma();
        }
      }

      const stats = statSync(finalPath);

      saveBackupHistory({
        lastBackup: new Date().toISOString(),
        lastBackupPath: finalPath,
        lastBackupSize: stats.size,
      });

      console.log(`[Backup IPC] System backup successfully created at: ${finalPath} (${stats.size} bytes)`);

      // ── Auto-sync to Central Cloud Vault ──
      let cloudSync: { ok: boolean; message?: string; cloudId?: string } | undefined;
      try {
        cloudSync = await uploadBackupToCloud(finalPath, options?.promptDialog !== false ? 'manual' : 'auto');
      } catch (syncErr: any) {
        console.warn('[Backup IPC] Cloud auto-sync warning:', syncErr);
      }

      return {
        ok: true,
        path: finalPath,
        size: stats.size,
        mode: isZip ? 'full' : 'db',
        timestamp: new Date().toISOString(),
        cloudSync,
      };
    } catch (err: any) {
      console.error('[Backup IPC] Failed to create backup:', err);
      return { ok: false, error: err.message || 'Failed to create system backup' };
    }
  });

  /**
   * Restore Database and Product Images from a .zip or .db backup file
   */
  ipcMain.handle('backup:restore', async (event, filePath?: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    let sourceBackupPath = filePath;

    if (!sourceBackupPath) {
      if (!win) return { ok: false, error: 'No active window found' };
      const result = await dialog.showOpenDialog(win, {
        title: 'Select Omnipos Backup File (.zip or .db) to Restore',
        properties: ['openFile'],
        filters: [
          { name: 'Omnipos Backup (*.zip, *.db, *.sqlite)', extensions: ['zip', 'db', 'dbbackup', 'sqlite', 'sqlite3', 'bak', 'backup'] },
          { name: 'Full Backup ZIP (*.zip)', extensions: ['zip'] },
          { name: 'Database Only (*.db)', extensions: ['db', 'dbbackup', 'sqlite', 'sqlite3'] },
          { name: 'All Files (*.*)', extensions: ['*'] },
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

    const stats = statSync(sourceBackupPath);
    if (stats.size === 0) {
      return { ok: false, error: 'The selected backup file is empty (0 bytes).' };
    }

    const dbPath = getPosDbPath();
    const staging = join(tmpdir(), `omnipos-restore-${randomUUID()}`);

    try {
      // 1. Safety snapshot of current database
      if (existsSync(dbPath)) {
        try {
          copyFileSync(dbPath, `${dbPath}.pre_restore_safety`);
        } catch {
          /* ignore */
        }
      }

      // 2. Disconnect Prisma before altering database files
      await disconnectPrisma();

      let dbSource = sourceBackupPath;
      const isZip = sourceBackupPath.toLowerCase().endsWith('.zip');

      if (isZip) {
        mkdirSync(staging, { recursive: true });
        const zip = new AdmZip(sourceBackupPath);
        zip.extractAllTo(staging, true);

        // Look for database file in extracted root or subfolder
        const candidateDbs = [
          join(staging, 'omnipos.db'),
          join(staging, 'pos.db'),
          join(staging, 'clinic.db'),
          join(staging, basename(sourceBackupPath, '.zip'), 'omnipos.db'),
          join(staging, basename(sourceBackupPath, '.zip'), 'pos.db'),
        ];

        let foundDb = candidateDbs.find((p) => existsSync(p));
        if (!foundDb) {
          const files = readdirSync(staging);
          const dbFile = files.find((f) => f.toLowerCase().endsWith('.db') || f.toLowerCase().endsWith('.sqlite'));
          if (dbFile) foundDb = join(staging, dbFile);
        }

        if (!foundDb) {
          throw new Error('Backup ZIP does not contain a valid database file (omnipos.db or *.db)');
        }
        dbSource = foundDb;

        // Restore images directory if present
        const stagedImages = join(staging, 'images');
        if (existsSync(stagedImages)) {
          copyDirRecursive(stagedImages, getImagesRoot());
          console.log('[Backup IPC] Restored images folder from backup zip');
        }

        const stagedDocs = join(staging, 'documents');
        if (existsSync(stagedDocs)) {
          copyDirRecursive(stagedDocs, getImagesRoot());
        }
      }

      // 3. Remove old WAL & SHM files to avoid index/schema mismatch
      try {
        if (existsSync(`${dbPath}-wal`)) rmSync(`${dbPath}-wal`, { force: true });
        if (existsSync(`${dbPath}-shm`)) rmSync(`${dbPath}-shm`, { force: true });
      } catch (rmErr) {
        console.warn('[Backup IPC] Warning cleaning wal/shm:', rmErr);
      }

      // 4. Overwrite pos database with backup
      copyFileSync(dbSource, dbPath);

      // 5. Reinitialize Prisma and ensure table schemas
      await initializeDatabase();

      console.log(`[Backup IPC] Database and media successfully restored from: ${sourceBackupPath}`);
      return {
        ok: true,
        mode: isZip ? 'full' : 'db',
        message: 'Database and media were successfully restored! Please reload the application (F5).',
      };
    } catch (err: any) {
      console.error('[Backup IPC] Restore failed:', err);
      try {
        await initializeDatabase();
      } catch {}
      return { ok: false, error: err.message || 'Failed to restore backup.' };
    } finally {
      try {
        if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });
      } catch {}
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
