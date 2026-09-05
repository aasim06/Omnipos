import { uid } from '@/lib/utils';

export type UserPermissionKey =
  | 'pos_fastfood'
  | 'pos_omnimart'
  | 'kitchen'
  | 'catalog'
  | 'inventory'
  | 'khata'
  | 'expenses'
  | 'reports'
  | 'admin';

export interface PermissionDefinition {
  key: UserPermissionKey;
  label: string;
  category: 'POS & Operations' | 'Catalog & Stock' | 'Finance & Admin';
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'pos_fastfood',
    label: 'Fast Food POS',
    category: 'POS & Operations',
    description: 'Create orders, food tickets, and bill checkout in Fast Food POS',
  },
  {
    key: 'pos_omnimart',
    label: 'Omnimart POS',
    category: 'POS & Operations',
    description: 'Barcode scanning, retail grocery billing, and scale weighing',
  },
  {
    key: 'kitchen',
    label: 'Kitchen Display (KDS)',
    category: 'POS & Operations',
    description: 'View kitchen order tickets and manage meal preparation stages',
  },
  {
    key: 'catalog',
    label: 'Products & Catalog',
    category: 'Catalog & Stock',
    description: 'Manage items, pricing, menu categories, and product creation',
  },
  {
    key: 'inventory',
    label: 'Inventory & Stock Hub',
    category: 'Catalog & Stock',
    description: 'Stock in receiving, deductions, vendor ledger, and movement audit',
  },
  {
    key: 'khata',
    label: 'Khata Ledger Book',
    category: 'Finance & Admin',
    description: 'Customer credit ledger, debt tracking, and payment receipts',
  },
  {
    key: 'expenses',
    label: 'Expenses & Cash Drawer',
    category: 'Finance & Admin',
    description: 'Record petty cash, store expenses, and register float reconciliation',
  },
  {
    key: 'reports',
    label: 'Profit & Loss Analytics',
    category: 'Finance & Admin',
    description: 'View business reports, revenue trends, and financial metrics',
  },
  {
    key: 'admin',
    label: 'Store & Admin Settings',
    category: 'Finance & Admin',
    description: 'Full store configuration, hardware settings, and staff permissions',
  },
];

export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'cashier';
  password: string;
  permissions: UserPermissionKey[];
  isActive: boolean;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

function getStorageKey(): string {
  if (typeof window === 'undefined') return 'omnipos.users';
  const key = (
    localStorage.getItem('omnipos_active_key') ||
    localStorage.getItem('omnipos_license_key') ||
    'DEFAULT'
  ).toUpperCase().trim();
  return `omnipos.users.${key}`;
}

const DEFAULT_ADMIN_PERMISSIONS: UserPermissionKey[] = [
  'pos_fastfood',
  'pos_omnimart',
  'kitchen',
  'catalog',
  'inventory',
  'khata',
  'expenses',
  'reports',
  'admin',
];

const DEFAULT_CASHIER_PERMISSIONS: UserPermissionKey[] = [
  'pos_fastfood',
  'pos_omnimart',
];

