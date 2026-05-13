'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.getToken()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => api.clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.login(email, password);
    api.setToken(token);
    setUser(user);
    return user;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const { token, user } = await api.signup(name, email, password);
    api.setToken(token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, isAuthenticated: !!user }),
    [user, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
