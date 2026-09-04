import { BrowserWindow, ipcMain } from 'electron';

export function registerPrintIpc(): void {
  ipcMain.handle('print:get-printers', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return [];
    return win.webContents.getPrintersAsync();
  });

  ipcMain.handle(
    'print:receipt',
    async (
      event,
      options?: { printerName?: string; silent?: boolean; html?: string },
    ) => {
      // 1. If custom HTML (e.g. KOT Kitchen Ticket or Thermal Receipt) is provided:
      if (options?.html) {
        const printWin = new BrowserWindow({
          show: false,
          width: 320,
          height: 600,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
          },
        });

        await printWin.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(options.html)}`,
        );

        return new Promise((resolve) => {
          printWin.webContents.on('did-finish-load', () => {
            printWin.webContents.print(
              {
                silent: options.silent ?? true,
                printBackground: true,
                deviceName: options.printerName || '',
                margins: { marginType: 'none' },
              },
              (success, failureReason) => {
                try {
                  printWin.close();
                } catch {
                  /* ignore */
                }
                if (!success) {
                  console.warn('[Print IPC] Thermal print failed:', failureReason);
                  resolve({ ok: false, error: failureReason });
                } else {
                  resolve({ ok: true });
                }
              },
            );
          });
        });
      }

      // 2. Otherwise print sender window directly
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
    },
  );
}
