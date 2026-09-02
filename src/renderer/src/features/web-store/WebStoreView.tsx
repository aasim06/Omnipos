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
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    boxShadow: tokens.shadow4,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '640px',
  },
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
          <Skeleton animation="wave" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SkeletonItem shape="rectangle" style={{ width: '280px', height: '24px', borderRadius: '4px' }} />
            <SkeletonItem shape="rectangle" style={{ width: '380px', height: '14px', borderRadius: '3px' }} />
          </Skeleton>
          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" style={{ width: '120px', height: '28px', borderRadius: '14px' }} />
          </Skeleton>
        </div>

        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Skeleton animation="wave">
              <SkeletonItem shape="circle" size={48} />
            </Skeleton>
            <Skeleton animation="wave" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonItem shape="rectangle" style={{ width: '220px', height: '20px', borderRadius: '4px' }} />
              <SkeletonItem shape="rectangle" style={{ width: '340px', height: '14px', borderRadius: '3px' }} />
            </Skeleton>
          </div>

          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" style={{ width: '100%', height: '56px', borderRadius: '8px' }} />
          </Skeleton>

          <Skeleton animation="wave" style={{ display: 'flex', gap: '12px' }}>
            <SkeletonItem shape="rectangle" style={{ width: '140px', height: '36px', borderRadius: '6px' }} />
            <SkeletonItem shape="rectangle" style={{ width: '130px', height: '36px', borderRadius: '6px' }} />
          </Skeleton>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Subtitle1
            as="h1"
            style={{ fontWeight: 700, fontSize: '20px', color: tokens.colorNeutralForeground1, margin: 0, display: 'block' }}
          >
            Website POS / Online Store
          </Subtitle1>
          <Caption1
            as="p"
            style={{ color: tokens.colorNeutralForeground2, margin: 0, display: 'block', fontSize: '13px' }}
          >
            Customer online ordering menu connected live to your POS &amp; Kitchen
          </Caption1>
        </div>
        <Badge appearance="tint" color="success" size="large">
          Cloud Store Online
        </Badge>
      </div>

      <Card className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Globe24Regular style={{ fontSize: '40px', color: tokens.colorBrandForeground1 }} />
          <div>
            <Subtitle1 style={{ fontWeight: 700 }}>Your Public Customer Menu</Subtitle1>
            <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
              Customers can scan QR code on tables or visit your link to place direct food/retail orders
            </Caption1>
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '8px' }}>
          <Body1 style={{ fontWeight: 600 }}>Store Link: </Body1>
          <Caption1 style={{ color: tokens.colorBrandForeground1, wordBreak: 'break-all' }}>
            https://omnipos.cloud/store/live-demo
          </Caption1>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button appearance="primary" icon={<Share20Regular />}>Copy Share Link</Button>
          <Button appearance="secondary" icon={<ShoppingBag24Regular />}>Preview Menu ({products.length} items live)</Button>
        </div>
      </Card>
    </div>
  );
}
