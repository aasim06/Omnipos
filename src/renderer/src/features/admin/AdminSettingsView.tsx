import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Button,
  Switch,
  Caption1,
  Caption2,
  Body1,
  Body2,
  Subtitle1,
  Text,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Divider,
  Badge,
  Avatar,
} from '@fluentui/react-components';
import { useAppToast, useConfirmDialog } from '../../context/AppNotificationContext';
import {
  BuildingShop24Regular,
  Print24Regular,
  MoneySettings24Regular,
  Save20Regular,
  Key20Regular,
  Checkmark20Filled,
  Info16Regular,
  ShieldCheckmark20Regular,
  PeopleCommunity24Regular,
  PersonAdd20Regular,
  Edit20Regular,
  Delete20Regular,
  LockClosed20Regular,
  Checkmark20Regular,
  Dismiss20Regular,
  Database24Regular,
  Database20Regular,
  ArrowDownload20Regular,
  ArrowUpload20Regular,
  ArrowSync20Regular,
  FolderOpen20Regular,
  Warning20Regular,
  ArrowClockwise20Regular,
  DocumentTableSearch20Regular,
} from '@fluentui/react-icons';
import { posApi } from '@/lib/api';
import { storage, KEYS } from '@/lib/storage';
import { CustomInput, CustomSelect } from '@/components/ui';
import {
  userStorage,
  AppUser,
  UserPermissionKey,
  ALL_PERMISSIONS,
} from '@/features/auth/userStorage';

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

const ROLE_OPTIONS = [
  { value: 'cashier', label: 'Counter Cashier (Restricted Permissions)' },
  { value: 'admin', label: 'Store Manager (Full Admin Access)' },
];

import { useAdminSettingsStyles, useStyles } from './adminSettings.styles';

