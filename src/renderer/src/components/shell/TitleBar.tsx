import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { getWindowChrome } from '@/lib/windowChrome';

/**
 * Windows 11 style title bar (like File Explorer / Settings).
 * The whole strip is a drag region; the native min / max / close buttons are drawn
 * by Windows on the right (Electron titleBarOverlay), so that width is left empty.
 */

const PAGE_TITLES: Array<[prefix: string, title: string]> = [
  ['/pos/fastfood', 'Fast Food POS'],
  ['/pos/omnimart', 'OmniMart POS'],
  ['/kitchen', 'Kitchen Display'],
  ['/khata', 'Khata'],
  ['/customers', 'Customers'],
  ['/inventory', 'Inventory'],
  ['/expenses', 'Expenses'],
  ['/reports', 'Reports'],
  ['/catalog/categories', 'Categories'],
  ['/catalog/new', 'Add product'],
  ['/catalog/barcode-labels', 'Barcode labels'],
  ['/catalog', 'Catalog'],
  ['/products', 'Products'],
  ['/product-details', 'Products'],
  ['/quotations', 'Quotations'],
  ['/web-store', 'Web Store'],
  ['/admin', 'Settings'],
  ['/dashboard', 'Dashboard'],
  ['/login', 'Sign in'],
];

function pageTitleFor(pathname: string): string | null {
  const match = PAGE_TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match ? match[1] : null;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    gap: '12px',
    paddingLeft: '16px',
    boxSizing: 'border-box',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    // Electron drag region (double-click maximises, Win+arrow snap etc. are native).
    WebkitAppRegion: 'drag',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200, // Win11 "Caption" 12px
    lineHeight: tokens.lineHeightBase200,
    color: tokens.colorNeutralForeground1,
    transitionProperty: 'color',
    transitionDuration: tokens.durationFast,
  } as any,
  inactive: {
    color: tokens.colorNeutralForegroundDisabled,
  },
  appIcon: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    background: 'linear-gradient(135deg, #FF1E3C 0%, #B30018 100%)',
    color: '#FFFFFF',
    fontSize: '9px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inactiveIcon: {
    opacity: 0.6,
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  separator: {
    color: tokens.colorNeutralForeground3,
  },
  pageTitle: {
    color: tokens.colorNeutralForeground2,
  },
});

export function TitleBar(): React.JSX.Element | null {
  const styles = useStyles();
  const { pathname } = useLocation();
  const chrome = getWindowChrome();
  const [windowActive, setWindowActive] = useState(() =>
    typeof document === 'undefined' ? true : document.hasFocus(),
  );

  // Windows dims the title text when the window loses focus.
  useEffect(() => {
    const onFocus = () => setWindowActive(true);
    const onBlur = () => setWindowActive(false);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  if (!chrome.customTitleBar) return null;

  const pageTitle = pageTitleFor(pathname);

  return (
    <header
      className={mergeClasses(styles.root, !windowActive && styles.inactive)}
      style={{ height: chrome.titleBarHeight, paddingRight: chrome.captionButtonsWidth }}
    >
      <div className={mergeClasses(styles.appIcon, !windowActive && styles.inactiveIcon)} aria-hidden>
        O
      </div>
      <div className={styles.titleGroup}>
        <span>Omnipos</span>
        {pageTitle && (
          <>
            <span className={styles.separator}>·</span>
            <span className={styles.pageTitle}>{pageTitle}</span>
          </>
        )}
      </div>
    </header>
  );
}
