import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { getWebLicenseApiBase } from '@/lib/webLicense';

export interface LicenseModules {
  fastfood: boolean;
  omnimart: boolean;
  kitchen: boolean;
  catalog: boolean;
  inventory: boolean;
  khata: boolean;
  expenses: boolean;
  reports: boolean;
  webStore: boolean;
  admin: boolean;
  [key: string]: boolean;
}

export const MODULE_KEYS = [
  'fastfood',
  'omnimart',
  'kitchen',
  'catalog',
  'inventory',
  'khata',
  'expenses',
  'reports',
  'webStore',
  'admin',
] as const satisfies ReadonlyArray<keyof LicenseModules>;

export const DEFAULT_FALLBACK_MODULES: LicenseModules = {
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

export const NO_MODULES_ENABLED: LicenseModules = {
  fastfood: false,
  omnimart: false,
  kitchen: false,
  catalog: false,
  inventory: false,
  khata: false,
  expenses: false,
  reports: false,
  webStore: false,
  admin: false,
};

export function normalizeLicenseModules(
  data?: Record<string, boolean> | null,
): LicenseModules {
  const next = { ...DEFAULT_FALLBACK_MODULES };
  if (!data || typeof data !== 'object') return next;
  for (const key of MODULE_KEYS) {
    if (typeof data[key] === 'boolean') {
      next[key] = data[key] === true;
    }
  }
  return next;
}

interface LicenseModulesContextValue {
  modules: LicenseModules;
  loaded: boolean;
  refreshModules: () => Promise<void>;
  can: (key: keyof LicenseModules) => boolean;
}

const LicenseModulesContext = createContext<LicenseModulesContextValue>({
  modules: DEFAULT_FALLBACK_MODULES,
  loaded: false,
  refreshModules: async () => undefined,
  can: () => true,
});

function modulesEqual(a: LicenseModules, b: LicenseModules): boolean {
  return MODULE_KEYS.every((key) => a[key] === b[key]);
}

export function LicenseModulesProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [modules, setModules] = useState<LicenseModules>(() => {
    try {
      const saved = localStorage.getItem('omnipos_cached_modules');
      if (saved) return normalizeLicenseModules(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    return DEFAULT_FALLBACK_MODULES;
  });
  const [loaded, setLoaded] = useState(false);

  const refreshModules = useCallback(async () => {
    try {
      let data: Record<string, boolean> | null = null;
      if (window.posApi?.license?.modules) {
        data = await window.posApi.license.modules();
      } else {
        const savedKey = localStorage.getItem('omnipos_active_key');
        if (savedKey) {
          const apiBase = getWebLicenseApiBase();
          const res = await fetch(`${apiBase}/license/modules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: savedKey }),
          });
          if (res.ok) {
            const j = await res.json();
            if (j.ok && j.modules) {
              data = j.modules;
            }
          }
        }
      }

      if (data) {
        const next = normalizeLicenseModules(data);
        setModules((prev) => (modulesEqual(prev, next) ? prev : next));
        localStorage.setItem('omnipos_cached_modules', JSON.stringify(next));
      }
    } catch (err) {
      console.warn('[LicenseModules] Failed to fetch latest modules:', err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refreshModules();

    const onOnline = () => void refreshModules();
    const onFocus = () => void refreshModules();

    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(() => void refreshModules(), 30_000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, [refreshModules]);

  const can = useCallback(
    (key: keyof LicenseModules) => modules[key] === true,
    [modules],
  );

  const value = useMemo(
    () => ({ modules, loaded, refreshModules, can }),
    [loaded, modules, refreshModules, can],
  );

  return (
    <LicenseModulesContext.Provider value={value}>
      {children}
    </LicenseModulesContext.Provider>
  );
}

export function useLicenseModules(): LicenseModules {
  return useContext(LicenseModulesContext).modules;
}

export function useLicenseModulesLoaded(): boolean {
  return useContext(LicenseModulesContext).loaded;
}

export function useRefreshLicenseModules(): () => Promise<void> {
  return useContext(LicenseModulesContext).refreshModules;
}

export function useLicense(): LicenseModulesContextValue {
  return useContext(LicenseModulesContext);
}
