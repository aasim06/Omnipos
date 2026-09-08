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

export interface PosApi {
  isElectron: boolean;
  getApiUrl: () => Promise<string | null>;
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
  };
}

const posApi: PosApi = {
  isElectron: true,
  getApiUrl: () => ipcRenderer.invoke('app:get-api-url'),
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
  },
};

try {
  contextBridge.exposeInMainWorld('posApi', posApi);
} catch (error) {
  console.error('Failed to expose posApi in main world:', error);
}
