/**
 * Helper for License & Device identification in both Web Browser and Electron environments.
 */

export function getOrCreateBrowserHwid(): string {
  if (typeof window === 'undefined') return 'WEB-SERVER-NODE';
  let id = localStorage.getItem('omnipos_browser_hwid');
  if (!id) {
    const randomHex =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 13).toUpperCase()
        : Math.random().toString(36).substring(2, 12).toUpperCase();
    id = `WEB-${randomHex}`;
    localStorage.setItem('omnipos_browser_hwid', id);
  }
  return id;
}

export function getBrowserDeviceName(): string {
  if (typeof window === 'undefined') return 'Web POS Terminal';
  const isWin = navigator.userAgent.includes('Windows');
  const isMac = navigator.userAgent.includes('Macintosh');
  const os = isWin ? 'Windows' : isMac ? 'Mac' : 'Chrome/Linux';
  return `Web Counter (${os} Browser)`;
}

export function getWebLicenseApiBase(): string {
  // Check env first
  const envUrl =
    (import.meta as any).env?.VITE_CLOUD_API_URL ||
    (import.meta as any).env?.VITE_API_URL ||
    'https://omni-server-seven.vercel.app';

  const clean = String(envUrl).trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}
