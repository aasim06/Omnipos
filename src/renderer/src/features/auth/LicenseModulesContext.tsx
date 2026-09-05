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

import { CategoryProfile } from '@shared/types';

export const ALL_VALID_PROFILES: CategoryProfile[] = ['standard', 'apparel', 'footwear', 'hardware', 'food'];

export function normalizeBusinessProfiles(
  profiles?: any,
  modules?: LicenseModules
): CategoryProfile[] {
  if (Array.isArray(profiles) && profiles.length > 0) {
    const valid = profiles.filter((p): p is CategoryProfile => ALL_VALID_PROFILES.includes(p as CategoryProfile));
    if (valid.length > 0) return valid;
  }
  if (modules) {
    if (modules.fastfood && !modules.omnimart) return ['food'];
    if (!modules.fastfood && modules.omnimart) return ['standard'];
    if (modules.fastfood && modules.omnimart) return ['food', 'standard'];
  }
  return ['standard', 'food'];
}

export function normalizeLicenseModules(
  data?: any,
): LicenseModules {
  const next = { ...DEFAULT_FALLBACK_MODULES };
  if (!data || typeof data !== 'object') return next;
  const raw: Record<string, any> =
    'modules' in data && data.modules && typeof data.modules === 'object'
      ? (data.modules as Record<string, any>)
      : (data as Record<string, any>);
  for (const key of MODULE_KEYS) {
    if (typeof raw[key] === 'boolean') {
      next[key] = raw[key] === true;
    }
  }
  return next;
}

interface LicenseModulesContextValue {
  modules: LicenseModules;
  businessProfiles: CategoryProfile[];
  loaded: boolean;
  refreshModules: () => Promise<void>;
  can: (key: keyof LicenseModules) => boolean;
  hasProfile: (profile: CategoryProfile) => boolean;
}

const LicenseModulesContext = createContext<LicenseModulesContextValue>({
  modules: DEFAULT_FALLBACK_MODULES,
  businessProfiles: ['standard', 'food'],
  loaded: false,
  refreshModules: async () => undefined,
  can: () => true,
  hasProfile: () => true,
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

  const [businessProfiles, setBusinessProfiles] = useState<CategoryProfile[]>(() => {
    try {
      const saved = localStorage.getItem('omnipos_business_profiles');
      if (saved) return normalizeBusinessProfiles(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    return ['standard', 'food'];
  });

  const [loaded, setLoaded] = useState(false);

  const refreshModules = useCallback(async () => {
    try {
      let rawModules: Record<string, boolean> | null = null;
      let rawProfiles: string[] | null = null;

      if (window.posApi?.license?.modules) {
        const resp: any = await window.posApi.license.modules();
        if (resp && typeof resp === 'object') {
          if ('modules' in resp && resp.modules) {
            rawModules = resp.modules;
            rawProfiles = resp.businessProfiles || null;
          } else {
            rawModules = resp;
          }
        }
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
            if (j.ok) {
              rawModules = j.modules || null;
              rawProfiles = j.businessProfiles || null;
            }
          }
        }
      }

      if (rawModules) {
        const nextModules = normalizeLicenseModules(rawModules);
        setModules((prev) => (modulesEqual(prev, nextModules) ? prev : nextModules));
        localStorage.setItem('omnipos_cached_modules', JSON.stringify(nextModules));

        const nextProfiles = normalizeBusinessProfiles(rawProfiles, nextModules);
        setBusinessProfiles(nextProfiles);
        localStorage.setItem('omnipos_business_profiles', JSON.stringify(nextProfiles));
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

  const hasProfile = useCallback(
    (profile: CategoryProfile) => businessProfiles.includes(profile),
    [businessProfiles],
  );

  const value = useMemo(
    () => ({ modules, businessProfiles, loaded, refreshModules, can, hasProfile }),
    [loaded, modules, businessProfiles, refreshModules, can, hasProfile],
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

export function useBusinessProfiles(): CategoryProfile[] {
  return useContext(LicenseModulesContext).businessProfiles;
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
