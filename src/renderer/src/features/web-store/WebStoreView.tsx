import React from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Button,
  Subtitle1,
  Body1,
  Caption1,
  Badge,
  Skeleton,
  SkeletonItem,
} from '@fluentui/react-components';
import {
  Globe24Regular,
  ShoppingBag24Regular,
  Share20Regular,
} from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { posApi } from '@/lib/api';

const useStyles = makeStyles({
  container: {
    padding: '28px 32px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  card: {
    padding: '24px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    boxShadow: tokens.shadow4,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '640px',
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: '20px',
    color: tokens.colorNeutralForeground1,
    margin: 0,
    display: 'block',
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground2,
    margin: 0,
    display: 'block',
    fontSize: '13px',
  },
  storeHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  globeIcon: {
    fontSize: '40px',
    color: tokens.colorBrandForeground1,
  },
  menuTitle: {
    fontWeight: 700,
  },
  menuDesc: {
    color: tokens.colorNeutralForeground3,
    display: 'block',
  },
  linkCard: {
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
  },
  linkPrefix: {
    fontWeight: 600,
  },
  linkText: {
    color: tokens.colorBrandForeground1,
    wordBreak: 'break-all',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
  },
  skeletonColGap6: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  skW280H24R4: { width: '280px', height: '24px', borderRadius: '4px' },
  skW380H14R3: { width: '380px', height: '14px', borderRadius: '3px' },
  skW120H28R14: { width: '120px', height: '28px', borderRadius: '14px' },
  skW220H20R4: { width: '220px', height: '20px', borderRadius: '4px' },
  skW340H14R3: { width: '340px', height: '14px', borderRadius: '3px' },
  skW100H56R8: { width: '100%', height: '56px', borderRadius: '8px' },
  skRowGap12: { display: 'flex', gap: '12px' },
  skW140H36R6: { width: '140px', height: '36px', borderRadius: '6px' },
  skW130H36R6: { width: '130px', height: '36px', borderRadius: '6px' },
});

export function WebStoreView(): React.JSX.Element {
  const styles = useStyles();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
  });

  if (isLoading && products.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton animation="wave" className={styles.skeletonColGap6}>
            <SkeletonItem shape="rectangle" className={styles.skW280H24R4} />
            <SkeletonItem shape="rectangle" className={styles.skW380H14R3} />
          </Skeleton>
          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" className={styles.skW120H28R14} />
          </Skeleton>
        </div>

        <div className={styles.card}>
          <div className={styles.storeHeaderRow}>
            <Skeleton animation="wave">
              <SkeletonItem shape="circle" size={48} />
            </Skeleton>
            <Skeleton animation="wave" className={styles.skeletonColGap6}>
              <SkeletonItem shape="rectangle" className={styles.skW220H20R4} />
              <SkeletonItem shape="rectangle" className={styles.skW340H14R3} />
            </Skeleton>
          </div>

          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" className={styles.skW100H56R8} />
          </Skeleton>

          <Skeleton animation="wave" className={styles.skRowGap12}>
            <SkeletonItem shape="rectangle" className={styles.skW140H36R6} />
            <SkeletonItem shape="rectangle" className={styles.skW130H36R6} />
          </Skeleton>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Subtitle1 as="h1" className={styles.headerTitle}>
            Website POS / Online Store
          </Subtitle1>
          <Caption1 as="p" className={styles.headerSubtitle}>
            Customer online ordering menu connected live to your POS &amp; Kitchen
          </Caption1>
        </div>
        <Badge appearance="tint" color="success" size="large">
          Cloud Store Online
        </Badge>
      </div>

      <Card className={styles.card}>
        <div className={styles.storeHeaderRow}>
          <Globe24Regular className={styles.globeIcon} />
          <div>
            <Subtitle1 className={styles.menuTitle}>Your Public Customer Menu</Subtitle1>
            <Caption1 className={styles.menuDesc}>
              Customers can scan QR code on tables or visit your link to place direct food/retail orders
            </Caption1>
          </div>
        </div>

        <div className={styles.linkCard}>
          <Body1 className={styles.linkPrefix}>Store Link: </Body1>
          <Caption1 className={styles.linkText}>
            https://omnipos.cloud/store/live-demo
          </Caption1>
        </div>

        <div className={styles.btnRow}>
          <Button appearance="primary" icon={<Share20Regular />}>Copy Share Link</Button>
          <Button appearance="secondary" icon={<ShoppingBag24Regular />}>Preview Menu ({products.length} items live)</Button>
        </div>
      </Card>
    </div>
  );
}
