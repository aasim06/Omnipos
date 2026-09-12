import electronUpdater from 'electron-updater';
import { ipcMain, BrowserWindow, app } from 'electron';
import { is } from '@electron-toolkit/utils';

const autoUpdater = electronUpdater.autoUpdater || (electronUpdater as any).default?.autoUpdater;

let _isChecking = false;
let _isDownloading = false;

function broadcastToAll(channel: string, ...args: unknown[]): void {
  BrowserWindow.getAllWindows().forEach((w) => {
    if (!w.isDestroyed()) w.webContents.send(channel, ...args);
  });
}

function formatBytes(n: number): string {
  if (!n || n < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function initAutoUpdater(): void {
  autoUpdater.logger = console;

  const githubToken = process.env.GH_TOKEN;
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'aasim06',
    repo: 'Omnipos',
    ...(githubToken && { token: githubToken }),
  });

  // Manual download control & full installer download to avoid 0% blockmap hanging
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.disableDifferentialDownload = true;

  ipcMain.handle('app:get-version', () => app.getVersion());

  ipcMain.handle('app:install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle('app:check-for-updates', async () => {
    if (is.dev) {
      console.log('[AutoUpdater] Dev mode check requested. Current Version:', app.getVersion());
      return 'latest';
    }

    if (_isChecking || _isDownloading) {
      console.log('[AutoUpdater] Check or Download already in progress.');
      return _isDownloading ? 'available' : 'checking';
    }

    _isChecking = true;
    try {
      const result = await autoUpdater.checkForUpdates();

      if (result && result.updateInfo) {
        const currentVersion = autoUpdater.currentVersion.version;
        const latestVersion = result.updateInfo.version;

        if (latestVersion !== currentVersion) {
          return 'available';
        }
      }
      return 'latest';
    } catch (error: any) {
      console.error('[AutoUpdater] Check Error:', error);
      return { error: error?.message || 'Failed to check for updates' };
    } finally {
      _isChecking = false;
    }
  });

  // Update Available — notify windows and trigger installer download
  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info?.version);
    broadcastToAll('app:update-available', info?.version || true);
    if (!_isDownloading) {
      _isDownloading = true;
      broadcastToAll('app:update-progress', {
        percent: 0,
        transferred: 0,
        total: 0,
        bytesPerSecond: 0,
        phase: 'starting',
      });
      console.log('[AutoUpdater] Starting full installer download...');
      autoUpdater.downloadUpdate().catch((err) => {
        console.error('[AutoUpdater] Download initiation error:', err);
        _isDownloading = false;
        broadcastToAll('app:update-error', err?.message || 'Failed to start download');
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] Already on latest version.');
    _isChecking = false;
    _isDownloading = false;
  });

  autoUpdater.on('download-progress', (progressObj) => {
    _isDownloading = true;
    const percent = Math.min(100, Math.max(0, Math.round(progressObj.percent || 0)));
    const payload = {
      percent,
      transferred: progressObj.transferred || 0,
      total: progressObj.total || 0,
      bytesPerSecond: progressObj.bytesPerSecond || 0,
      phase: 'downloading' as const,
      label:
        progressObj.total > 0
          ? `${formatBytes(progressObj.transferred)} / ${formatBytes(progressObj.total)}`
          : undefined,
    };
    console.log(
      `[AutoUpdater] Progress ${percent}%` +
        (payload.label ? ` (${payload.label}, ${formatBytes(payload.bytesPerSecond)}/s)` : '')
    );
    broadcastToAll('app:update-progress', payload);
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('[AutoUpdater] Update downloaded and ready to install.');
    _isChecking = false;
    _isDownloading = false;
    broadcastToAll('app:update-ready');
  });

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Event Error:', err);
    _isChecking = false;
    _isDownloading = false;
    broadcastToAll('app:update-error', err?.message || 'Update failed');
  });

  // Background automated checks in production
  if (!is.dev) {
    setTimeout(async () => {
      if (!_isChecking && !_isDownloading) {
        console.log('[AutoUpdater] Running startup background check...');
        void autoUpdater.checkForUpdates();
      }
    }, 30 * 1000);

    setInterval(async () => {
      if (!_isChecking && !_isDownloading) {
        console.log('[AutoUpdater] Running periodic background check...');
        void autoUpdater.checkForUpdates();
      }
    }, 4 * 60 * 60 * 1000);
  }
}
