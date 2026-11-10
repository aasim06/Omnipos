import React from 'react';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';

/**
 * Windows 11 card for a key number: label (Body Strong), value (28px semibold),
 * small neutral icon, optional footer line. Colour is only used on the value
 * when it carries meaning (success / warning / danger).
 */
const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    boxSizing: 'border-box',
    borderRadius: tokens.borderRadiusLarge, // 8px
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    minWidth: 0,
  },
  top: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  label: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  icon: {
    width: '32px',
    height: '32px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    '& svg': { width: '20px', height: '20px' },
  },
  valueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    minWidth: 0,
  },
  value: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeHero800,
    lineHeight: tokens.lineHeightHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  success: { color: tokens.colorStatusSuccessForeground1 },
  warning: { color: tokens.colorStatusWarningForeground1 },
  danger: { color: tokens.colorStatusDangerForeground1 },
  unit: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  footer: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200, // 12px — Caption
    lineHeight: tokens.lineHeightBase200,
    color: tokens.colorNeutralForeground2,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
});

export interface KpiTileProps {
  label: string;
  value: React.ReactNode;
  unit?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function KpiTile({ label, value, unit, icon, footer, tone = 'neutral', className }: KpiTileProps): React.JSX.Element {
  const styles = useStyles();
  return (
    <section className={mergeClasses(styles.root, className)} aria-label={label}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon} aria-hidden>{icon}</span>}
      </div>
      <div className={styles.valueRow}>
        <span className={mergeClasses(styles.value, tone !== 'neutral' && styles[tone])}>{value}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  );
}