export function AdminSettingsView(): React.JSX.Element {
  const styles = useAdminSettingsStyles();
  const { notifySuccess, notifyWarning, notifyError } = useAppToast();
  const confirmModal = useConfirmDialog();
  const [settings, setSettings] = useState<StoreSettings>(() =>
    storage.getItem<StoreSettings>(KEYS.storeSettings, defaultSettings)
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [printTestMsg, setPrintTestMsg] = useState('');
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [cloudUrl, setCloudUrl] = useState('https://omni-server-seven.vercel.app');
  const [licenseMsg, setLicenseMsg] = useState('');

  const location = useLocation();

  // ── Tab State ──
  const [activeTab, setActiveTab] = useState<'staff' | 'profile' | 'hardware' | 'backup'>(() => {
    return (location.state as any)?.tab || 'staff';
  });

  useEffect(() => {
    if ((location.state as any)?.tab) {
      setActiveTab((location.state as any).tab);
    }
  }, [location.state]);

  // ── Database Backup State ──
  const [backupStatus, setBackupStatus] = useState<{
    dbPath: string;
    dbSize: number;
    lastBackup?: string | null;
    lastBackupPath?: string | null;
    lastBackupSize?: number | null;
    isElectron: boolean;
  } | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);

  const refreshBackupStatus = async () => {
    try {
      const status = await posApi.getBackupStatus();
      setBackupStatus(status);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refreshBackupStatus();
  }, []);

  const handleCreateDbBackup = async (promptDialog: boolean = true) => {
    setBackupLoading(true);
    setBackupMsg(null);
    try {
      const res = await posApi.createBackup(promptDialog);
      if (res.ok && res.path) {
        setBackupMsg({
          type: 'success',
          text: `Database backup created successfully: ${res.path}`,
        });
        await refreshBackupStatus();
      } else if (!res.cancelled) {
        setBackupMsg({ type: 'error', text: res.error || 'Failed to create backup.' });
      }
    } catch (err: any) {
      setBackupMsg({ type: 'error', text: err.message || 'Backup failed.' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleExportJsonArchive = async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    try {
      const res = await posApi.exportJsonBackup();
      if (res.ok && res.path) {
        setBackupMsg({
          type: 'success',
          text: `Complete JSON archive exported: ${res.path}`,
        });
      } else if (!res.cancelled) {
        setBackupMsg({ type: 'error', text: res.error || 'Failed to export JSON.' });
      }
    } catch (err: any) {
      setBackupMsg({ type: 'error', text: err.message || 'JSON export failed.' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleExecuteRestore = async () => {
    setIsRestoreConfirmOpen(false);
    setBackupLoading(true);
    setBackupMsg(null);
    try {
      const res = await posApi.restoreBackup();
      if (res.ok) {
        setBackupMsg({
          type: 'success',
          text: res.message || 'Database restored successfully! Please restart or reload the app.',
        });
        await refreshBackupStatus();
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (!res.cancelled) {
        setBackupMsg({ type: 'error', text: res.error || 'Failed to restore database.' });
      }
    } catch (err: any) {
      setBackupMsg({ type: 'error', text: err.message || 'Restore failed.' });
    } finally {
      setBackupLoading(false);
    }
  };

  // ── User Management State ──
  const [users, setUsers] = useState<AppUser[]>(() => userStorage.getUsers());
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // Add User Form Fields
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'cashier'>('cashier');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPermissions, setFormPermissions] = useState<UserPermissionKey[]>([
    'pos_fastfood',
    'pos_omnimart',
  ]);
  const [userError, setUserError] = useState('');

  // Password Change Fields
  const [changePassNew, setChangePassNew] = useState('');
  const [changePassConfirm, setChangePassConfirm] = useState('');
  const [changePassError, setChangePassError] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState(false);

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

  // ── User Management Handlers ──
  const handleOpenAddUser = () => {
    setFormUsername('');
    setFormName('');
    setFormRole('cashier');
    setFormPassword('');
    setFormPhone('');
    setFormPermissions(['pos_fastfood', 'pos_omnimart']);
    setUserError('');
    setIsAddUserOpen(true);
  };

  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');

    if (!formUsername.trim()) {
      setUserError('Username is required.');
      return;
    }
    if (!formName.trim()) {
      setUserError('Full Name is required.');
      return;
    }
    if (!formPassword.trim() || formPassword.length < 4) {
      setUserError('Password must be at least 4 characters.');
      return;
    }
    if (formRole === 'cashier' && formPermissions.length === 0) {
      setUserError('Please grant at least one module permission to this cashier.');
      return;
    }

    try {
      userStorage.createUser({
        username: formUsername,
        name: formName,
        role: formRole,
        password: formPassword,
        permissions: formPermissions,
        phone: formPhone,
        isActive: true,
      });
      setUsers(userStorage.getUsers());
      setIsAddUserOpen(false);
    } catch (err: any) {
      setUserError(err.message || 'Failed to create user');
    }
  };

  const handleOpenEditUser = (u: AppUser) => {
    setSelectedUser(u);
    setFormName(u.name);
    setFormRole(u.role);
    setFormPhone(u.phone || '');
    setFormPermissions([...u.permissions]);
    setUserError('');
    setIsEditUserOpen(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUserError('');

    try {
      userStorage.updateUser(selectedUser.id, {
        name: formName,
        role: formRole,
        phone: formPhone,
        permissions: formPermissions,
      });
      setUsers(userStorage.getUsers());
      setIsEditUserOpen(false);
    } catch (err: any) {
      setUserError(err.message || 'Failed to update user');
    }
  };

  const handleOpenChangePassword = (u: AppUser) => {
    setSelectedUser(u);
    setChangePassNew('');
    setChangePassConfirm('');
    setChangePassError('');
    setChangePassSuccess(false);
    setIsChangePasswordOpen(true);
  };

  const handleSaveChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setChangePassError('');

    if (!changePassNew.trim() || changePassNew.length < 4) {
      setChangePassError('New password must be at least 4 characters.');
      return;
    }
    if (changePassNew !== changePassConfirm) {
      setChangePassError('Passwords do not match.');
      return;
    }

    const ok = userStorage.changePassword(selectedUser.id, changePassNew);
    if (ok) {
      setChangePassSuccess(true);
      setUsers(userStorage.getUsers());
      setTimeout(() => {
        setIsChangePasswordOpen(false);
      }, 1200);
    } else {
      setChangePassError('Failed to change password.');
    }
  };

  const handleDeleteUser = async (u: AppUser) => {
    if (u.username === 'admin') {
      notifyWarning('The primary Store Administrator account cannot be deleted.');
      return;
    }
    const ok = await confirmModal({
      title: 'Delete User Account',
      message: `Are you sure you want to delete user "${u.username}" (${u.name})? This user will no longer be able to log in.`,
      confirmLabel: 'Delete User',
      intent: 'danger',
    });
    if (ok) {
      try {
        userStorage.deleteUser(u.id);
        setUsers(userStorage.getUsers());
        notifySuccess(`User "${u.username}" deleted successfully.`);
      } catch (err: any) {
        notifyError(err.message || 'Failed to delete user');
      }
    }
  };

  const handleToggleUserStatus = (u: AppUser) => {
    try {
      userStorage.updateUser(u.id, { isActive: !u.isActive });
      setUsers(userStorage.getUsers());
      notifySuccess(`User "${u.username}" status updated.`);
    } catch (err: any) {
      notifyError(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Page Header ──────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <Subtitle1 as="h1" className={styles.pageTitle}>
            Store Settings &amp; Preferences
          </Subtitle1>
          <Text as="p" size={200} className={styles.pageSubtitle}>
            Customize store identity, receipt branding, cashier accounts &amp; granular role permissions.
          </Text>
        </div>

        {activeTab === 'staff' ? (
          <Button
            appearance="primary"
            icon={<PersonAdd20Regular />}
            onClick={handleOpenAddUser}
            className={styles.primaryRedButton}
          >
            Add New Cashier / Staff
          </Button>
        ) : (
          <Button
            appearance="primary"
            icon={saveSuccess ? <Checkmark20Filled /> : <Save20Regular />}
            onClick={handleSave}
            className={styles.saveButton}
          >
            {saveSuccess ? 'Saved!' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────── */}
      <div className={styles.tabNavContainer}>
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={mergeClasses(styles.tabButton, activeTab === 'staff' && styles.tabButtonActive)}
        >
          <PeopleCommunity24Regular className={mergeClasses(styles.tabIcon, activeTab === 'staff' && styles.tabIconActive)} />
          <span>Staff &amp; Cashier Accounts</span>
          <Badge
            appearance="tint"
            color="brand"
            className={activeTab === 'staff' ? styles.tabBadgeActive : styles.tabBadge}
          >
            {users.length} Users
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={mergeClasses(styles.tabButton, activeTab === 'profile' && styles.tabButtonActive)}
        >
          <BuildingShop24Regular className={mergeClasses(styles.tabIcon, activeTab === 'profile' && styles.tabIconActive)} />
          <span>Store Profile &amp; Receipts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hardware')}
          className={mergeClasses(styles.tabButton, activeTab === 'hardware' && styles.tabButtonActive)}
        >
          <Print24Regular className={mergeClasses(styles.tabIcon, activeTab === 'hardware' && styles.tabIconActive)} />
          <span>Printer, Drawer &amp; Billing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={mergeClasses(styles.tabButton, activeTab === 'backup' && styles.tabButtonActive)}
        >
          <Database24Regular className={mergeClasses(styles.tabIcon, activeTab === 'backup' && styles.tabIconActive)} />
          <span>Database &amp; Data Backup</span>
          <Badge
            appearance="tint"
            color="success"
            className={activeTab === 'backup' ? styles.tabBadgeActive : styles.tabBadge}
          >
            SQLite WAL
          </Badge>
        </button>
      </div>

      {/* ── TAB 1: Staff, Cashiers & Permissions Management (Full Width) ── */}
      {activeTab === 'staff' && (
        <div className={styles.card}>
          <div className={mergeClasses(styles.cardHeader, styles.cardHeaderBetween)}>
            <div className={styles.headerFlex}>
              <div className={mergeClasses(styles.cardIconBox, styles.cardIconBoxRed)}>
                <PeopleCommunity24Regular className={styles.icon20} />
              </div>
              <div className={styles.headerTextCol}>
                <div className={styles.headerTitleRow}>
                  <Body1 className={styles.headerTitle}>
                    Staff, Cashiers &amp; Role Permissions
                  </Body1>
                  <Badge appearance="tint" color="brand" className={styles.headerBadge}>
                    {users.length} Users
                  </Badge>
                </div>
                <Caption1 className={styles.headerSubtitle}>
                  Create cashier logins, set module access permissions, and manage staff passwords
                </Caption1>
              </div>
            </div>

            <Button
              appearance="primary"
              icon={<PersonAdd20Regular />}
              onClick={handleOpenAddUser}
              className={styles.primaryRedButton}
            >
              Add New Cashier / Staff
            </Button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th className={styles.th}>Staff Member</th>
                  <th className={styles.th}>Username</th>
                  <th className={styles.th}>Role</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Allowed Modules</th>
                  <th className={mergeClasses(styles.th, styles.thRight)}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={styles.tableRow}>
                    <td className={styles.td}>
                      <div className={styles.userCell}>
                        <Avatar name={u.name} size={32} color={u.role === 'admin' ? 'brand' : 'colorful'} />
                        <div>
                          <span className={styles.userName}>
                            {u.name}
                          </span>
                          {u.phone && (
                            <span className={styles.userPhone}>
                              {u.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <span className={styles.usernamePill}>
                        {u.username}
                      </span>
                    </td>

                    <td className={styles.td}>
                      <Badge
                        appearance="tint"
                        color={u.role === 'admin' ? 'danger' : 'informative'}
                        className={styles.roleBadge}
                      >
                        {u.role}
                      </Badge>
                    </td>

                    <td className={styles.td}>
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(u)}
                        className={styles.statusToggleBtn}
                        title="Click to toggle status"
                      >
                        <span className={u.isActive ? styles.statusDotActive : styles.statusDotInactive} />
                        <span className={u.isActive ? styles.statusTextActive : styles.statusTextInactive}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>

                    <td className={styles.td}>
                      {u.role === 'admin' ? (
                        <Badge appearance="outline" color="success">
                          Full Access (All Modules)
                        </Badge>
                      ) : (
                        <div className={styles.permissionsBadgeRow}>
                          <Badge appearance="tint" color="brand" className={styles.permissionsCountBadge}>
                            {u.permissions.length} Allowed
                          </Badge>
                          <span className={styles.permissionsListText}>
                            ({u.permissions.map((p) => p.replace('pos_', '').toUpperCase()).join(', ')})
                          </span>
                        </div>
                      )}
                    </td>

                    <td className={mergeClasses(styles.td, styles.tdRight)}>
                      <div className={styles.actionBtnsRow}>
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<Key20Regular />}
                          onClick={() => handleOpenChangePassword(u)}
                          title="Change Password"
                          aria-label="Change Password"
                        />

                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<Edit20Regular />}
                          onClick={() => handleOpenEditUser(u)}
                          title="Edit Permissions"
                          aria-label="Edit Permissions"
                        />

                        {u.username !== 'admin' && (
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Delete20Regular className={styles.deleteIcon} />}
                            onClick={() => handleDeleteUser(u)}
                            title="Delete Cashier"
                            aria-label="Delete Cashier"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Store Profile & Receipts ── */}
      {activeTab === 'profile' && (
        <div className={styles.grid}>
          {/* CARD 1: Store Profile & Receipt Branding */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIconBox}>
                <BuildingShop24Regular className={styles.icon20} />
              </div>
              <div className={styles.headerTextCol}>
                <Body1 className={styles.headerTitle}>
                  Store Profile &amp; Branding
                </Body1>
                <Caption1 className={styles.headerSubtitle}>
                  Appears at the top of every customer receipt
                </Caption1>
              </div>
            </div>

            <div className={styles.cardBody}>
              <CustomInput
                label="Store / Restaurant Name"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                placeholder="e.g. Omnipos Fast Food"
              />

              <CustomInput
                label="Contact Phone Number"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+92 300 1234567"
              />

              <CustomInput
                label="Store Address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Shop #12, Commercial Area"
              />

              <CustomInput
                label="Receipt Header Slogan"
                value={settings.headerNote}
                onChange={(e) => setSettings({ ...settings, headerNote: e.target.value })}
                placeholder="Order Fresh • Eat Fresh"
              />

              <CustomInput
                label="Receipt Footer Note"
                value={settings.footerNote}
                onChange={(e) => setSettings({ ...settings, footerNote: e.target.value })}
                placeholder="Thank you for your visit!"
              />
            </div>
          </div>

          {/* Database Engine Info */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIconBox}>
                <ShieldCheckmark20Regular className={styles.icon20} />
              </div>
              <div className={styles.headerTextCol}>
                <Body1 className={styles.headerTitle}>
                  Offline-First Database Engine
                </Body1>
                <Caption1 className={styles.headerSubtitle}>
                  Local storage resilience and cloud synchronization
                </Caption1>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.engineCard}>
                <Body2 className={styles.engineTitle}>
                  SQLite WAL (Write-Ahead Logging) Mode Active
                </Body2>
                <Caption1 className={styles.engineSubtitle}>
                  All store preferences, orders, products, inventory transactions, and staff accounts are committed locally to SQLite instantly with zero network latency.
                </Caption1>
                <div className={styles.engineStatusRow}>
                  <span className={styles.engineDot} />
                  <span className={styles.engineReadyText}>
                    Local Database Healthy &amp; Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Hardware, Printer & Taxes ── */}
      {activeTab === 'hardware' && (
        <div className={styles.grid}>
          {/* CARD 2: Thermal Receipt Printer & Drawer */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIconBox}>
                <Print24Regular className={styles.icon20} />
              </div>
              <div className={styles.headerTextCol}>
                <Body1 className={styles.headerTitle}>
                  Thermal Receipt Printer &amp; Drawer
                </Body1>
                <Caption1 className={styles.headerSubtitle}>
                  Hardware configuration for 80mm / 58mm ESC/POS printers
                </Caption1>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.formRow}>
                <Caption1 className={styles.paperWidthLabel}>Paper Roll Width</Caption1>
                <div className={styles.segmentedGroup}>
                  <button
                    type="button"
                    className={mergeClasses(
                      styles.segmentedItem,
                      settings.paperWidth === '80mm' ? styles.segmentedItemActive : styles.segmentedItemInactive
                    )}
                    onClick={() => setSettings({ ...settings, paperWidth: '80mm' })}
                  >
                    80mm Standard
                  </button>
                  <button
                    type="button"
                    className={mergeClasses(
                      styles.segmentedItem,
                      settings.paperWidth === '58mm' ? styles.segmentedItemActive : styles.segmentedItemInactive
                    )}
                    onClick={() => setSettings({ ...settings, paperWidth: '58mm' })}
                  >
                    58mm Compact
                  </button>
                </div>
              </div>

              <Divider />

              <div className={styles.switchRow}>
                <div className={styles.switchLabel}>
                  <Body2 className={styles.switchRowTitle}>Auto Paper Cut</Body2>
                  <Caption1 className={styles.switchRowDesc}>
                    Sends full cut command (GS V 66 0) after bill prints
                  </Caption1>
                </div>
                <Switch
                  checked={settings.autoCut}
                  onChange={(_, d) => setSettings({ ...settings, autoCut: d.checked })}
                />
              </div>

              <Divider />

              <div className={styles.switchRow}>
                <div className={styles.switchLabel}>
                  <Body2 className={styles.switchRowTitle}>Kick Cash Drawer</Body2>
                  <Caption1 className={styles.switchRowDesc}>
                    Sends 24V pulse to open cash drawer on cash checkout
                  </Caption1>
                </div>
                <Switch
                  checked={settings.drawerKick}
                  onChange={(_, d) => setSettings({ ...settings, drawerKick: d.checked })}
                />
              </div>

              <Divider />

              <div className={styles.testPrintRow}>
                <Button
                  appearance="outline"
                  icon={<Print24Regular />}
                  onClick={handleTestPrint}
                  className={styles.testPrintBtn}
                >
                  Send Test Print
                </Button>
                {printTestMsg && (
                  <Caption1 className={styles.testPrintSuccess}>{printTestMsg}</Caption1>
                )}
              </div>
            </div>
          </div>

          {/* CARD 3: Billing, Taxes & Currency */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIconBox}>
                <MoneySettings24Regular className={styles.icon20} />
              </div>
              <div className={styles.headerTextCol}>
                <Body1 className={styles.headerTitle}>
                  Billing, Taxes &amp; Currency
                </Body1>
                <Caption1 className={styles.headerSubtitle}>
                  Currency symbol and tax calculations at checkout
                </Caption1>
              </div>
            </div>

            <div className={styles.cardBody}>
              <CustomInput
                label="Currency Symbol"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="PKR"
              />

              <div>
                <CustomInput
                  label="Sales Tax / GST Rate (%)"
                  type="number"
                  value={String(settings.taxPercent)}
                  onChange={(e) => setSettings({ ...settings, taxPercent: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
                <Caption2 className={styles.taxHelper}>
                  <Info16Regular className={styles.icon12} />
                  Set to 0 if item prices already include tax
                </Caption2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Database Backup & Recovery (SQLite & JSON) ── */}
      {activeTab === 'backup' && (
        <div className={styles.tabColumnContainer}>
          {/* Top Status Card */}
          <div className={styles.card}>
            <div className={mergeClasses(styles.cardHeader, styles.cardHeaderBetween)}>
              <div className={styles.headerFlex}>
                <div className={mergeClasses(styles.cardIconBox, styles.cardIconBoxGreen)}>
                  <Database24Regular className={styles.icon20} />
                </div>
                <div className={styles.headerTextCol}>
                  <div className={styles.headerTitleRow}>
                    <Body1 className={styles.headerTitle}>
                      Windows Offline Database &amp; Data Safety
                    </Body1>
                    <Badge appearance="tint" color="success">
                      SQLite 3 (WAL Mode Active)
                    </Badge>
                  </div>
                  <Caption1 className={styles.headerSubtitle}>
                    Your business data is stored locally on this machine with immediate atomic writes.
                  </Caption1>
                </div>
              </div>

              <Button
                appearance="outline"
                size="small"
                icon={<ArrowSync20Regular />}
                onClick={refreshBackupStatus}
              >
                Refresh Database Status
              </Button>
            </div>

            <div className={mergeClasses(styles.cardBody, styles.cardBodyGap14)}>
              <div className={styles.dbStatusGrid}>
                <div>
                  <Caption1 className={styles.mutedBlockCaption}>
                    Active Database File:
                  </Caption1>
                  <Text size={300} weight="bold" className={styles.monoBreakText}>
                    {backupStatus?.dbPath || 'Loading...'}
                  </Text>
                </div>

                <div>
                  <Caption1 className={styles.mutedBlockCaption}>
                    Database File Size:
                  </Caption1>
                  <Text size={300} weight="bold" className={styles.blueBoldText}>
                    {backupStatus?.dbSize ? `${(backupStatus.dbSize / (1024 * 1024)).toFixed(2)} MB` : 'Calculating...'}
                  </Text>
                </div>

                <div>
                  <Caption1 className={styles.mutedBlockCaption}>
                    Last Backup Created:
                  </Caption1>
                  <Text size={300} weight="bold" className={backupStatus?.lastBackup ? styles.greenBoldText : styles.mutedBoldText}>
                    {backupStatus?.lastBackup ? new Date(backupStatus.lastBackup).toLocaleString() : 'No backup taken yet'}
                  </Text>
                </div>
              </div>

              {backupMsg && (
                <div className={backupMsg.type === 'success' ? styles.backupSuccessBanner : styles.backupDangerBanner}>
                  {backupMsg.type === 'success' ? <Checkmark20Regular /> : <Warning20Regular />}
                  <span>{backupMsg.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Backup & Restore Action Grid */}
          <div className={styles.backupGrid}>
            {/* Card 1: SQLite Full Backup */}
            <div className={styles.backupActionCard}>
              <div className={styles.cardColGap8}>
                <div className={styles.cardHeaderBetween}>
                  <div className={mergeClasses(styles.cardIconBox, styles.cardIconBoxBlue)}>
                    <ArrowDownload20Regular className={styles.icon20} />
                  </div>
                  <Badge appearance="filled" color="success">Recommended</Badge>
                </div>
                <Body1 className={styles.boldTitle15}>
                  1-Click SQLite Database Backup (.db)
                </Body1>
                <Caption1 className={styles.mutedTextLineHeight}>
                  Creates a clean, 100% full snapshot of your active SQLite database file including all sales invoices, products, stock levels, khata ledgers, and settings.
                </Caption1>
              </div>

              <div className={styles.btnStackCol}>
                <Button
                  appearance="primary"
                  icon={<ArrowDownload20Regular />}
                  disabled={backupLoading}
                  onClick={() => handleCreateDbBackup(true)}
                  className={styles.primaryBlueBtn}
                >
                  {backupLoading ? 'Backing up...' : 'Save Backup to USB / Drive (.db)'}
                </Button>
                <Button
                  appearance="subtle"
                  size="small"
                  disabled={backupLoading}
                  onClick={() => handleCreateDbBackup(false)}
                >
                  Quick Save to Local Backups Folder
                </Button>
              </div>
            </div>

            {/* Card 2: JSON Archive Export */}
            <div className={styles.backupActionCard}>
              <div className={styles.cardColGap8}>
                <div className={styles.cardHeaderBetween}>
                  <div className={mergeClasses(styles.cardIconBox, styles.cardIconBoxPurple)}>
                    <DocumentTableSearch20Regular className={styles.icon20} />
                  </div>
                  <Badge appearance="tint" color="brand">Universal Archive</Badge>
                </div>
                <Body1 className={styles.boldTitle15}>
                  Export Complete JSON Archive (.json)
                </Body1>
                <Caption1 className={styles.mutedTextLineHeight}>
                  Exports all tables as a readable and portable JSON archive. Useful for custom analytics, third-party audits, or cross-platform migrations.
                </Caption1>
              </div>

              <div className={styles.btnWrapTop10}>
                <Button
                  appearance="outline"
                  icon={<DocumentTableSearch20Regular />}
                  disabled={backupLoading}
                  onClick={handleExportJsonArchive}
                  className={styles.fullWidthMediumBtn}
                >
                  Export Data as JSON (.json)
                </Button>
              </div>
            </div>

            {/* Card 3: Database Restore */}
            <div className={styles.backupActionCard}>
              <div className={styles.cardColGap8}>
                <div className={styles.cardHeaderBetween}>
                  <div className={mergeClasses(styles.cardIconBox, styles.cardIconBoxOrange)}>
                    <ArrowUpload20Regular className={styles.icon20} />
                  </div>
                  <Badge appearance="tint" color="danger">Restore Safeguard</Badge>
                </div>
                <Body1 className={styles.boldTitle15}>
                  Restore Database from Backup (.db)
                </Body1>
                <Caption1 className={styles.mutedTextLineHeight}>
                  Restore from an existing backup file. A pre-restore safety copy of your current database is automatically created before replacement.
                </Caption1>
              </div>

              <div className={styles.btnWrapTop10}>
                <Button
                  appearance="outline"
                  icon={<ArrowUpload20Regular />}
                  disabled={backupLoading}
                  onClick={() => setIsRestoreConfirmOpen(true)}
                  className={styles.restoreAmberBtn}
                >
                  Restore from .DB Backup...
                </Button>
              </div>
            </div>
          </div>

          {/* Help Tip Banner */}
          <div className={styles.helpTipBanner}>
            <Info16Regular className={styles.blueInfoIcon} />
            <Caption1 className={styles.helpTipText}>
              <strong>Best Practice for Point of Sale Safety:</strong> It is strongly recommended to copy your backup file to an external USB flash drive or cloud-synced folder (such as OneDrive or Google Drive) at least once a week or before updating software.
            </Caption1>
          </div>
        </div>
      )}

      {/* ── MODAL: Restore Database Confirmation Dialog ────── */}
      <Dialog open={isRestoreConfirmOpen} onOpenChange={(_, d) => setIsRestoreConfirmOpen(d.open)}>
        <DialogSurface className={styles.dialogSurface460}>
          <DialogBody>
            <DialogTitle>Confirm Database Restore</DialogTitle>
            <DialogContent className={styles.dialogContentCol12}>
              <div className={styles.dialogWarningRow}>
                <Warning20Regular className={styles.icon28} />
                <Text weight="bold" size={300}>
                  Are you sure you want to restore?
                </Text>
              </div>
              <Text size={200} className={styles.mutedTextLineHeight}>
                Restoring will replace your current SQLite database with the selected backup file. Any recent sales or transactions made after that backup will be overwritten.
              </Text>
              <div className={styles.dialogSafetySnapshotBox}>
                A safety fallback snapshot of your current database will be saved automatically as <code>pos.db.pre_restore_safety</code>.
              </div>
            </DialogContent>
            <DialogActions className={styles.dialogActionsTop16}>
              <Button appearance="secondary" onClick={() => setIsRestoreConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                className={styles.dangerRedBtn}
                onClick={handleExecuteRestore}
              >
                Proceed &amp; Select Backup File (.db)
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Status Bar (read-only system info) ─────────────── */}
      <div className={styles.statusBar}>
        <div className={styles.statusBarLeft}>
          <ShieldCheckmark20Regular className={styles.statusShieldIcon} />
          <div>
            <Body2 className={styles.statusTitle}>
              Omnipos Counter Edition v1.0.0
            </Body2>
            <Caption1 className={styles.statusSubtitle}>
              Status: <span className={styles.statusTerminalActive}>● Terminal Active — Offline-Ready</span>
            </Caption1>
          </div>
        </div>

        <Button
          appearance="subtle"
          size="small"
          icon={<Key20Regular />}
          onClick={() => setIsLicenseOpen(true)}
          className={styles.technicianBtn}
        >
          Technician Access
        </Button>
      </div>

      {/* ── MODAL 1: Add New Staff / Cashier Dialog ────────── */}
      <Dialog open={isAddUserOpen} onOpenChange={(_, d) => setIsAddUserOpen(d.open)}>
        <DialogSurface className={styles.dialogSurfaceLarge}>
          <form onSubmit={handleSaveNewUser}>
            <DialogBody className={styles.dialogBodyNoOverflow}>
              <DialogTitle>Add New Cashier / Staff Member</DialogTitle>
              <DialogContent className={styles.dialogContentFlex}>
                <Text size={200} className={styles.dialogDescText}>
                  Create login credentials and grant access only to the modules this staff member is allowed to operate.
                </Text>

                <div className={styles.dialogGrid2}>
                  <CustomInput
                    label="Username (Login ID)"
                    required
                    placeholder="e.g. cashier1"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                  />

                  <CustomInput
                    label="Staff Full Name"
                    required
                    placeholder="e.g. Ali Raza"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className={styles.dialogGrid2}>
                  <CustomSelect
                    label="Role Classification"
                    required
                    value={formRole}
                    onChange={(val) => setFormRole(val as any)}
                    options={ROLE_OPTIONS}
                  />

                  <CustomInput
                    label="Login Password"
                    required
                    type="password"
                    placeholder="Min 4 characters"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                  />
                </div>

                <CustomInput
                  label="Contact Phone Number (Optional)"
                  placeholder="0300-1234567"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />

                <Divider />

                {/* Permissions Matrix */}
                <div>
                  <div className={styles.permMatrixHeader}>
                    <Caption1 className={styles.permMatrixTitle}>
                      Granular Module Permissions ({formRole === 'admin' ? 'All Modules Unlocked' : `${formPermissions.length} selected`})
                    </Caption1>

                    {formRole === 'cashier' && (
                      <div className={styles.btnGroup}>
                        <Button
                          size="small"
                          appearance="subtle"
                          onClick={() => setFormPermissions(ALL_PERMISSIONS.map((p) => p.key))}
                        >
                          Select All
                        </Button>
                        <Button
                          size="small"
                          appearance="subtle"
                          onClick={() => setFormPermissions(['pos_fastfood', 'pos_omnimart'])}
                        >
                          POS Only
                        </Button>
                        <Button
                          size="small"
                          appearance="subtle"
                          onClick={() => setFormPermissions([])}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className={styles.permissionGrid}>
                    {ALL_PERMISSIONS.map((p) => {
                      const isChecked = formRole === 'admin' || formPermissions.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          className={mergeClasses(
                            styles.permItem,
                            isChecked && styles.permItemActive,
                            formRole === 'admin' && styles.permItemDisabled
                          )}
                        >
                          <input
                            type="checkbox"
                            disabled={formRole === 'admin'}
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormPermissions([...formPermissions, p.key]);
                              } else {
                                setFormPermissions(formPermissions.filter((k) => k !== p.key));
                              }
                            }}
                            className={styles.permCheckbox}
                          />
                          <div className={styles.permTextCol}>
                            <span className={styles.permItemTitle}>
                              {p.label}
                            </span>
                            <span className={styles.permItemDesc}>
                              {p.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {userError && (
                  <Caption1 className={styles.formErrorText}>
                    {userError}
                  </Caption1>
                )}
              </DialogContent>

              <DialogActions className={styles.dialogActionsRow}>
                <Button
                  appearance="subtle"
                  onClick={() => setIsAddUserOpen(false)}
                  className={styles.dialogCancelBtn}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  icon={<Checkmark20Regular />}
                  className={styles.dialogSubmitBtn}
                >
                  Create Staff Account
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

      {/* ── MODAL 2: Edit Staff & Permissions Dialog ────────── */}
      <Dialog open={isEditUserOpen} onOpenChange={(_, d) => setIsEditUserOpen(d.open)}>
        <DialogSurface className={styles.dialogSurfaceLarge}>
          <form onSubmit={handleSaveEditUser}>
            <DialogBody className={styles.dialogBodyNoOverflow}>
              <DialogTitle>Edit Permissions: {selectedUser?.name}</DialogTitle>
              <DialogContent className={styles.dialogContentFlex}>
                <div className={styles.dialogGrid2}>
                  <CustomInput
                    label="Full Name"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />

                  <CustomSelect
                    label="Role"
                    required
                    value={formRole}
                    onChange={(val) => setFormRole(val as any)}
                    options={ROLE_OPTIONS}
                  />
                </div>

                <CustomInput
                  label="Contact Phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />

                <Divider />

                <div>
                  <div className={styles.permMatrixHeader}>
                    <Caption1 className={styles.permMatrixTitle}>
                      Module Permissions ({formRole === 'admin' ? 'All Modules Unlocked' : `${formPermissions.length} selected`})
                    </Caption1>

                    {formRole === 'cashier' && (
                      <div className={styles.btnGroup}>
                        <Button
                          size="small"
                          appearance="subtle"
                          onClick={() => setFormPermissions(ALL_PERMISSIONS.map((p) => p.key))}
                        >
                          Select All
                        </Button>
                        <Button
                          size="small"
                          appearance="subtle"
                          onClick={() => setFormPermissions(['pos_fastfood', 'pos_omnimart'])}
                        >
                          POS Only
                        </Button>
                        <Button
                          size="small"
                          appearance="subtle"
                          onClick={() => setFormPermissions([])}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className={styles.permissionGrid}>
                    {ALL_PERMISSIONS.map((p) => {
                      const isChecked = formRole === 'admin' || formPermissions.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          className={mergeClasses(
                            styles.permItem,
                            isChecked && styles.permItemActive,
                            formRole === 'admin' && styles.permItemDisabled
                          )}
                        >
                          <input
                            type="checkbox"
                            disabled={formRole === 'admin'}
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormPermissions([...formPermissions, p.key]);
                              } else {
                                setFormPermissions(formPermissions.filter((k) => k !== p.key));
                              }
                            }}
                            className={styles.permCheckbox}
                          />
                          <div className={styles.permTextCol}>
                            <span className={styles.permItemTitle}>
                              {p.label}
                            </span>
                            <span className={styles.permItemDesc}>
                              {p.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {userError && (
                  <Caption1 className={styles.formErrorText}>
                    {userError}
                  </Caption1>
                )}
              </DialogContent>

              <DialogActions className={styles.dialogActionsRow}>
                <Button
                  appearance="subtle"
                  onClick={() => setIsEditUserOpen(false)}
                  className={styles.dialogCancelBtn}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  icon={<Checkmark20Regular />}
                  className={styles.dialogSubmitBtn}
                >
                  Save Permissions
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

      {/* ── MODAL 3: Change Staff Password Dialog ──────────── */}
      <Dialog open={isChangePasswordOpen} onOpenChange={(_, d) => setIsChangePasswordOpen(d.open)}>
        <DialogSurface className={styles.dialogSurfaceSmall}>
          <form onSubmit={handleSaveChangePassword}>
            <DialogBody className={styles.dialogBodyNoOverflow}>
              <DialogTitle>Change Password</DialogTitle>
              <DialogContent className={styles.dialogContentFlex}>
                <div className={styles.userBannerRow}>
                  <Avatar name={selectedUser?.name} size={32} />
                  <div>
                    <span className={styles.userBannerName}>
                      {selectedUser?.name}
                    </span>
                    <span className={styles.userBannerMeta}>
                      Username: {selectedUser?.username} • Role: {selectedUser?.role?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <CustomInput
                  label="New Password"
                  required
                  type="password"
                  placeholder="Enter new password (min 4 characters)"
                  value={changePassNew}
                  onChange={(e) => setChangePassNew(e.target.value)}
                />

                <CustomInput
                  label="Confirm New Password"
                  required
                  type="password"
                  placeholder="Re-enter new password"
                  value={changePassConfirm}
                  onChange={(e) => setChangePassConfirm(e.target.value)}
                />

                {changePassError && (
                  <Caption1 className={styles.formErrorText}>
                    {changePassError}
                  </Caption1>
                )}

                {changePassSuccess && (
                  <div className={styles.successRow}>
                    <Checkmark20Filled />
                    <Caption1 className={styles.licenseOkText}>
                      Password updated successfully!
                    </Caption1>
                  </div>
                )}
              </DialogContent>

              <DialogActions className={styles.dialogActionsRow}>
                <Button
                  appearance="subtle"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className={styles.dialogCancelBtn}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  icon={<LockClosed20Regular />}
                  className={styles.dialogSubmitBtn}
                >
                  Update Password
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

      {/* ── Technician License Modal ───────────────────────── */}
      <Dialog open={isLicenseOpen} onOpenChange={(_, d) => setIsLicenseOpen(d.open)}>
        <DialogSurface className={styles.dialogSurfaceSmall}>
          <DialogBody>
            <DialogTitle>Technician / Software Activation</DialogTitle>
            <DialogContent>
              <Text as="p" size={200} className={styles.licenseDescText}>
                For software provider or technician use only. Registers this machine with the cloud license server.
              </Text>
              <div className={styles.dialogColGap14}>
                <CustomInput
                  label="License Key"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="OMNI-XXXX-XXXX-XXXX"
                />
                <CustomInput
                  label="License Server URL"
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                />
                {licenseMsg && (
                  <Caption1 className={licenseMsg.startsWith('Failed') ? styles.licenseErrText : styles.licenseOkText}>
                    {licenseMsg}
                  </Caption1>
                )}
              </div>
            </DialogContent>
            <DialogActions className={styles.licenseActions}>
              <Button appearance="outline" onClick={() => setIsLicenseOpen(false)}>
                Close
              </Button>
              <Button
                appearance="primary"
                onClick={handleActivateLicense}
                className={styles.saveButton}
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
