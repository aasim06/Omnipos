/**
 * Desktop window chrome info exposed by the Electron preload.
 * In the web build (or non-Windows Electron) everything is off and the app
 * renders with a solid background and no custom title bar.
 */
export interface WindowChromeInfo {
  customTitleBar: boolean;
  mica: boolean;
  titleBarHeight: number;
  captionButtonsWidth: number;
  setTheme: (mode: 'light' | 'dark') => void;
}

const fallback: WindowChromeInfo = {
  customTitleBar: false,
  mica: false,
  titleBarHeight: 0,
  captionButtonsWidth: 0,
  setTheme: () => {},
};

export function getWindowChrome(): WindowChromeInfo {
  if (typeof window === 'undefined') return fallback;
  const chrome = window.posApi?.windowChrome;
  return chrome ? { ...fallback, ...chrome } : fallback;
}
