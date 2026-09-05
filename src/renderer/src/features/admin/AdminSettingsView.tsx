import React, { useState } from 'react';
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
  Tooltip,
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
  PeopleCommunity24Regular,
  PersonAdd20Regular,
  Edit20Regular,
  Delete20Regular,
  LockClosed20Regular,
  Checkmark20Regular,
  Dismiss20Regular,
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
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  pageTitle: {
    fontWeight: 700,
    fontSize: '20px',
    color: tokens.colorNeutralForeground1,
    margin: 0,
    display: 'block',
  },
  pageSubtitle: {
    color: tokens.colorNeutralForeground2,
    marginTop: '4px',
    marginBottom: 0,
    display: 'block',
    fontSize: '13px',
  },
  primaryRedButton: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    padding: '0 18px',
    height: '38px',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.3)',
    ':hover': {
      backgroundColor: '#C4122C',
      color: '#FFFFFF',
    },
  },
  saveButton: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    padding: '0 20px',
    height: '38px',
    ':hover': {
      backgroundColor: '#C4122C',
      color: '#FFFFFF',
    },
  },
  tabNavContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    paddingBottom: '12px',
    flexWrap: 'wrap',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 18px',
    borderRadius: tokens.borderRadiusMedium,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    boxShadow: 'none',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  tabButtonActive: {
    borderWidth: '1.5px',
    borderColor: '#E51937',
    backgroundColor: 'rgba(229, 25, 55, 0.08)',
    color: '#E51937',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.12)',
  },
  tabIcon: {
    width: '18px',
    height: '18px',
    color: 'inherit',
  },
  tabIconActive: {
    color: '#E51937',
  },
  tabBadge: {
    fontWeight: 700,
    whiteSpace: 'nowrap',
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    color: '#E51937',
  },
  tabBadgeActive: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '16px',
    alignItems: 'start',
  },
  card: {
    padding: '0',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
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
  cardHeaderBetween: {
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  cardIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: tokens.colorNeutralForeground2,
  },
  cardIconBoxRed: {
    backgroundColor: 'rgba(229, 25, 55, 0.1)',
    color: '#E51937',
  },
  icon20: {
    width: '20px',
    height: '20px',
  },
  headerFlex: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerTextCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    display: 'block',
    lineHeight: '20px',
  },
  headerBadge: {
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    color: '#E51937',
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
    fontSize: '12px',
    lineHeight: '16px',
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
    backgroundColor: tokens.colorNeutralBackground3,
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
  segmentedItemActive: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontWeight: 700,
  },
  segmentedItemInactive: {
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground2,
    fontWeight: 400,
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
  switchRowTitle: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  switchRowDesc: {
    color: tokens.colorNeutralForeground2,
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
  tableWrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  userTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
  },
  th: {
    padding: '12px 16px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground2,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  thRight: {
    textAlign: 'right',
  },
  td: {
    padding: '14px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground1,
    verticalAlign: 'middle',
  },
  tdRight: {
    textAlign: 'right',
  },
  tableRow: {
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userName: {
    fontWeight: 700,
    display: 'block',
    color: tokens.colorNeutralForeground1,
  },
  userPhone: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  usernamePill: {
    fontFamily: 'monospace',
    fontWeight: 700,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  roleBadge: {
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: '10px',
  },
  statusToggleBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusDotActive: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
  },
  statusDotInactive: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#94A3B8',
  },
  statusTextActive: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#10B981',
  },
  statusTextInactive: {
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
  },
  permissionsBadgeRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  permissionsCountBadge: {
    backgroundColor: 'rgba(229, 25, 55, 0.1)',
    color: '#E51937',
  },
  permissionsListText: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  actionBtnsRow: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'flex-end',
  },
  deleteIcon: {
    color: '#E51937',
  },
  engineCard: {
    padding: '16px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke1,
    lineHeight: 1.6,
  },
  engineTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    display: 'block',
  },
  engineSubtitle: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
    marginTop: '6px',
  },
  engineStatusRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '12px',
  },
  engineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#107C41',
  },
  engineReadyText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#107C41',
  },
  paperWidthLabel: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground2,
  },
  testPrintRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  testPrintBtn: {
    color: tokens.colorNeutralForeground1,
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: 600,
  },
  testPrintSuccess: {
    color: '#107C41',
    fontWeight: 600,
  },
  taxHelper: {
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
  },
  icon12: {
    width: '12px',
    height: '12px',
  },
  statusBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statusShieldIcon: {
    color: '#107C41',
    width: '18px',
    height: '18px',
  },
  statusTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    display: 'block',
  },
  statusSubtitle: {
    color: tokens.colorNeutralForeground2,
  },
  statusTerminalActive: {
    color: '#107C41',
    fontWeight: 600,
  },
  technicianBtn: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
  },
  dialogSurfaceLarge: {
    borderRadius: tokens.borderRadiusLarge,
    maxWidth: '640px',
    width: '100%',
    overflowX: 'hidden',
  },
  dialogSurfaceSmall: {
    borderRadius: tokens.borderRadiusLarge,
    maxWidth: '440px',
    width: '100%',
    overflowX: 'hidden',
  },
  dialogBodyNoOverflow: {
    overflowX: 'hidden',
  },
  dialogContentFlex: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '14px',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
  dialogDescText: {
    color: tokens.colorNeutralForeground2,
  },
  dialogGrid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  permMatrixHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  permMatrixTitle: {
    fontWeight: 700,
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground1,
  },
  btnGroup: {
    display: 'flex',
    gap: '6px',
  },
  permissionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '10px',
    marginTop: '6px',
    maxHeight: '340px',
    overflowY: 'auto',
    padding: '4px',
  },
  permItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  permItemActive: {
    borderColor: '#E51937',
    backgroundColor: 'rgba(229, 25, 55, 0.05)',
  },
  permItemDisabled: {
    cursor: 'not-allowed',
  },
  permCheckbox: {
    marginTop: '2px',
    accentColor: '#E51937',
  },
  permTextCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  permItemTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
  },
  permItemDesc: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  formErrorText: {
    color: '#E51937',
    fontWeight: 600,
  },
  dialogActionsRow: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  dialogCancelBtn: {
    whiteSpace: 'nowrap',
    flexShrink: 0,
    height: '38px',
    padding: '0 16px',
  },
  dialogSubmitBtn: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    padding: '0 24px',
    height: '38px',
    borderRadius: tokens.borderRadiusMedium,
    ':hover': {
      backgroundColor: '#C4122C',
      color: '#FFFFFF',
    },
  },
  userBannerRow: {
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userBannerName: {
    fontWeight: 700,
    display: 'block',
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
  },
  userBannerMeta: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  successRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#10B981',
  },
  licenseDescText: {
    color: tokens.colorNeutralForeground2,
    marginBottom: '16px',
    display: 'block',
  },
  dialogColGap14: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  licenseErrText: {
    color: '#E51937',
    fontWeight: 600,
  },
  licenseOkText: {
    color: '#107C41',
    fontWeight: 600,
  },
  licenseActions: {
    paddingTop: '16px',
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

  // ── Tab State ──
  const [activeTab, setActiveTab] = useState<'staff' | 'profile' | 'hardware'>('staff');

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

  const handleDeleteUser = (u: AppUser) => {
    if (u.username === 'admin') {
      alert('The primary Store Administrator account cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete user "${u.username}" (${u.name})?`)) {
      try {
        userStorage.deleteUser(u.id);
        setUsers(userStorage.getUsers());
      } catch (err: any) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  const handleToggleUserStatus = (u: AppUser) => {
    try {
      userStorage.updateUser(u.id, { isActive: !u.isActive });
      setUsers(userStorage.getUsers());
    } catch (err: any) {
      alert(err.message);
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
                        <Tooltip content="Change Password" relationship="label">
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Key20Regular />}
                            onClick={() => handleOpenChangePassword(u)}
                          />
                        </Tooltip>

                        <Tooltip content="Edit Permissions" relationship="label">
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Edit20Regular />}
                            onClick={() => handleOpenEditUser(u)}
                          />
                        </Tooltip>

                        {u.username !== 'admin' && (
                          <Tooltip content="Delete Cashier" relationship="label">
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<Delete20Regular className={styles.deleteIcon} />}
                              onClick={() => handleDeleteUser(u)}
                            />
                          </Tooltip>
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
