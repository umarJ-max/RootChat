import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { SERVER_URL } from '../utils/config';
import { registerForPushNotifications } from '../utils/notifications';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const t = await SecureStore.getItemAsync('token');
      const u = await SecureStore.getItemAsync('user');
      if (t && u) {
        try {
          await axios.get(`${SERVER_URL}/api/users`, {
            headers: { Authorization: `Bearer ${t}` }
          });
          setToken(t);
          setUser(JSON.parse(u));
          savePushToken(t);
        } catch (e) {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('user');
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const savePushToken = async (authToken) => {
    try {
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await axios.post(`${SERVER_URL}/api/users/push-token`,
          { token: pushToken },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      }
    } catch (e) {
      console.log('Push token error:', e);
    }
  };

  const register = async (name, phone, password) => {
    try {
      const res = await axios.post(`${SERVER_URL}/api/auth/register`, { name, phone, password });
      await SecureStore.setItemAsync('token', res.data.token);
      await SecureStore.setItemAsync('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      savePushToken(res.data.token);
    } catch (e) {
      const message = e.response?.data?.message || e.message || 'Registration failed';
      throw new Error(message);
    }
  };

  const login = async (phone, password) => {
    try {
      const res = await axios.post(`${SERVER_URL}/api/auth/login`, { phone, password });
      await SecureStore.setItemAsync('token', res.data.token);
      await SecureStore.setItemAsync('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      savePushToken(res.data.token);
    } catch (e) {
      const message = e.response?.data?.message || e.message || 'Login failed';
      throw new Error(message);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = async (updates) => {
    const updatedUser = { ...user, ...updates };
    await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);