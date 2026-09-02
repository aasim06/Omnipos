import { app, ipcMain } from 'electron';
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import nodeMachineId from 'node-machine-id';
const { machineIdSync } = (nodeMachineId as any)?.default || nodeMachineId || {};

export interface LicenseMeta {
  key: string;
  hwid: string;
  schemaId: string;
  isActivated: boolean;
  databaseMode: 'local' | 'online';
  cloudApiUrl?: string;
  clinicName?: string;
}

export function getHardwareId(): string {
  try {
    if (typeof machineIdSync === 'function') {
      return machineIdSync(true);
    }
    return 'omnipos-generic-hwid';
  } catch {
    return 'omnipos-generic-hwid';
  }
}

export function schemaIdForLicenseKey(key: string): string {
  const normalized = String(key || '').trim().toUpperCase();
  if (!normalized) return '';
  const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  return `lic_${hash}`;
}

const CACHE_FILE = 'license-cache.json';

export function getCachedLicense(): LicenseMeta {
  const defaultMeta: LicenseMeta = {
    key: '',
    hwid: getHardwareId(),
    schemaId: '',
    isActivated: false,
    databaseMode: 'local',
  };

  try {
    const file = join(app.getPath('userData'), CACHE_FILE);
    if (existsSync(file)) {
      const data = JSON.parse(readFileSync(file, 'utf-8'));
      return { ...defaultMeta, ...data };
    }
  } catch {
    /* ignore */
  }

  return defaultMeta;
}

export function saveCachedLicense(meta: Partial<LicenseMeta>): void {
  try {
    const current = getCachedLicense();
    const updated = { ...current, ...meta };
    const file = join(app.getPath('userData'), CACHE_FILE);
    writeFileSync(file, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save license cache:', err);
  }
}

export function registerLicenseIpc(): void {
  ipcMain.handle('license:get-meta', () => {
    return getCachedLicense();
  });

  ipcMain.handle('license:activate', async (_, { key, cloudApiUrl }: { key: string; cloudApiUrl?: string }) => {
    try {
      const hwid = getHardwareId();
      const schemaId = schemaIdForLicenseKey(key);

      // If cloudApiUrl is provided, verify against license-server
      if (cloudApiUrl) {
        const response = await fetch(`${cloudApiUrl.replace(/\/+$/, '')}/api/license/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, hwid }),
        });

        if (!response.ok) {
          const json: any = await response.json().catch(() => ({}));
          throw new Error(json.message || 'License activation failed.');
        }
      }

      saveCachedLicense({
        key,
        hwid,
        schemaId,
        isActivated: true,
        databaseMode: cloudApiUrl ? 'online' : 'local',
        cloudApiUrl,
      });

      return { ok: true, schemaId };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  });
}
