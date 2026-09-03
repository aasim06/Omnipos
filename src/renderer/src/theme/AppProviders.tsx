import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import {
  FluentProvider,
  Theme,
  createLightTheme,
  createDarkTheme,
  BrandVariants,
} from '@fluentui/react-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

// Fluent UI v9 Mica Light Desktop Theme
// colorNeutralBackground1 = card container surfaces (#FFFFFF)
// colorNeutralBackground2 = app frame / Mica base (#F5F5F5)
export const fluentMicaLightTheme: Theme = {
  ...createLightTheme(fluentRedBrand),
  colorBrandBackground: '#E51937',
  colorBrandBackgroundHover: '#C6172E',
  colorBrandBackgroundPressed: '#A71527',
  colorBrandForeground1: '#E51937',
  colorBrandForeground2: '#C6172E',
  // Fluent v9 strict token values:
  colorNeutralBackground1: '#FFFFFF',  // Card containers / elevated surfaces
  colorNeutralBackground2: '#F5F5F5',  // App frame base / Mica tint layer
  colorNeutralBackground3: '#EBEBEB',  // Sidebar rail / segmented control track
  colorNeutralBackground4: '#E0E0E0',  // Hover surface
  colorNeutralBackground5: '#D6D6D6',  // Pressed surface
  colorNeutralStroke1: '#D1D1D1',      // Standard Fluent hairline border
  colorNeutralStroke2: '#C7C7C7',      // Dividers
  colorNeutralForeground1: '#1A1A1A',  // Primary text
  colorNeutralForeground2: '#616161',  // Secondary / subtitle text
  colorNeutralForeground3: '#8A8A8A',  // Muted / placeholder text
  fontFamilyBase: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI Variable', 'Segoe UI', sans-serif",
  borderRadiusSmall: '4px',   // Standard Fluent v9 small
  borderRadiusMedium: '8px',  // Standard Fluent v9 medium (input fields, cards)
  borderRadiusLarge: '12px',  // Container-level radius
  borderRadiusXLarge: '16px', // Dialog / panel radius
};

export const fluentMicaDarkTheme: Theme = {
  ...createDarkTheme(fluentRedBrand),
  colorBrandBackground: '#E51937',
  colorBrandBackgroundHover: '#EC3953',
  colorBrandForeground1: '#F15A70',
  colorNeutralBackground1: '#16171A',  // Card containers in dark
  colorNeutralBackground2: '#0F1012',  // App frame / page background in dark
  colorNeutralBackground3: '#1A1B1F',  // Secondary surface / table header
  colorNeutralBackground4: '#24252B',  // Hover in dark
  colorNeutralBackground5: '#2F3038',  // Pressed
  colorNeutralStroke1: '#26272D',      // Subtle hairline border
  colorNeutralStroke2: '#33343C',      // Dividers
  colorNeutralForeground1: '#F8FAFC',  // Primary text
  colorNeutralForeground2: '#94A3B8',  // Secondary / subtitle text
  colorNeutralForeground3: '#64748B',  // Muted / placeholder text
  fontFamilyBase: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI Variable', 'Segoe UI', sans-serif",
  borderRadiusSmall: '4px',
  borderRadiusMedium: '8px',
  borderRadiusLarge: '12px',
  borderRadiusXLarge: '16px',
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: PropsWithChildren): React.JSX.Element {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('omnipos-theme');
    // Default to 'dark'
    if (saved === 'light') return 'light';
    return 'dark';
  });

  React.useEffect(() => {
    document.documentElement.style.backgroundColor = mode === 'dark' ? '#0F1012' : '#F5F5F5';
    document.body.style.backgroundColor = mode === 'dark' ? '#0F1012' : '#F5F5F5';
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

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
        <FluentProvider theme={currentTheme} style={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden' }}>
          {children}
        </FluentProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
