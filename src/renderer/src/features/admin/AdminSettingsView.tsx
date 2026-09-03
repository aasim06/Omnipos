import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Switch,
  Caption1,
  Caption2,
  Body1,
  Body2,
  Subtitle1,
  Subtitle2,
  Text,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Divider,
  Badge,
} from '@fluentui/react-components';
import {
  BuildingShop24Regular,
  Print24Regular,
  MoneySettings24Regular,
  Save20Regular,
  Key20Regular,
  Checkmark20Filled,
  Info16Regular,
  ShieldCheckmark20Regular,
} from '@fluentui/react-icons';
import { posApi } from '@/lib/api';
import { storage, KEYS } from '@/lib/storage';

export interface StoreSettings {
  storeName: string;
  phone: string;
  address: string;
  headerNote: string;
  footerNote: string;
  paperWidth: '80mm' | '58mm';
  autoCut: boolean;
  drawerKick: boolean;
  currency: string;
  taxPercent: number;
}

const defaultSettings: StoreSettings = {
  storeName: 'Omnipos Restaurant & Cafe',
  phone: '+92 300 1234567',
  address: 'Shop #12, Commercial Area, Main Boulevard',
  headerNote: 'Order Fresh • Eat Fresh',
  footerNote: 'Thank you for your visit! Goods once sold are not refundable.',
  paperWidth: '80mm',
  autoCut: true,
  drawerKick: true,
  currency: 'PKR',
  taxPercent: 0,
};

const useStyles = makeStyles({
  // App frame: colorNeutralBackground2 = #F5F5F5 Mica base
  container: {
    padding: '28px 32px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2, // #F5F5F5 Mica frame
    overflowY: 'auto',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '16px',
    alignItems: 'start',
  },
  // Card containers: colorNeutralBackground1 = #FFFFFF with tokens.shadow4 elevation
  card: {
    padding: '0',
    borderRadius: tokens.borderRadiusMedium, // 8px Fluent v9 standard
    backgroundColor: tokens.colorNeutralBackground1, // #FFFFFF elevated card
    // Fluent tokens.shadow4 elevation to separate cards from Mica frame
    boxShadow: tokens.shadow4,
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
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  cardIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: tokens.borderRadiusSmall, // 4px Fluent small
    backgroundColor: tokens.colorNeutralBackground3, // EBEBEB subtle tint
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: tokens.colorNeutralForeground2,
  },
  cardBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  // Fluent v9 segmented control (paper width toggle)
  segmentedGroup: {
    display: 'flex',
    borderRadius: tokens.borderRadiusSmall,
    overflow: 'hidden',
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
    backgroundColor: tokens.colorNeutralBackground3, // Track: EBEBEB
  },
  segmentedItem: {
    flex: 1,
    height: '32px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    fontFamily: 'inherit',
    fontSize: '13px',
  },
  switchRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '6px',
    paddingBottom: '6px',
  },
  switchLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
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
  },
});

