import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import {
  FluentProvider,
  Theme,
  createLightTheme,
  createDarkTheme,
  BrandVariants,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNotificationProvider } from '../context/AppNotificationContext';
import { UpdateProvider } from '../context/UpdateContext';
import { UpdateBanner } from '../components/UpdateBanner';
import { TitleBar } from '../components/shell/TitleBar';
import { getWindowChrome } from '../lib/windowChrome';

const useStyles = makeStyles({
  // Window frame: title bar on top, app content fills the rest.
  rootProvider: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  // Mica: keep the frame transparent so the Windows 11 backdrop shows through.
  rootProviderMica: {
    backgroundColor: 'transparent',
  },
  appBody: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
  },
});

// Microsoft Fluent 2 Red Brand Accent (#E51937)
const fluentRedBrand: BrandVariants = {
  10: '#0B0102',
  20: '#220407',
  30: '#3D070D',
  40: '#530A12',
  50: '#6C0D18',
  60: '#89111F',
  70: '#A71527',
  80: '#C6172E',
  90: '#E51937', // Core Brand Accent
  100: '#EC3953',
  110: '#F15A70',
  120: '#F57B8C',
  130: '#F89BA8',
  140: '#FBBBC4',
  150: '#FDDCE0',
  160: '#FEEDF0',
};

// ── Windows 11 (WinUI 3 / Fluent 2) themes ─────────────────────────────
// Neutral values follow the WinUI 3 colour resources; Omnipos red is used only
// as the accent (primary buttons, selection indicator, focus).
//   colorNeutralBackground1 = card / layer surface
//   colorNeutralBackground2 = app frame (Mica base when Mica is unavailable)
export const WIN11_FONT =
  "'Segoe UI Variable Text', 'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

const win11Shape = {
  fontFamilyBase: WIN11_FONT,
  borderRadiusSmall: '2px',
  borderRadiusMedium: '4px', // ControlCornerRadius (buttons, inputs)
  borderRadiusLarge: '8px', // OverlayCornerRadius (cards, flyouts)
  borderRadiusXLarge: '8px', // Dialogs are 8px in Windows 11
};

export const fluentMicaLightTheme: Theme = {
  ...createLightTheme(fluentRedBrand),
  ...win11Shape,
  colorBrandBackground: '#E51937',
  colorBrandBackgroundHover: '#C6172E',
  colorBrandBackgroundPressed: '#A71527',
  colorBrandForeground1: '#C6172E',
  colorBrandForeground2: '#A71527',
  colorNeutralBackground1: '#FFFFFF', // Card / layer
  colorNeutralBackground2: '#F3F3F3', // SolidBackgroundFillColorBase (Mica light)
  colorNeutralBackground3: '#EEEEEE', // SolidBackgroundFillColorSecondary
  colorNeutralBackground4: '#E9E9E9', // Subtle hover
  colorNeutralBackground5: '#E0E0E0', // Subtle pressed
  colorNeutralStroke1: '#E0E0E0', // ControlStrokeColorDefault (solid)
  colorNeutralStroke2: '#EBEBEB', // CardStrokeColorDefault / dividers
  colorNeutralForeground1: '#1A1A1A', // TextFillColorPrimary
  colorNeutralForeground2: '#5D5D5D', // TextFillColorSecondary
  colorNeutralForeground3: '#8A8A8A', // TextFillColorTertiary
};

export const fluentMicaDarkTheme: Theme = {
  ...createDarkTheme(fluentRedBrand),
  ...win11Shape,
  colorBrandBackground: '#E51937',
  colorBrandBackgroundHover: '#EC3953',
  colorBrandBackgroundPressed: '#C6172E',
  colorBrandForeground1: '#F15A70',
  colorBrandForeground2: '#F57B8C',
  colorNeutralBackground1: '#2B2B2B', // CardBackgroundFillColorDefault over Mica dark
  colorNeutralBackground2: '#202020', // SolidBackgroundFillColorBase (Mica dark)
  colorNeutralBackground3: '#272727', // Secondary surface / table header
  colorNeutralBackground4: '#323232', // Subtle hover
  colorNeutralBackground5: '#3A3A3A', // Subtle pressed
  colorNeutralStroke1: '#3A3A3A', // ControlStrokeColorDefault (solid)
  colorNeutralStroke2: '#333333', // CardStrokeColorDefault / dividers
  colorNeutralForeground1: '#FFFFFF', // TextFillColorPrimary
  colorNeutralForeground2: '#CFCFCF', // TextFillColorSecondary
  colorNeutralForeground3: '#9A9A9A', // TextFillColorTertiary
};

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  toggleTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: 'always',
      refetchOnReconnect: true,
      networkMode: 'always',
    },
    mutations: {
      networkMode: 'always',
    },
  },
});

// Global Realtime Listeners for instant cross-view revalidation
if (typeof window !== 'undefined') {
  window.addEventListener('pos_khata_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['khatas'] });
    queryClient.refetchQueries({ queryKey: ['khatas'] });
  });
  window.addEventListener('pos_orders_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['all-orders-directory'] });
    queryClient.refetchQueries({ queryKey: ['all-orders-directory'] });
    queryClient.refetchQueries({ queryKey: ['orders'] });
  });
  window.addEventListener('pos_inventory_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.refetchQueries({ queryKey: ['products'] });
    queryClient.refetchQueries({ queryKey: ['categories'] });
  });
  window.addEventListener('pos_quotations_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['quotations'] });
    queryClient.refetchQueries({ queryKey: ['quotations'] });
  });
}

export function AppProviders({ children }: PropsWithChildren): React.JSX.Element {
  const styles = useStyles();
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('omnipos-theme');
    // Default to 'dark'
    if (saved === 'light') return 'light';
    return 'dark';
  });

  const chrome = getWindowChrome();

  React.useEffect(() => {
    // With Mica the page must stay transparent; otherwise paint the Win11 base colour.
    const frame = chrome.mica ? 'transparent' : mode === 'dark' ? '#202020' : '#F3F3F3';
    document.documentElement.style.backgroundColor = frame;
    document.body.style.backgroundColor = frame;
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.toggleAttribute('data-mica', chrome.mica);
    // Sync Mica tint + native caption button colours with the app theme.
    chrome.setTheme(mode);
  }, [mode, chrome.mica]);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('omnipos-theme', next);
      return next;
    });
  };

  const currentTheme = mode === 'dark' ? fluentMicaDarkTheme : fluentMicaLightTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ mode, toggleTheme }}>
        <FluentProvider
          theme={currentTheme}
          className={mergeClasses(styles.rootProvider, chrome.mica && styles.rootProviderMica)}
        >
          <TitleBar />
          <div className={styles.appBody}>
            <AppNotificationProvider>
              <UpdateProvider>
                {children}
                <UpdateBanner />
              </UpdateProvider>
            </AppNotificationProvider>
          </div>
        </FluentProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
