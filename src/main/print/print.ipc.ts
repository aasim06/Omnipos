import { BrowserWindow, ipcMain } from 'electron';

export function registerPrintIpc(): void {
  ipcMain.handle('print:get-printers', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return [];
    return win.webContents.getPrintersAsync();
  });

  ipcMain.handle('print:receipt', async (event, options?: { printerName?: string; silent?: boolean }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { ok: false, error: 'Window not found' };

    return new Promise((resolve) => {
      win.webContents.print(
        {
          silent: options?.silent ?? true,
          printBackground: true,
          deviceName: options?.printerName || '',
          margins: { marginType: 'none' },
        },
        (success, failureReason) => {
          if (!success) {
            resolve({ ok: false, error: failureReason });
          } else {
            resolve({ ok: true });
          }
        },
      );
    });
  });
}
