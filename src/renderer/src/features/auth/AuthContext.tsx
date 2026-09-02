import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  username: string;
  name: string;
  role: 'admin' | 'cashier';
}

interface AuthContextType {
  user: UserSession | null;
  login: (username: string, role?: 'admin' | 'cashier') => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('omnipos_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (username: string, role: 'admin' | 'cashier' = 'admin') => {
    const session: UserSession = {
      username,
      name: username === 'admin' ? 'Store Manager (Admin)' : 'Counter Cashier',
      role,
    };
    setUser(session);
    localStorage.setItem('omnipos_user_session', JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('omnipos_user_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
