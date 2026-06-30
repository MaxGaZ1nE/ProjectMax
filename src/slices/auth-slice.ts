import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Gender = 'male' | 'female' | 'other' | '';

export interface User {
  id: string;
  email: string;

  firstName?: string;
  lastName?: string;

  // รองรับโค้ดเก่า
  name?: string;

  phone?: string;
  birthDate?: string; // YYYY-MM-DD
  gender?: Gender;

  address?: string;
  province?: string;
  postalCode?: string;

  avatarUrl?: string;

  role?: 'admin' | 'seller' | 'customer' | 'delivery'; // เพิ่ม delivery role
  shopId?: number; // ✅ Add shopId for seller status check
  isSeller?: boolean; // ✅ Add isSeller flag
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
  gender?: Gender;
  address?: string;
  province?: string;
  postalCode?: string;
  avatarUrl?: string;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    login: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },

    updateProfile: (state, action: PayloadAction<UpdateProfilePayload>) => {
      if (!state.user) return;

      const p = action.payload;

      // update only if provided
      if (p.firstName !== undefined) state.user.firstName = p.firstName;
      if (p.lastName !== undefined) state.user.lastName = p.lastName;

      // keep backward compatible 'name'
      if (p.firstName !== undefined || p.lastName !== undefined) {
        const fn = (p.firstName ?? state.user.firstName ?? '').trim();
        const ln = (p.lastName ?? state.user.lastName ?? '').trim();
        state.user.name = `${fn} ${ln}`.trim();
      }

      if (p.phone !== undefined) state.user.phone = p.phone;
      if (p.birthDate !== undefined) state.user.birthDate = p.birthDate;
      if (p.gender !== undefined) state.user.gender = p.gender;

      if (p.address !== undefined) state.user.address = p.address;
      if (p.province !== undefined) state.user.province = p.province;
      if (p.postalCode !== undefined) state.user.postalCode = p.postalCode;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const { setUser, setToken, setLoading, login, updateProfile, logout } =
  authSlice.actions;

export default authSlice.reducer;