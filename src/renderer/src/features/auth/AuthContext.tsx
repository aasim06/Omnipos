import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserPermissionKey, userStorage, AppUser } from './userStorage';

export interface UserSession {
  id?: string;
  username: string;
  name: string;
  role: 'admin' | 'cashier';
  permissions: UserPermissionKey[];
  expiresAt?: number; // 24-hour expiration timestamp
}

interface AuthContextType {
  user: UserSession | null;
  login: (usernameOrUser: string | AppUser, role?: 'admin' | 'cashier') => void;
  logout: () => void;
  hasPermission: (permission: UserPermissionKey) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  hasPermission: () => false,
  isAuthenticated: false,
});

// 24 Hours in milliseconds
const SESSION_DURATION_HOURS = 24;
const SESSION_DURATION_MS = SESSION_DURATION_HOURS * 60 * 60 * 1000;

// ── Cookie Helpers (Configured for 24 Hours) ──
function setCookie(name: string, value: string, hours = SESSION_DURATION_HOURS) {
  try {
    const expires = new Date(Date.now() + hours * 3600 * 1000).toUTCString();
    const maxAge = hours * 3600;
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; max-age=${maxAge}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('[Cookie] Failed to set cookie:', e);
  }
}

function getCookie(name: string): string | null {
  try {
    const matches = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
    );
    return matches ? decodeURIComponent(matches[1]) : null;
  } catch {
    return null;
  }
}

function deleteCookie(name: string) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('[Cookie] Failed to delete cookie:', e);
  }
}

function validateSession(session: UserSession | null): UserSession | null {
  if (!session) return null;
  // If session expired after 24 hours, invalidate it
  if (session.expiresAt && Date.now() > session.expiresAt) {
    deleteCookie('omnipos_user_session');
    localStorage.removeItem('omnipos_user_session');
    return null;
  }

  // Ensure permissions array is populated
  if (!session.permissions || !Array.isArray(session.permissions)) {
    if (session.role === 'admin') {
      session.permissions = [
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
    } else {
      // Check stored user in userStorage
      const found = userStorage.getUserByUsername(session.username);
      session.permissions = found ? found.permissions : ['pos_fastfood', 'pos_omnimart'];
    }
  }

  return session;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      // 1. Try reading from cookie first
      const cookieData = getCookie('omnipos_user_session');
      if (cookieData) {
        const validated = validateSession(JSON.parse(cookieData));
        if (validated) return validated;
      }

      // 2. Fallback to localStorage
      const saved = localStorage.getItem('omnipos_user_session');
      if (saved) {
        const validated = validateSession(JSON.parse(saved));
        if (validated) return validated;
      }

      return null;
    } catch {
      return null;
    }
  });

  const logout = () => {
    setUser(null);
    deleteCookie('omnipos_user_session');
    localStorage.removeItem('omnipos_user_session');
  };

  // Automatically log out when the 24 hours expire even if the app stays open
  useEffect(() => {
    if (!user?.expiresAt) return;

    const remainingTime = user.expiresAt - Date.now();
    if (remainingTime <= 0) {
      logout();
      return;
    }

    const timer = setTimeout(() => {
      logout();
    }, remainingTime);

    return () => clearTimeout(timer);
  }, [user]);

  const login = (usernameOrUser: string | AppUser, fallbackRole: 'admin' | 'cashier' = 'admin') => {
    const expiresAt = Date.now() + SESSION_DURATION_MS; // Exactly 24 hours from now
    let session: UserSession;

    if (typeof usernameOrUser === 'object' && usernameOrUser !== null) {
      const u = usernameOrUser as AppUser;
      session = {
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        permissions: u.role === 'admin'
          ? [
              'pos_fastfood',
              'pos_omnimart',
              'kitchen',
              'catalog',
              'inventory',
              'khata',
              'expenses',
              'reports',
              'admin',
            ]
          : u.permissions,
        expiresAt,
      };
    } else {
      const username = usernameOrUser as string;
      const stored = userStorage.getUserByUsername(username);
      if (stored) {
        session = {
          id: stored.id,
          username: stored.username,
          name: stored.name,
          role: stored.role,
          permissions: stored.role === 'admin'
            ? [
                'pos_fastfood',
                'pos_omnimart',
                'kitchen',
                'catalog',
                'inventory',
                'khata',
                'expenses',
                'reports',
                'admin',
              ]
            : stored.permissions,
          expiresAt,
        };
      } else {
        session = {
          username,
          name: username === 'admin' ? 'Store Manager (Admin)' : 'Counter Cashier',
          role: fallbackRole,
          permissions: fallbackRole === 'admin'
            ? [
                'pos_fastfood',
                'pos_omnimart',
                'kitchen',
                'catalog',
                'inventory',
                'khata',
                'expenses',
                'reports',
                'admin',
              ]
            : ['pos_fastfood', 'pos_omnimart'],
          expiresAt,
        };
      }
    }

    setUser(session);

    // Save in Cookies with 24h expiration & max-age, and localStorage
    setCookie('omnipos_user_session', JSON.stringify(session), SESSION_DURATION_HOURS);
    localStorage.setItem('omnipos_user_session', JSON.stringify(session));
  };

  const hasPermission = (permission: UserPermissionKey): boolean => {
    if (!user) return false;
    // Admins always have access to everything
    if (user.role === 'admin') return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

