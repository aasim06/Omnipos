import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export interface UpdateProgressInfo {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
  phase: 'starting' | 'downloading' | 'idle';
  label?: string;
}

export interface UpdateContextType {
  currentVersion: string;
  progress: number;
  progressInfo: UpdateProgressInfo;
  isChecking: boolean;
  isDownloading: boolean;
  isReady: boolean;
  error: string | null;
  checkForUpdates: () => Promise<any>;
  installUpdate: () => void;
  clearError: () => void;
  formatSpeed: (bytesPerSec: number) => string;
}

const idleProgress: UpdateProgressInfo = {
  percent: 0,
  transferred: 0,
  total: 0,
  bytesPerSecond: 0,
  phase: 'idle',
};

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

function normalizeProgress(raw: number | Record<string, unknown> | undefined): UpdateProgressInfo {
  if (typeof raw === 'number') {
    return {
      percent: Math.round(raw),
      transferred: 0,
      total: 0,
      bytesPerSecond: 0,
      phase: raw > 0 ? 'downloading' : 'starting',
    };
  }
  if (raw && typeof raw === 'object') {
    const percent = Math.round(Number(raw.percent) || 0);
    return {
      percent,
      transferred: Number(raw.transferred) || 0,
      total: Number(raw.total) || 0,
      bytesPerSecond: Number(raw.bytesPerSecond) || 0,
      phase: (raw.phase as UpdateProgressInfo['phase']) || (percent > 0 ? 'downloading' : 'starting'),
      label: typeof raw.label === 'string' ? raw.label : undefined,
    };
  }
  return { ...idleProgress, phase: 'starting' };
}

function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
  if (bytesPerSec >= 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
}

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
  const [progress, setProgress] = useState<number>(0);
  const [progressInfo, setProgressInfo] = useState<UpdateProgressInfo>(idleProgress);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkInFlight = useRef(false);

  useEffect(() => {
    // Fetch current app version from Electron
    if (window.posApi?.update?.getVersion) {
      window.posApi.update.getVersion().then((v) => {
        if (v) setCurrentVersion(v);
      }).catch(() => {});
    }

    const updateApi = window.posApi?.update;
    if (!updateApi) return;

    const unsubAvailable = updateApi.onAvailable?.(() => {
      setIsChecking(false);
      setIsDownloading(true);
      setIsReady(false);
      setError(null);
      setProgress(0);
      setProgressInfo({ ...idleProgress, phase: 'starting' });
    });

    const unsubProgress = updateApi.onProgress?.((raw: any) => {
      const info = normalizeProgress(raw);
      setIsChecking(false);
      setIsDownloading(true);
      setError(null);
      setProgress(info.percent);
      setProgressInfo(info);
    });

    const unsubReady = updateApi.onReady?.(() => {
      setIsChecking(false);
      setIsDownloading(false);
      setIsReady(true);
      setProgress(100);
      setProgressInfo({
        percent: 100,
        transferred: 0,
        total: 0,
        bytesPerSecond: 0,
        phase: 'idle',
      });
      setError(null);
    });

    const unsubError = updateApi.onError?.((errMessage: string) => {
      setIsChecking(false);
      setIsDownloading(false);
      setProgress(0);
      setProgressInfo(idleProgress);
      setError(errMessage || 'An error occurred during update.');
    });

    return () => {
      if (typeof unsubAvailable === 'function') unsubAvailable();
      if (typeof unsubProgress === 'function') unsubProgress();
      if (typeof unsubReady === 'function') unsubReady();
      if (typeof unsubError === 'function') unsubError();
    };
  }, []);

  const checkForUpdates = async () => {
    if (!window.posApi?.update?.check) return { disabled: true, error: 'Updater only available in Electron app.' };
    if (checkInFlight.current || isDownloading) return;

    checkInFlight.current = true;
    setIsChecking(true);
    setError(null);

    try {
      const res = await window.posApi.update.check();
      if (res === 'available' || (typeof res === 'object' && (res as any)?.updateInfo)) {
        setIsDownloading(true);
        setIsReady(false);
        setProgress(0);
        setProgressInfo({ ...idleProgress, phase: 'starting' });
      } else {
        setIsDownloading(false);
        setProgress(0);
        setProgressInfo(idleProgress);
      }
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Failed to check for updates';
      setError(msg);
      return { error: msg };
    } finally {
      checkInFlight.current = false;
      setIsChecking(false);
    }
  };

  const installUpdate = () => {
    window.posApi?.update?.install?.();
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <UpdateContext.Provider
      value={{
        currentVersion,
        progress,
        progressInfo,
        isChecking,
        isDownloading,
        isReady,
        error,
        checkForUpdates,
        installUpdate,
        clearError,
        formatSpeed,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
};

export const useUpdate = (): UpdateContextType => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
};
