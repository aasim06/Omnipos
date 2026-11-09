import React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';

/**
 * Windows 11 page header: Title (28px semibold), optional one-line description,
 * and page commands on the right. No badges or decorative chips — that is how
 * Settings, Store and other inbox apps head their pages.
 */
const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    columnGap: '24px',
    rowGap: '12px',
    paddingTop: '28px',
    paddingBottom: '20px',
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeHero800, // 28px — Win11 "Title"
    lineHeight: tokens.lineHeightHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    margin: 0,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300, // 14px — Body
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground2,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
});

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Page commands, e.g. one primary Button and a few secondary ones. */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps): React.JSX.Element {
  const styles = useStyles();
  return (
    <header className={className ? `${styles.root} ${className}` : styles.root}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
