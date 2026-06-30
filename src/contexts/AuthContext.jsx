// ==============================
// Auth Context - FIXED VERSION
// ==============================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@services/backend-api';
import { store } from '@stores/index';
import {
  login as reduxLogin,
  logout as reduxLogout,
} from '@slices/auth-slice';
import { clearCart } from '@slices/cart-slice';
import { clearAllNotifications } from '@slices/notification-slice';
import { clearAllSellerNotifications } from '@slices/seller-notifications-slice';
import { logoutSeller } from '@slices/seller-slice';
import { clearFollowedShops } from '@slices/follow-shop-slice';
import { clearAllOrders } from '@slices/order-slice';
import { clearCheckoutDraft } from '@slices/checkout-slice';

// Create context
const AuthContext = createContext(null);

/**
 * ✅ Helper function to clear all user-related localStorage
 */
function clearAllUserDataFromStorage() {
  const keysToRemove = [
    'ffy_followed_shops_v1',
    'ffy_seller_products_v1',
    'ffy_seller_orders_v1',
    'ffy_address_book_v1',
    'ffy_avatar_preview',
  ];
  
  // Remove all keys starting with ffy_shop_name_ and ffy_shop_avatar_
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith('ffy_shop_name_') || key.startsWith('ffy_shop_avatar_')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove specific keys
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * ✅ Helper function to clear all Redux app state
 */
function clearAllAppState() {
  store.dispatch(clearCart());
  store.dispatch(clearAllNotifications());
  store.dispatch(clearAllSellerNotifications());
  store.dispatch(logoutSeller());
  store.dispatch(clearFollowedShops());
  store.dispatch(clearAllOrders());
  store.dispatch(clearCheckoutDraft());
}

/**
 * Map backend response (snake_case) to frontend (camelCase)
 */
function mapUserFromBackend(data) {
  return {
    id: String(data?.id || ''),
    email: data?.email || '',
    firstName: data?.first_name || data?.firstName || '',
    lastName: data?.last_name || data?.lastName || '',
    name: `${data?.first_name || data?.firstName || ''} ${data?.last_name || data?.lastName || ''}`.trim(),
    phone: data?.phone || '',
    role: data?.role || 'customer',
    address: data?.address || '',
    province: data?.province || '',
    postalCode: data?.postal_code || data?.postalCode || '',
    birthDate: data?.birth_date || data?.birthDate || '',
    gender: data?.gender || '',
    avatarUrl: data?.avatar_url || data?.avatarUrl || '',
    shopId: data?.shop_id || data?.shopId || null,
    token: data?.token || null,
  };
}

/**
 * Sync auth state with Redux store
 */
function syncToRedux(userData, tokenValue) {
  if (userData && tokenValue) {
    store.dispatch(
      reduxLogin({
        user: userData,
        token: tokenValue,
      })
    );
  } else {
    store.dispatch(reduxLogout());
  }
}

// ==============================
// Auth Provider
// ==============================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==============================
  // INIT (โหลดจาก localStorage)
  // ==============================
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);

        setToken(savedToken);
        setUser(parsedUser);

        syncToRedux(parsedUser, savedToken);

        // ✅ FIX: Fetch fresh profile silently to catch role/shop updates (e.g. after Admin Approval)
        authAPI.getProfile().then(res => {
          const freshData = res.normalizedData;
          const freshMappedUser = {
            id: String(freshData?.id || ''),
            email: freshData?.email || '',
            firstName: freshData?.first_name || freshData?.firstName || '',
            lastName: freshData?.last_name || freshData?.lastName || '',
            name: `${freshData?.first_name || freshData?.firstName || ''} ${freshData?.last_name || freshData?.lastName || ''}`.trim(),
            phone: freshData?.phone || '',
            role: freshData?.role || 'customer',
            address: freshData?.address || '',
            province: freshData?.province || '',
            postalCode: freshData?.postal_code || freshData?.postalCode || '',
            birthDate: freshData?.birth_date || freshData?.birthDate || '',
            gender: freshData?.gender || '',
            avatarUrl: freshData?.avatar_url || freshData?.avatarUrl || '',
            shopId: freshData?.shop_id || freshData?.shopId || null,
            token: savedToken,
          };
          setUser(freshMappedUser);
          localStorage.setItem('user', JSON.stringify(freshMappedUser));
          syncToRedux(freshMappedUser, savedToken);
        }).catch(err => {
          console.error('Silent profile fetch failed:', err);
        });
      } else {
        // ✅ FIX: ถ้าไม่มี token ใน localStorage ต้อง clear Redux auth state
        // ป้องกัน redux-persist rehydrate ค่าเก่า (isAuthenticated: true) ที่ค้างอยู่
        // ซึ่งทำให้ GuestGuard redirect ออกจาก /auth/login → infinite loop
        syncToRedux(null, null);
      }
    } catch (err) {
      console.error('❌ Load user error:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      syncToRedux(null, null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ==============================
  // REGISTER
  // ==============================
  const register = async (email, phone, password, firstName, lastName = '', role = 'customer') => {
    try {
      setError(null);

      const res = await authAPI.register({
        email,
        phone,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
      });

      const data = res.normalizedData;

      const mappedUser = mapUserFromBackend(data);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(mappedUser));

      // ✅ Clear all previous user data (prevent data leak from previous account)
      clearAllUserDataFromStorage();
      clearAllAppState();

      setToken(data.token);
      setUser(mappedUser);

      syncToRedux(mappedUser, data.token);

      return mappedUser;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Register failed';
      setError(msg);
      throw err;
    }
  };

  // ==============================
  // LOGIN
  // ==============================
  const login = async (emailOrPhone, password) => {
    try {
      setError(null);

      const res = await authAPI.login(emailOrPhone, password);
      const data = res.normalizedData;

      const mappedUser = mapUserFromBackend(data);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(mappedUser));

      // ✅ Clear all previous user data (prevent data leak from previous account)
      clearAllUserDataFromStorage();
      clearAllAppState();

      setToken(data.token);
      setUser(mappedUser);

      syncToRedux(mappedUser, data.token);

      return mappedUser;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
      throw err;
    }
  };

  // ==============================
  // GET PROFILE
  // ==============================
  const getProfile = async () => {
    try {
      setError(null);

      const res = await authAPI.getProfile();
      const data = res.normalizedData;

      const mappedUser = mapUserFromBackend(data);

      localStorage.setItem('user', JSON.stringify(mappedUser));
      setUser(mappedUser);

      const currentToken = localStorage.getItem('token');
      syncToRedux(mappedUser, currentToken);

      return mappedUser;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Get profile failed';
      setError(msg);
      throw err;
    }
  };

  // ==============================
  // UPDATE PROFILE ✅ FIX สำคัญ
  // ==============================
  const updateProfile = async (profileData) => {
    try {
      setError(null);

      console.log('📤 UPDATE PROFILE:', profileData);

      const res = await authAPI.updateProfile(profileData);
      const data = res.normalizedData;

      const mappedUser = mapUserFromBackend(data);

      // ✅ Merge with current user to keep token and other unchanged fields
      // Do NOT put side effects (localStorage, dispatch) inside the setUser updater
      const mergedUser = { ...user, ...mappedUser };
      
      setUser(mergedUser);
      
      // Update localStorage with the merged result
      localStorage.setItem('user', JSON.stringify(mergedUser));
      
      // Sync Redux with the merged result
      const currentToken = localStorage.getItem('token');
      syncToRedux(mergedUser, currentToken);

      console.log('✅ PROFILE UPDATED:', mappedUser);

      return mappedUser;
    } catch (err) {
      console.error('❌ UPDATE PROFILE ERROR:', err);
      const msg = err?.response?.data?.message || err?.message || 'Update profile failed';
      setError(msg);
      throw err;
    }
  };

  // ==============================
  // CHANGE PASSWORD
  // ==============================
  const changePassword = async (oldPassword, newPassword) => {
    try {
      setError(null);
      await authAPI.changePassword(oldPassword, newPassword);
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Change password failed';
      setError(msg);
      throw err;
    }
  };

  // ==============================
  // LOGOUT
  // ==============================
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // ✅ Clear all user-related data (prevent data leak to next user)
      clearAllUserDataFromStorage();

      setToken(null);
      setUser(null);
      setError(null);

      syncToRedux(null, null);
      
      // ✅ Clear all app state
      clearAllAppState();
    }
  };

  // ==============================
  // HELPERS
  // ==============================
  const isAuthenticated = () => !!token && !!user;
  const hasRole = (role) => user?.role === role;

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    isAuthenticated,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ==============================
// HOOK
// ==============================
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export default AuthContext;
