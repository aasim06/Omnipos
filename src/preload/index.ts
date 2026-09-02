import { contextBridge, ipcRenderer } from 'electron';

export interface PosApi {
  isElectron: boolean;
  getApiUrl: () => Promise<string | null>;
  getLicenseMeta: () => Promise<any>;
  activateLicense: (key: string, cloudApiUrl?: string) => Promise<{ ok: boolean; error?: string; schemaId?: string }>;
  getPrinters: () => Promise<any[]>;
  printReceipt: (options?: { printerName?: string; silent?: boolean }) => Promise<{ ok: boolean; error?: string }>;
}

const posApi: PosApi = {
  isElectron: true,
  getApiUrl: () => ipcRenderer.invoke('app:get-api-url'),
  getLicenseMeta: () => ipcRenderer.invoke('license:get-meta'),
  activateLicense: (key: string, cloudApiUrl?: string) =>
    ipcRenderer.invoke('license:activate', { key, cloudApiUrl }),
  getPrinters: () => ipcRenderer.invoke('print:get-printers'),
  printReceipt: (options) => ipcRenderer.invoke('print:receipt', options),
};

try {
  contextBridge.exposeInMainWorld('posApi', posApi);
} catch (error) {
  console.error('Failed to expose posApi in main world:', error);
}
