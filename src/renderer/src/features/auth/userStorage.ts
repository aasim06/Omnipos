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

const STORAGE_KEY = 'omnipos.users';

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

const INITIAL_USERS: AppUser[] = [
  {
    id: 'user_admin_01',
    username: 'admin',
    name: 'Store Manager (Admin)',
    role: 'admin',
    password: '1234',
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    isActive: true,
    phone: '0300-1234567',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_cashier_01',
    username: 'cashier',
    name: 'Counter Cashier',
    role: 'cashier',
    password: '1234',
    permissions: DEFAULT_CASHIER_PERMISSIONS,
    isActive: true,
    phone: '0321-7654321',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class UserStorage {
  private load(): AppUser[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.save(INITIAL_USERS);
        return INITIAL_USERS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      this.save(INITIAL_USERS);
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  private save(users: AppUser[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
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
