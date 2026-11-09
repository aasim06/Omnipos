import { app, BrowserWindow, shell, ipcMain, nativeTheme } from 'electron';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { release } from 'node:os';
import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { disconnectPrisma, initializeDatabase } from './database/client';
import { startBackendServer, type BackendServer } from './backend/server';
import { registerLicenseIpc } from './license/license.ipc';
import { registerPrintIpc } from './print/print.ipc';
import { registerBackupIpc } from './backup/backup.ipc';
import { initAutoUpdater } from './updater';

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

// Dedicated handler that waits up to 5s for the server to be ready
ipcMain.handle('app:get-local-api-url', async () => {
  if (backendServer?.url) return backendServer.url;
  // Wait up to 5 seconds for server to be ready
  for (let i = 0; i < 50; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (backendServer?.url) return backendServer.url;
  }
  return null;
});

// ── Windows 11 window chrome ──────────────────────────────────────────
// Custom title bar (native caption buttons via titleBarOverlay) on Windows,
// plus the Mica backdrop on Windows 11 22H2+ (build 22621), where DWM supports it.
const IS_WINDOWS = process.platform === 'win32';
const WINDOWS_BUILD = IS_WINDOWS ? Number(release().split('.')[2] ?? 0) : 0;
const SUPPORTS_MICA = IS_WINDOWS && WINDOWS_BUILD >= 22621;
const TITLE_BAR_HEIGHT = 40;

type ChromeTheme = 'light' | 'dark';

function titleBarOverlayFor(mode: ChromeTheme): Electron.TitleBarOverlayOptions {
  const solid = mode === 'light' ? '#F3F3F3' : '#202020';
  return {
    // With Mica the caption-button strip stays transparent so the backdrop shows through.
    color: SUPPORTS_MICA ? '#00000000' : solid,
    symbolColor: mode === 'light' ? '#1A1A1A' : '#FFFFFF',
    height: TITLE_BAR_HEIGHT,
  };
}

// App theme defaults to dark (see AppProviders); the renderer sends the real choice on mount.
nativeTheme.themeSource = 'dark';

ipcMain.on('window:set-theme', (event, mode: unknown) => {
  if (mode !== 'light' && mode !== 'dark') return;
  nativeTheme.themeSource = mode;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && IS_WINDOWS) win.setTitleBarOverlay(titleBarOverlayFor(mode));
});

function createWindow(): BrowserWindow {
  const chromeFlags = [IS_WINDOWS ? 'titlebar' : '', SUPPORTS_MICA ? 'mica' : ''].filter(Boolean).join(',');

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'Omnipos',
    ...(IS_WINDOWS
      ? { titleBarStyle: 'hidden' as const, titleBarOverlay: titleBarOverlayFor('dark') }
      : {}),
    ...(SUPPORTS_MICA
      ? { backgroundMaterial: 'mica' as const, backgroundColor: '#00000000' }
      : { backgroundColor: '#202020' }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      additionalArguments: [`--omnipos-chrome=${chromeFlags}`],
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
  // Enable F5, Ctrl+R, and Cmd+R to reload the window from any route
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
        return;
      }

      if (
        input.key === 'F5' ||
        input.code === 'F5' ||
        ((input.control || input.meta) && (input.key?.toLowerCase() === 'r' || input.code === 'KeyR'))
      ) {
        if (input.shift) {
          mainWindow.webContents.reloadIgnoringCache();
        } else {
          mainWindow.webContents.reload();
        }
        event.preventDefault();
        return;
      }
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
    registerBackupIpc();
    initAutoUpdater();

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
