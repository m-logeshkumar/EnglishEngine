import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken } from '../services/apiClient';

const AuthContext = createContext(null);

const CURRENT_USER_KEY = 'voiceiq_current_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrapAuth() {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          localStorage.removeItem(CURRENT_USER_KEY);
        }
      }

      try {
        const { user: freshUser } = await apiRequest('/auth/me', {}, true);
        setUser(freshUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(freshUser));
      } catch {
        setUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
        setAuthToken('');
      } finally {
        setLoading(false);
      }
    }

    bootstrapAuth();
  }, []);

  const signup = async (name, email, password, college = '') => {
    const { user: createdUser, token } = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, college }),
    });

    setAuthToken(token);
    setUser(createdUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(createdUser));
    return createdUser;
  };

  const login = async (email, password) => {
    const { user: loggedInUser, token } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAuthToken(token);
    setUser(loggedInUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loggedInUser));
    return loggedInUser;
  };

  const logout = () => {
    setUser(null);
    setAuthToken('');
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateUser = (updates) => {
    if (user) {
      const merged = { ...user, ...updates };
      setUser(merged);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(merged));
    }
  };

  const getAllUsers = async () => {
    const { users } = await apiRequest('/auth/users', {}, true);
    return users;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, updateUser, getAllUsers, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
