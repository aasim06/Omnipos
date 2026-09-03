import { app, ipcMain } from 'electron';
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import nodeMachineId from 'node-machine-id';

const { machineIdSync } = (nodeMachineId as any)?.default || nodeMachineId || {};

const DEFAULT_SERVER_URL =
  process.env.VITE_CLOUD_API_URL ||
  process.env.VITE_API_URL ||
  process.env.API_BASE_URL ||
  'https://omni-server-seven.vercel.app';

function getLicenseApiBase(): string {
  const base = DEFAULT_SERVER_URL.trim().replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

function getLicenseFilePath(): string {
  return join(app.getPath('userData'), 'license.dat');
}

function getModulesCacheFilePath(): string {
  return join(app.getPath('userData'), 'license-modules.json');
}

function getLicenseCacheFilePath(): string {
  return join(app.getPath('userData'), 'license-cache.json');
}

function getSupportCacheFilePath(): string {
  return join(app.getPath('userData'), 'omnipos-support.json');
}

export interface LicenseDevice {
  hwid: string;
  deviceName: string;
}

export type DatabaseMode = 'local' | 'online';

export type LicenseCache = {
  key: string;
  userName?: string;
  expiresAt: string | null;
  licenseType?: 'monthly' | 'annual' | 'lifetime';
  activatedAt: string;
  updatedAt: string;
  databaseMode?: DatabaseMode;
  schemaId?: string | null;
  lastGate?: 'ok' | 'blocked';
  lastReason?: string;
};

export type LicenseGate =
  | { state: 'ok'; modules?: Record<string, boolean> }
  | { state: 'none' }
  | { state: 'blocked'; reason: string };

export type OmniSupportContact = { phone: string; email: string };

const DISABLED_FALLBACK = 'This license has been disabled. Contact OmniPos customer support.';
const EXPIRED_REASON = 'License has expired. Contact OmniPos customer support.';

export function getHardwareId(): string {
  try {
    if (typeof machineIdSync === 'function') {
      return machineIdSync(true);
    }
    return 'omnipos-hwid-' + os.hostname();
  } catch {
    return 'omnipos-generic-hwid';
  }
}

export function getDeviceName(): string {
  try {
    return os.hostname() || 'Unknown Terminal';
  } catch {
    return 'Unknown Terminal';
  }
}

export function schemaIdForLicenseKey(key: string): string {
  const normalized = String(key || '').trim().toUpperCase();
  if (!normalized) return '';
  const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  return `lic_${hash}`;
}

export function getSavedKey(): string | null {
  try {
    const file = getLicenseFilePath();
    if (existsSync(file)) {
      const key = readFileSync(file, 'utf-8').trim();
      if (key) return key;
    }
  } catch {
    /* ignore */
  }

  try {
    const cacheFile = getLicenseCacheFilePath();
    if (!existsSync(cacheFile)) return null;
    const cache = JSON.parse(readFileSync(cacheFile, 'utf-8')) as LicenseCache;
    const key = String(cache.key || '').trim();
    if (!key) return null;
    try {
      writeFileSync(getLicenseFilePath(), key, 'utf-8');
    } catch {
      /* ignore */
    }
    return key;
  } catch {
    return null;
  }
}

function getLicenseCache(key: string): LicenseCache | null {
  try {
    const file = getLicenseCacheFilePath();
    if (!existsSync(file)) return null;
    const cache = JSON.parse(readFileSync(file, 'utf-8')) as LicenseCache;
    if (cache.key !== key) return null;
    return cache;
  } catch {
    return null;
  }
}

function rememberGate(key: string, lastGate: 'ok' | 'blocked', lastReason?: string): void {
  try {
    const existing = getLicenseCache(key);
    const cache: LicenseCache = {
      key,
      userName: existing?.userName,
      expiresAt: existing?.expiresAt ?? null,
      licenseType: existing?.licenseType,
      activatedAt: existing?.activatedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      databaseMode: existing?.databaseMode ?? 'online',
      schemaId: existing?.schemaId ?? null,
      lastGate,
      lastReason: lastGate === 'ok' ? undefined : lastReason || existing?.lastReason,
    };
    writeFileSync(getLicenseCacheFilePath(), JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    /* ignore */
  }
}

function isLocallyExpired(key: string): boolean {
  const cache = getLicenseCache(key);
  if (!cache || !cache.expiresAt) return false;
  const end = new Date(cache.expiresAt);
  if (Number.isNaN(end.getTime())) return false;
  return Date.now() > end.getTime();
}

function clearLocalLicense(): void {
  for (const file of [getLicenseFilePath(), getModulesCacheFilePath(), getLicenseCacheFilePath()]) {
    try {
      if (existsSync(file)) unlinkSync(file);
    } catch {
      /* ignore */
    }
  }
}

// ── Modules System ──────────────────────────────────────────────────────────────

export const DEFAULT_MODULE_FALLBACKS: Record<string, boolean> = {
  fastfood: true,
  omnimart: true,
  kitchen: true,
  catalog: true,
  inventory: true,
  khata: true,
  expenses: true,
  reports: true,
  webStore: false,
  admin: true,
};

type ModulesCache = { key: string; modules: Record<string, boolean>; updatedAt: string };

function getCachedModules(key: string): Record<string, boolean> | null {
  try {
    const file = getModulesCacheFilePath();
    if (!existsSync(file)) return null;
    const cache = JSON.parse(readFileSync(file, 'utf-8')) as ModulesCache;
    if (cache.key !== key || !cache.modules || typeof cache.modules !== 'object') return null;
    return cache.modules;
  } catch {
    return null;
  }
}

function saveModulesCache(key: string, modules: Record<string, boolean>): void {
  try {
    writeFileSync(
      getModulesCacheFilePath(),
      JSON.stringify({ key, modules, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8',
    );
  } catch {
    /* ignore */
  }
}

function normalizeModulesPayload(modules?: Record<string, boolean> | null): Record<string, boolean> {
  const out: Record<string, boolean> = { ...DEFAULT_MODULE_FALLBACKS };
  if (modules && typeof modules === 'object') {
    for (const k of Object.keys(DEFAULT_MODULE_FALLBACKS)) {
      if (typeof modules[k] === 'boolean') {
        out[k] = modules[k];
      }
    }
  }
  return out;
}

export function isLicenseModuleEnabled(moduleKey: string): boolean {
  const savedKey = getSavedKey();
  if (!savedKey) return DEFAULT_MODULE_FALLBACKS[moduleKey] ?? false;
  if (isLocallyExpired(savedKey)) return false;

  const modules = getCachedModules(savedKey);
  if (!modules) {
    void getLicenseModules().catch(() => {});
    return DEFAULT_MODULE_FALLBACKS[moduleKey] ?? false;
  }
  return modules[moduleKey] === true;
}

export async function getLicenseModules(): Promise<Record<string, boolean> | null> {
  const savedKey = getSavedKey();
  if (!savedKey) return null;
  if (isLocallyExpired(savedKey)) return null;

  try {
    const response = await fetch(`${getLicenseApiBase()}/license/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: savedKey }),
    });

    const data = (await response.json()) as {
      ok: boolean;
      modules?: Record<string, boolean>;
      expiresAt?: string | null;
      error?: string;
    };

    if (data.ok && data.modules) {
      const normalized = normalizeModulesPayload(data.modules);
      saveModulesCache(savedKey, normalized);
      return normalized;
    }

    const cached = getCachedModules(savedKey);
    return cached ? normalizeModulesPayload(cached) : normalizeModulesPayload(null);
  } catch {
    if (isLocallyExpired(savedKey)) return null;
    const cached = getCachedModules(savedKey);
    return cached ? normalizeModulesPayload(cached) : normalizeModulesPayload(null);
  }
}

// ── License Gate Validation ───────────────────────────────────────────────────

export async function getLicenseGate(): Promise<LicenseGate> {
  const savedKey = getSavedKey();
  if (!savedKey) return { state: 'none' };

  try {
    const hwid = getHardwareId();
    const response = await fetch(`${getLicenseApiBase()}/license/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: savedKey, hwid }),
    });

    const data = (await response.json()) as {
      ok: boolean;
      valid: boolean;
      error?: string;
      code?: string;
      modules?: Record<string, boolean>;
      expiresAt?: string | null;
      userName?: string;
    };

    if (!data.valid || response.status !== 200) {
      if (data.code === 'not_found' || response.status === 404) {
        clearLocalLicense();
        return { state: 'none' };
      }

      const reason = String(data.error || '').trim() || DISABLED_FALLBACK;
      rememberGate(savedKey, 'blocked', reason);
      return { state: 'blocked', reason };
    }

    // License is valid
    const existing = getLicenseCache(savedKey);
    const updatedCache: LicenseCache = {
      key: savedKey,
      userName: data.userName || existing?.userName,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : (existing?.expiresAt ?? null),
      activatedAt: existing?.activatedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      databaseMode: 'online',
      schemaId: schemaIdForLicenseKey(savedKey),
      lastGate: 'ok',
    };
    writeFileSync(getLicenseCacheFilePath(), JSON.stringify(updatedCache, null, 2), 'utf-8');

    if (data.modules) {
      saveModulesCache(savedKey, normalizeModulesPayload(data.modules));
    }

    return { state: 'ok', modules: data.modules };
  } catch {
    // Offline resilience
    const cache = getLicenseCache(savedKey);
    if (isLocallyExpired(savedKey)) {
      return { state: 'blocked', reason: EXPIRED_REASON };
    }
    if (cache?.lastGate === 'blocked') {
      return { state: 'blocked', reason: cache.lastReason || DISABLED_FALLBACK };
    }
    return { state: 'ok', modules: getCachedModules(savedKey) || undefined };
  }
}

export async function getOmniSupport(): Promise<OmniSupportContact> {
  try {
    const response = await fetch(`${getLicenseApiBase()}/license/support`);
    const data = (await response.json()) as { ok?: boolean; phone?: string; email?: string };
    const phone = String(data.phone || '').trim();
    const email = String(data.email || '').trim();
    if (phone || email) {
      try {
        writeFileSync(getSupportCacheFilePath(), JSON.stringify({ phone, email }), 'utf-8');
      } catch {
        /* ignore */
      }
      return { phone, email };
    }
  } catch {
    /* offline: read cache */
  }

  try {
    const cached = JSON.parse(readFileSync(getSupportCacheFilePath(), 'utf-8')) as OmniSupportContact;
    return {
      phone: String(cached.phone || '+92 300 0000000').trim(),
      email: String(cached.email || 'support@omnipos.pk').trim(),
    };
  } catch {
    return { phone: '+92 300 0000000', email: 'support@omnipos.pk' };
  }
}

// ── IPC Registration ──────────────────────────────────────────────────────────

export function registerLicenseIpc(): void {
  ipcMain.handle('license:gate', async () => {
    return await getLicenseGate();
  });

  ipcMain.handle('license:status', async () => {
    const gate = await getLicenseGate();
    return gate.state === 'ok';
  });

  ipcMain.handle('license:modules', async () => {
    return await getLicenseModules();
  });

  ipcMain.handle('license:support', async () => {
    return await getOmniSupport();
  });

  ipcMain.handle('license:activate', async (_, keyInput: string | { key: string }) => {
    const rawKey = typeof keyInput === 'string' ? keyInput : keyInput?.key;
    const formattedKey = String(rawKey || '').trim().toUpperCase();
    if (!formattedKey) {
      return { ok: false, error: 'Please enter a valid OmniPos license key.' };
    }

    try {
      const hwid = getHardwareId();
      const deviceName = getDeviceName();

      const response = await fetch(`${getLicenseApiBase()}/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: formattedKey, hwid, deviceName }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        userName?: string;
        expiresAt?: string | null;
        modules?: Record<string, boolean>;
        schemaId?: string;
      };

      if (data.ok) {
        writeFileSync(getLicenseFilePath(), formattedKey, 'utf-8');

        const cache: LicenseCache = {
          key: formattedKey,
          userName: data.userName,
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
          activatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          databaseMode: 'online',
          schemaId: data.schemaId || schemaIdForLicenseKey(formattedKey),
          lastGate: 'ok',
        };
        writeFileSync(getLicenseCacheFilePath(), JSON.stringify(cache, null, 2), 'utf-8');

        if (data.modules) {
          saveModulesCache(formattedKey, normalizeModulesPayload(data.modules));
        }

        return { ok: true, schemaId: cache.schemaId };
      }

      return { ok: false, error: data.error || 'Activation failed.' };
    } catch {
      return { ok: false, error: 'Cannot reach OmniPos license server. Check internet connection.' };
    }
  });

  // Backward compatibility
  ipcMain.handle('license:get-meta', () => {
    const key = getSavedKey();
    const cache = key ? getLicenseCache(key) : null;
    return {
      key: key || '',
      hwid: getHardwareId(),
      schemaId: cache?.schemaId || (key ? schemaIdForLicenseKey(key) : ''),
      isActivated: Boolean(key && cache?.lastGate === 'ok'),
      databaseMode: cache?.databaseMode || 'online',
    };
  });
}
