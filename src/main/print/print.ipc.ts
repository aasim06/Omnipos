import { BrowserWindow, ipcMain } from 'electron';

export function registerPrintIpc(): void {
  ipcMain.handle('print:get-printers', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return [];
    try {
      return await win.webContents.getPrintersAsync();
    } catch (err) {
      console.error('[Print IPC] getPrintersAsync error:', err);
      return [];
    }
  });

  ipcMain.handle(
    'print:receipt',
    async (
      event,
      options?: { printerName?: string; silent?: boolean; html?: string },
    ) => {
      const senderWin = BrowserWindow.fromWebContents(event.sender);
      let installedPrinters: Electron.PrinterInfo[] = [];
      try {
        if (senderWin) {
          installedPrinters = await senderWin.webContents.getPrintersAsync();
        }
      } catch (err) {
        console.warn('[Print IPC] Could not get installed printers:', err);
      }

      // Resolve destination printer
      let targetPrinter = (options?.printerName || '').trim();

      if (!targetPrinter) {
        // Auto-detect thermal/POS printer from installed printers
        const thermalMatch = installedPrinters.find((p) =>
          /xprinter|pos|receipt|thermal|bixolon|epson.*tm|srp|xp-|rp-|zjiang/i.test(p.name),
        );
        if (thermalMatch) {
          targetPrinter = thermalMatch.name;
          console.log('[Print IPC] Auto-detected thermal printer:', targetPrinter);
        }
      } else {
        // Validate user selected printer (case-insensitive)
        const matched = installedPrinters.find(
          (p) => p.name.toLowerCase() === targetPrinter.toLowerCase(),
        );
        if (matched) {
          targetPrinter = matched.name;
        }
      }

      console.log(
        '[Print IPC] Target printer:',
        targetPrinter ? `"${targetPrinter}"` : '(System Default)',
        '| silent:',
        options?.silent ?? true,
      );

      // 1. If custom HTML (e.g. KOT Kitchen Ticket or Thermal Receipt) is provided:
      if (options?.html) {
        const printWin = new BrowserWindow({
          show: false,
          width: 380,
          height: 800,
          paintWhenInitiallyHidden: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
          },
        });

        try {
          await printWin.loadURL(
            `data:text/html;charset=utf-8,${encodeURIComponent(options.html)}`,
          );

          // Allow DOM, layout, CSS and fonts to completely paint
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (printWin.isDestroyed()) {
            return { ok: false, error: 'Print window closed unexpectedly' };
          }

          return await new Promise((resolve) => {
            let settled = false;
            const timeout = setTimeout(() => {
              if (!settled) {
                settled = true;
                setTimeout(() => {
                  try {
                    if (!printWin.isDestroyed()) printWin.destroy();
                  } catch {}
                }, 1000);
                console.warn('[Print IPC] Thermal print job timed out (15s)');
                resolve({ ok: false, error: 'Print job timed out (15s)' });
              }
            }, 15000);

            printWin.webContents.print(
              {
                silent: options.silent ?? true,
                printBackground: true,
                deviceName: targetPrinter,
                margins: { marginType: 'none' },
              },
              (success, failureReason) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);

                // CRITICAL FIX: DO NOT destroy printWin immediately!
                // In Windows, when webContents.print callback fires, the spooler has just accepted
                // the job and is actively copying the EMF/GDI rendering buffer.
                // Destroying printWin immediately terminates the render process, causing Windows Spooler
                // to ingest an empty/aborted surface, resulting in completely blank white paper!
                setTimeout(() => {
                  try {
                    if (!printWin.isDestroyed()) {
                      printWin.destroy();
                    }
                  } catch {
                    /* ignore */
                  }
                }, 2500);

                if (!success) {
                  console.warn('[Print IPC] Thermal print failed:', failureReason);
                  resolve({ ok: false, error: failureReason });
                } else {
                  console.log('[Print IPC] Thermal print succeeded to:', targetPrinter || '(default)');
                  resolve({ ok: true });
                }
              },
            );
          });
        } catch (err: any) {
          setTimeout(() => {
            try {
              if (!printWin.isDestroyed()) printWin.destroy();
            } catch {}
          }, 1000);
          console.error('[Print IPC] Thermal print error:', err);
          return { ok: false, error: err?.message || String(err) };
        }
      }

      // 2. Otherwise print sender window directly (fallback)
      if (!senderWin) return { ok: false, error: 'Window not found' };

      return new Promise((resolve) => {
        let settled = false;
        const timeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve({ ok: false, error: 'Print timeout' });
          }
        }, 10000);

        senderWin.webContents.print(
          {
            silent: options?.silent ?? true,
            printBackground: true,
            deviceName: targetPrinter,
            margins: { marginType: 'none' },
          },
          (success, failureReason) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (!success) {
              console.warn('[Print IPC] Fallback print failed:', failureReason);
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
