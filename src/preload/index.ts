import { contextBridge, ipcRenderer } from 'electron';

export interface PosLicenseGate {
  state: 'ok' | 'none' | 'blocked';
  reason?: string;
  modules?: Record<string, boolean>;
}

export interface PosSupportContact {
  phone: string;
  email: string;
}

export interface PosUpdateProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
  phase: 'starting' | 'downloading' | 'idle';
  label?: string;
}

export interface PosUpdateApi {
  getVersion: () => Promise<string>;
  check: () => Promise<any>;
  install: () => Promise<void>;
  onAvailable: (callback: (version?: string) => void) => () => void;
  onProgress: (callback: (progress: PosUpdateProgress) => void) => () => void;
  onReady: (callback: () => void) => () => void;
  onError: (callback: (error: string) => void) => () => void;
}

export interface PosApi {
  isElectron: boolean;
  getApiUrl: () => Promise<string | null>;
  getLocalApiUrl: () => Promise<string | null>;
  getLicenseMeta: () => Promise<any>;
  activateLicense: (key: string, cloudApiUrl?: string) => Promise<{ ok: boolean; error?: string; schemaId?: string }>;
  license: {
    gate: () => Promise<PosLicenseGate>;
    activate: (key: string) => Promise<{ ok: boolean; error?: string; schemaId?: string }>;
    modules: () => Promise<Record<string, boolean> | null>;
    support: () => Promise<PosSupportContact>;
    status: () => Promise<boolean>;
  };
  getPrinters: () => Promise<any[]>;
  printReceipt: (options?: { printerName?: string; silent?: boolean }) => Promise<{ ok: boolean; error?: string }>;
  backup: {
    create: (options?: { promptDialog?: boolean }) => Promise<{ ok: boolean; path?: string; size?: number; cancelled?: boolean; error?: string }>;
    restore: (filePath?: string) => Promise<{ ok: boolean; message?: string; cancelled?: boolean; error?: string }>;
    exportJson: () => Promise<{ ok: boolean; path?: string; counts?: any; cancelled?: boolean; error?: string }>;
    getStatus: () => Promise<{ dbPath: string; dbSize: number; lastBackup?: string | null; lastBackupPath?: string | null; lastBackupSize?: number | null }>;
    flushSync: (data?: { products?: any[]; categories?: any[] }) => Promise<{ ok: boolean; productsFlushed?: number; categoriesFlushed?: number; error?: string }>;
    syncCloud: (filePath?: string) => Promise<{ ok: boolean; message?: string; cloudId?: string; error?: string }>;
    triggerDailyCheck: () => Promise<{ executed: boolean; reason?: string; cloudId?: string }>;
  };
  update: PosUpdateApi;
}

const posApi: PosApi = {
  isElectron: true,
  getApiUrl: () => ipcRenderer.invoke('app:get-api-url'),
  getLocalApiUrl: () => ipcRenderer.invoke('app:get-local-api-url'),
  getLicenseMeta: () => ipcRenderer.invoke('license:get-meta'),
  activateLicense: (key: string, cloudApiUrl?: string) =>
    ipcRenderer.invoke('license:activate', { key, cloudApiUrl }),
  license: {
    gate: () => ipcRenderer.invoke('license:gate'),
    activate: (key: string) => ipcRenderer.invoke('license:activate', key),
    modules: () => ipcRenderer.invoke('license:modules'),
    support: () => ipcRenderer.invoke('license:support'),
    status: () => ipcRenderer.invoke('license:status'),
  },
  getPrinters: () => ipcRenderer.invoke('print:get-printers'),
  printReceipt: (options) => ipcRenderer.invoke('print:receipt', options),
  backup: {
    create: (options) => ipcRenderer.invoke('backup:create', options),
    restore: (filePath) => ipcRenderer.invoke('backup:restore', filePath),
    exportJson: () => ipcRenderer.invoke('backup:export-json'),
    getStatus: () => ipcRenderer.invoke('backup:get-status'),
    flushSync: (data) => ipcRenderer.invoke('backup:flush-sync', data),
    syncCloud: (filePath) => ipcRenderer.invoke('backup:sync-cloud', filePath),
    triggerDailyCheck: () => ipcRenderer.invoke('backup:trigger-daily-check'),
  },
  update: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    check: () => ipcRenderer.invoke('app:check-for-updates'),
    install: () => ipcRenderer.invoke('app:install-update'),
    onAvailable: (callback) => {
      const handler = (_: any, version: any) => callback(version);
      ipcRenderer.on('app:update-available', handler);
      return () => {
        ipcRenderer.removeListener('app:update-available', handler);
      };
    },
    onProgress: (callback) => {
      const handler = (_: any, progress: any) => callback(progress);
      ipcRenderer.on('app:update-progress', handler);
      return () => {
        ipcRenderer.removeListener('app:update-progress', handler);
      };
    },
    onReady: (callback) => {
      const handler = () => callback();
      ipcRenderer.on('app:update-ready', handler);
      return () => {
        ipcRenderer.removeListener('app:update-ready', handler);
      };
    },
    onError: (callback) => {
      const handler = (_: any, error: any) => callback(error);
      ipcRenderer.on('app:update-error', handler);
      return () => {
        ipcRenderer.removeListener('app:update-error', handler);
      };
    },
  },
};

try {
  contextBridge.exposeInMainWorld('posApi', posApi);
} catch (error) {
  console.error('Failed to expose posApi in main world:', error);
}

// Whenever network reconnects, check and perform today's automated cloud backup
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    ipcRenderer.invoke('backup:trigger-daily-check').catch(() => {});
  });
}

