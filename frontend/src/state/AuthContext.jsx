import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) return;
      try {
        const res = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (err) {
        // Only remove token if it's a 401 (invalid token), not network error
        if (err.response && err.response.status === 401) {
          setToken(null);
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [token]);

  const login = (jwt, userData) => {
    setToken(jwt);
    setUser(userData);
    localStorage.setItem('token', jwt);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

