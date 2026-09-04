import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { disconnectPrisma, initializeDatabase } from './database/client';
import { startBackendServer, type BackendServer } from './backend/server';
import { registerLicenseIpc } from './license/license.ipc';
import { registerPrintIpc } from './print/print.ipc';

app.setName('Omnipos');
app.setPath('userData', join(app.getPath('appData'), 'Omnipos'));

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Extra resources path for Prisma in production
if (process.resourcesPath) {
  const extraNodeModules = join(process.resourcesPath, 'node_modules');
  if (existsSync(extraNodeModules)) {
    (process as NodeJS.Process & { mainModule?: { paths?: string[] } })
      .mainModule?.paths?.unshift(extraNodeModules);
    require('module').globalPaths.unshift(extraNodeModules);
  }
}

let backendServer: BackendServer | undefined;

ipcMain.handle('app:get-api-url', () => {
  if (!backendServer) return null;
  return backendServer.url;
});

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'Omnipos - Advanced Retail & Restaurant POS',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Enable F12 and Ctrl+Shift+I to toggle DevTools even in production
  mainWindow.webContents.on('before-input-event', (_, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.omnipos.app');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  try {
    // 1. Initialize local SQLite database
    await initializeDatabase();
    console.log('[Omnipos] SQLite database initialized successfully.');

    // 2. Start local Express backend server
    backendServer = await startBackendServer();
    console.log(`[Omnipos] Local backend server running at ${backendServer.url}`);

    // 3. Register IPC handlers
    registerLicenseIpc();
    registerPrintIpc();

    // 4. Create Main Desktop Window
    createWindow();
  } catch (err) {
    console.error('[Omnipos] Failed to initialize application:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  if (backendServer) {
    await backendServer.close().catch(() => {});
  }
  await disconnectPrisma().catch(() => {});
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
