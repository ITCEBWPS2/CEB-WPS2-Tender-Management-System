import React, { createContext, useContext, useState } from 'react';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  epfNumber?: string;
  status?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  getRoleHomeRoute: (role?: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getRoleHomeRoute = (role?: string): string => {
  if (!role) return '/admin/dashboard';
  const normalizedRole = role.toLowerCase().trim();
  if (normalizedRole === 'super admin' || normalizedRole === 'admin') {
    return '/admin/dashboard';
  }
  if (normalizedRole === 'procurement') {
    return '/procurement/dashboard';
  }
  if (normalizedRole === 'cecom') {
    return '/cecom/dashboard';
  }
  if (normalizedRole === 'clerk') {
    return '/clerk/dashboard';
  }
  return '/admin/dashboard';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return (
      localStorage.getItem('authToken') ||
      localStorage.getItem('mock-auth-token') ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('mock-auth-token') ||
      null
    );
  });

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);

    // Persist in localStorage
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('mock-auth-token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    // Also sync to sessionStorage for backwards compatibility with existing api fetches
    sessionStorage.setItem('authToken', newToken);
    sessionStorage.setItem('mock-auth-token', newToken);
    sessionStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem('authToken');
    localStorage.removeItem('mock-auth-token');
    localStorage.removeItem('user');

    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('mock-auth-token');
    sessionStorage.removeItem('user');
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        login,
        logout,
        getRoleHomeRoute
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
