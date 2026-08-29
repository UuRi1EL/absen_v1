import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/auth.types';
import { api, setAccessToken } from '../utils/axios.instance';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.post('/auth/refresh-token');
        const token = res.data.data.accessToken;
        setAccessToken(token);
        const meRes = await api.get('/auth/me');
        setUser(meRes.data.data);
      } catch (err) {
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = (token: string, userProfile: UserProfile) => {
    setAccessToken(token);
    setUser(userProfile);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
