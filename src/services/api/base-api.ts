import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import axios from 'axios';

import { config } from '@config/index';
import { logout } from '@slices/auth-slice';

type AuthStateShape = {
  auth: {
    token?: string | null;
  };
};

// Create axios instance with default config
export const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (configData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      configData.headers.Authorization = `Bearer ${token}`;
    }
    return configData;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401/403
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdminRoute = error.config?.url?.includes('/admin/');
      if (!isAdminRoute) {
        localStorage.removeItem('authToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      } else {
        // Admin routes 401 should redirect to admin login or just reject without resetting user auth
        console.warn('Admin API 401 Unauthorized', error.config?.url);
      }
    }
    return Promise.reject(error);
  }
);

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: config.apiUrl,
  timeout: config.apiTimeout,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthStateShape).auth.token;

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQueryWithAuth(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }

  if (result.error && result.error.status === 403) {
    console.error('Access forbidden:', args);
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Auth', 'Dashboard', 'Settings'],
  endpoints: () => ({}),
});

export const baseApiReducer = { [baseApi.reducerPath]: baseApi.reducer };
export const baseApiMiddleware = baseApi.middleware;