export function createLicenseAdmin(custom?: { username?: string; password?: string; name?: string }): AppUser {
  return {
    id: `user_admin_${Date.now()}`,
    username: custom?.username?.trim() || 'admin',
    name: custom?.name?.trim() || 'Store Manager (Admin)',
    role: 'admin',
    password: custom?.password?.trim() || '1234',
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

class UserStorage {
  /**
   * Initializes or updates the Admin account for a specific license key.
   */
  initAdminForLicense(
    licenseKey: string,
    custom?: { username?: string; password?: string; name?: string },
  ): AppUser {
    const normKey = (licenseKey || 'DEFAULT').toUpperCase().trim();
    const storageKey = `omnipos.users.${normKey}`;
    const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingAdmin = parsed.find((u: AppUser) => u.role === 'admin' && u.isActive);
          if (existingAdmin) {
            // Update admin name or password if provided
            let changed = false;
            if (custom?.name && custom.name !== existingAdmin.name) {
              existingAdmin.name = custom.name;
              changed = true;
            }
            if (custom?.password && custom.password !== existingAdmin.password) {
              existingAdmin.password = custom.password;
              changed = true;
            }
            if (changed) {
              localStorage.setItem(storageKey, JSON.stringify(parsed));
            }
            return existingAdmin;
          }
        }
      } catch {}
    }

    const admin = createLicenseAdmin(custom);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify([admin]));
    }
    return admin;
  }

  private load(): AppUser[] {
    try {
      const storageKey = getStorageKey();
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure at least one active admin exists
          const hasAdmin = parsed.some((u) => u.role === 'admin' && u.isActive);
          if (!hasAdmin) {
            const admin = createLicenseAdmin();
            const updated = [admin, ...parsed];
            this.save(updated);
            return updated;
          }
          return parsed;
        }
      }

      // First time loading this license key: dynamically generate its designated admin
      const activeKey = (
        localStorage.getItem('omnipos_active_key') ||
        localStorage.getItem('omnipos_license_key') ||
        'DEFAULT'
      ).toUpperCase().trim();

      const admin = this.initAdminForLicense(activeKey);
      return [admin];
    } catch {
      return [];
    }
  }

  private save(users: AppUser[]): void {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(users));
    } catch (e) {
      console.error('[UserStorage] Failed to save users:', e);
    }
  }

  getUsers(): AppUser[] {
    return this.load();
  }

  getUserById(id: string): AppUser | null {
    return this.load().find((u) => u.id === id) || null;
  }

  getUserByUsername(username: string): AppUser | null {
    const clean = username.trim().toLowerCase();
    return this.load().find((u) => u.username.toLowerCase() === clean) || null;
  }

  createUser(data: {
    username: string;
    name: string;
    role: 'admin' | 'cashier';
    password: string;
    permissions: UserPermissionKey[];
    phone?: string;
    isActive?: boolean;
  }): AppUser {
    const users = this.load();
    const cleanUsername = data.username.trim().toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      throw new Error(`Username "${data.username}" is already taken.`);
    }

    const newUser: AppUser = {
      id: `user_${uid()}`,
      username: cleanUsername,
      name: data.name.trim(),
      role: data.role,
      password: data.password.trim(),
      permissions:
        data.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : data.permissions,
      isActive: data.isActive ?? true,
      phone: data.phone?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.save(users);
    return newUser;
  }

  updateUser(
    id: string,
    updates: Partial<Omit<AppUser, 'id' | 'createdAt'>>
  ): AppUser {
    const users = this.load();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error('User not found.');
    }

    const existing = users[index];

    // If changing username, check uniqueness
    if (updates.username) {
      const cleanUsername = updates.username.trim().toLowerCase();
      if (
        cleanUsername !== existing.username.toLowerCase() &&
        users.some((u) => u.username.toLowerCase() === cleanUsername)
      ) {
        throw new Error(`Username "${updates.username}" is already taken.`);
      }
      updates.username = cleanUsername;
    }

    // Admins always have all permissions
    let nextPermissions = updates.permissions ?? existing.permissions;
    const nextRole = updates.role ?? existing.role;
    if (nextRole === 'admin') {
      nextPermissions = DEFAULT_ADMIN_PERMISSIONS;
    }

    const updatedUser: AppUser = {
      ...existing,
      ...updates,
      role: nextRole,
      permissions: nextPermissions,
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedUser;
    this.save(users);
    return updatedUser;
  }

  changePassword(userId: string, newPass: string): boolean {
    const users = this.load();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    user.password = newPass.trim();
    user.updatedAt = new Date().toISOString();
    this.save(users);
    return true;
  }

  deleteUser(id: string): boolean {
    const users = this.load();
    const target = users.find((u) => u.id === id);
    if (!target) return false;

    // Safety: prevent deleting the last active admin
    if (target.role === 'admin') {
      const activeAdmins = users.filter((u) => u.role === 'admin' && u.isActive && u.id !== id);
      if (activeAdmins.length === 0) {
        throw new Error('Cannot delete the only remaining active Administrator.');
      }
    }

    const filtered = users.filter((u) => u.id !== id);
    this.save(filtered);
    return true;
  }

  verifyCredentials(
    username: string,
    password: string
  ): { success: boolean; user?: AppUser; error?: string } {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const user = this.getUserByUsername(cleanUsername);
    if (!user) {
      return { success: false, error: 'User not found with this username.' };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: 'This account has been deactivated by the store administrator.',
      };
    }

    if (user.password !== cleanPass) {
      return { success: false, error: 'Invalid password. Please check your credentials.' };
    }

    return { success: true, user };
  }
}

export const userStorage = new UserStorage();