export function AdminSettingsView(): React.JSX.Element {
  const styles = useStyles();
  const [settings, setSettings] = useState<StoreSettings>(() =>
    storage.getItem<StoreSettings>(KEYS.storeSettings, defaultSettings)
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [printTestMsg, setPrintTestMsg] = useState('');
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [cloudUrl, setCloudUrl] = useState('https://omni-server-seven.vercel.app');
  const [licenseMsg, setLicenseMsg] = useState('');

  const handleSave = () => {
    storage.setItem(KEYS.storeSettings, settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestPrint = async () => {
    setPrintTestMsg('Sending test print…');
    await posApi.printReceipt();
    setPrintTestMsg('Test print dispatched!');
    setTimeout(() => setPrintTestMsg(''), 3500);
  };

  const handleActivateLicense = async () => {
    if (typeof window !== 'undefined' && (window as any).posApi?.activateLicense) {
      const res = await (window as any).posApi.activateLicense(licenseKey, cloudUrl);
      setLicenseMsg(res.ok ? `Activated. Schema: ${res.schemaId}` : `Failed: ${res.error}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Page Header ──────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          {/* Title: display block ensures it takes full row */}
          <Subtitle1
            as="h1"
            style={{ fontWeight: 700, fontSize: '20px', color: tokens.colorNeutralForeground1, margin: 0, display: 'block' }}
          >
            Store Settings &amp; Preferences
          </Subtitle1>
          {/* Subtitle: display block forces it to its own line below title */}
          <Text
            as="p"
            size={200}
            style={{ color: tokens.colorNeutralForeground2, marginTop: '4px', marginBottom: 0, display: 'block', fontSize: '13px' }}
          >
            Customize store identity, receipt branding, thermal printing, and billing options.
          </Text>
        </div>

        {/* Primary CTA: #E51937 red accent strictly reserved here */}
        <Button
          appearance="primary"
          icon={saveSuccess ? <Checkmark20Filled /> : <Save20Regular />}
          onClick={handleSave}
          style={{
            backgroundColor: '#E51937',
            borderRadius: tokens.borderRadiusMedium, // 8px — not pill
            fontWeight: 600,
            minWidth: '160px',
            // No pill shape, Fluent standard 8px radius
          }}
        >
          {saveSuccess ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {/* ── Settings Grid ─────────────────────────────────── */}
      <div className={styles.grid}>

        {/* ── CARD 1: Store Profile & Receipt Branding ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconBox}>
              <BuildingShop24Regular style={{ width: 20, height: 20 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {/* display:block forces title to occupy full line width */}
              <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block', lineHeight: '20px' }}>
                Store Profile &amp; Branding
              </Body1>
              {/* display:block forces subtitle to new line below title */}
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontSize: '12px', lineHeight: '16px' }}>
                Appears at the top of every customer receipt
              </Caption1>
            </div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.formRow}>
              {/* Label above input — separate element */}
              <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                Store / Restaurant Name
              </Caption1>
              <Input
                appearance="outline"
                value={settings.storeName}
                onChange={(_, d) => setSettings({ ...settings, storeName: d.value })}
                placeholder="e.g. Omnipos Fast Food"
              />
            </div>

            <div className={styles.formRow}>
              <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                Contact Phone Number
              </Caption1>
              <Input
                appearance="outline"
                value={settings.phone}
                onChange={(_, d) => setSettings({ ...settings, phone: d.value })}
                placeholder="+92 300 1234567"
              />
            </div>

            <div className={styles.formRow}>
              <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                Store Address
              </Caption1>
              <Input
                appearance="outline"
                value={settings.address}
                onChange={(_, d) => setSettings({ ...settings, address: d.value })}
                placeholder="Shop #12, Commercial Area"
              />
            </div>

            <div className={styles.formRow}>
              <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                Receipt Header Slogan
              </Caption1>
              <Input
                appearance="outline"
                value={settings.headerNote}
                onChange={(_, d) => setSettings({ ...settings, headerNote: d.value })}
                placeholder="Order Fresh • Eat Fresh"
              />
            </div>

            <div className={styles.formRow}>
              <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                Receipt Footer Note
              </Caption1>
              <Input
                appearance="outline"
                value={settings.footerNote}
                onChange={(_, d) => setSettings({ ...settings, footerNote: d.value })}
                placeholder="Thank you for your visit!"
              />
            </div>
          </div>
        </div>

        {/* ── CARD 2: Thermal Printer & Hardware ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconBox}>
              <Print24Regular style={{ width: 20, height: 20 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block', lineHeight: '20px' }}>
                Thermal Printer &amp; Hardware
              </Body1>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontSize: '12px', lineHeight: '16px' }}>
                ESC/POS silent receipt printing configuration
              </Caption1>
            </div>
          </div>

          <div className={styles.cardBody}>
            {/* Paper Width — Fluent Segmented Control (no pill shape, 4px radius) */}
            <div className={styles.formRow}>
              <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                Thermal Paper Width
              </Caption1>
              <div className={styles.segmentedGroup}>
                <button
                  className={styles.segmentedItem}
                  style={{
                    flex: 1, height: '32px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
                    backgroundColor: settings.paperWidth === '80mm' ? '#FFFFFF' : 'transparent',
                    color: settings.paperWidth === '80mm' ? '#1A1A1A' : '#616161',
                    fontWeight: settings.paperWidth === '80mm' ? 700 : 400,
                    boxShadow: settings.paperWidth === '80mm' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                  onClick={() => setSettings({ ...settings, paperWidth: '80mm' })}
                >
                  80mm (Standard POS)
                </button>
                <button
                  className={styles.segmentedItem}
                  style={{
                    flex: 1, height: '32px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
                    backgroundColor: settings.paperWidth === '58mm' ? '#FFFFFF' : 'transparent',
                    color: settings.paperWidth === '58mm' ? '#1A1A1A' : '#616161',
                    fontWeight: settings.paperWidth === '58mm' ? 700 : 400,
                    boxShadow: settings.paperWidth === '58mm' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                  onClick={() => setSettings({ ...settings, paperWidth: '58mm' })}
                >
                  58mm (Compact)
                </button>
              </div>
            </div>

            <Divider />

            {/* Auto Cut Toggle */}
            <div className={styles.switchRow}>
              <div className={styles.switchLabel}>
                <Body2 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>Auto-Cut Receipt Paper</Body2>
                <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                  Sends cutter pulse after each receipt is printed
                </Caption1>
              </div>
              <Switch
                checked={settings.autoCut}
                onChange={(_, d) => setSettings({ ...settings, autoCut: d.checked })}
              />
            </div>

            {/* Cash Drawer Toggle */}
            <div className={styles.switchRow}>
              <div className={styles.switchLabel}>
                <Body2 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>Cash Drawer Kick</Body2>
                <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                  Automatically opens drawer on confirmed checkout
                </Caption1>
              </div>
              <Switch
                checked={settings.drawerKick}
                onChange={(_, d) => setSettings({ ...settings, drawerKick: d.checked })}
              />
            </div>

            <Divider />

            {/* Test Print: Fluent secondary outline style (NOT red) */}
            <Button
              appearance="outline"
              icon={<Print24Regular />}
              onClick={handleTestPrint}
              style={{ borderRadius: tokens.borderRadiusMedium }} // 8px — standard, not pill
            >
              Test Print Receipt
            </Button>
            {printTestMsg && (
              <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>{printTestMsg}</Caption1>
            )}
          </div>
        </div>

        {/* ── CARD 3: Billing, Taxes & Currency ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconBox}>
              <MoneySettings24Regular style={{ width: 20, height: 20 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block', lineHeight: '20px' }}>
                Billing, Taxes &amp; Currency
              </Body1>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontSize: '12px', lineHeight: '16px' }}>
                Currency symbol and tax calculations at checkout
              </Caption1>
            </div>

          </div>

          <div className={styles.cardBody}>
            <div className={styles.formRow}>
              <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>Currency Symbol</Caption1>
              <Input
                appearance="outline"
                value={settings.currency}
                onChange={(_, d) => setSettings({ ...settings, currency: d.value })}
                placeholder="PKR"
              />
            </div>

            <div className={styles.formRow}>
              <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>Sales Tax / GST Rate (%)</Caption1>
              <Input
                appearance="outline"
                type="number"
                value={String(settings.taxPercent)}
                onChange={(_, d) => setSettings({ ...settings, taxPercent: parseFloat(d.value) || 0 })}
                placeholder="0"
              />
              {/* Helper text below field — colorNeutralForeground3, separate element */}
              <Caption2 style={{ color: tokens.colorNeutralForeground3, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info16Regular style={{ width: 12, height: 12 }} />
                Set to 0 if item prices already include tax
              </Caption2>
            </div>

            <Divider />

            {/* Informational Note — NOT a primary button */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: tokens.borderRadiusSmall, // 4px
                backgroundColor: tokens.colorNeutralBackground3,
                borderTopWidth: '1px', borderBottomWidth: '1px',
                borderLeftWidth: '1px', borderRightWidth: '1px',
                borderTopStyle: 'solid', borderBottomStyle: 'solid',
                borderLeftStyle: 'solid', borderRightStyle: 'solid',
                borderTopColor: tokens.colorNeutralStroke1,
                borderBottomColor: tokens.colorNeutralStroke1,
                borderLeftColor: tokens.colorNeutralStroke1,
                borderRightColor: tokens.colorNeutralStroke1,
              }}
            >
              <Body2 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1, display: 'block' }}>
                Offline-First Database Engine
              </Body2>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginTop: '4px', lineHeight: 1.5 }}>
                All orders and receipts are committed to local SQLite WAL mode instantly. Data syncs to the central server when connected.
              </Caption1>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Bar (read-only system info) ─────────────── */}
      <div className={styles.statusBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheckmark20Regular style={{ color: '#107C41', width: 18, height: 18 }} />
          <div>
            <Body2 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>
              Omnipos Counter Edition v1.0.0
            </Body2>
            <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
              Status: <span style={{ color: '#107C41', fontWeight: 600 }}>● Terminal Active — Offline-Ready</span>
            </Caption1>
          </div>
        </div>

        {/* Subtle technician link — secondary appearance, NOT red */}
        <Button
          appearance="subtle"
          size="small"
          icon={<Key20Regular />}
          onClick={() => setIsLicenseOpen(true)}
          style={{ color: tokens.colorNeutralForeground3, fontSize: '12px' }}
        >
          Technician Access
        </Button>
      </div>

      {/* ── Technician License Modal ───────────────────────── */}
      <Dialog open={isLicenseOpen} onOpenChange={(_, d) => setIsLicenseOpen(d.open)}>
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '440px' }}>
          <DialogBody>
            <DialogTitle>Technician / Software Activation</DialogTitle>
            <DialogContent>
              <Text as="p" size={200} style={{ color: tokens.colorNeutralForeground2, marginBottom: '16px', display: 'block' }}>
                For software provider or technician use only. Registers this machine with the cloud license server.
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className={styles.formRow}>
                  <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>License Key</Caption1>
                  <Input
                    appearance="outline"
                    value={licenseKey}
                    onChange={(_, d) => setLicenseKey(d.value)}
                    placeholder="OMNI-XXXX-XXXX-XXXX"
                  />
                </div>
                <div className={styles.formRow}>
                  <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>License Server URL</Caption1>
                  <Input
                    appearance="outline"
                    value={cloudUrl}
                    onChange={(_, d) => setCloudUrl(d.value)}
                  />
                </div>
                {licenseMsg && (
                  <Caption1 style={{ color: licenseMsg.startsWith('Failed') ? '#E51937' : '#107C41', fontWeight: 600 }}>
                    {licenseMsg}
                  </Caption1>
                )}
              </div>
            </DialogContent>
            <DialogActions style={{ paddingTop: '16px' }}>
              <Button appearance="outline" onClick={() => setIsLicenseOpen(false)}>
                Close
              </Button>
              {/* Primary action only: #E51937 strictly on this confirm button */}
              <Button
                appearance="primary"
                onClick={handleActivateLicense}
                style={{ backgroundColor: '#E51937', borderRadius: tokens.borderRadiusMedium }}
              >
                Activate License
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
