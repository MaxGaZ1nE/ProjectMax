import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// ใช้ adminAPI จาก backend-api.js เพราะอ่าน token จาก localStorage('token') ถูกต้อง
import { adminAPI } from '@services/backend-api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  role: string;
  banned?: boolean;
  banReason?: string;
  shopName?: string;
  createdAt: string;
  // Multi-role indicators returned by getUsers API
  sellerId?:   string | null;
  deliveryId?: string | null;
  shopActive?: boolean | null;
}

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  total: 0,
  totalPages: 1,
  page: 1,
  limit: 20,
};

// Async Thunks
export const fetchUsers = createAsyncThunk(
  'adminUsers/fetchUsers',
  async ({ page = 1, limit = 20, search = '', role = '' }: any, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getUsers(page, limit, search, role);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const updateUserRoles = createAsyncThunk(
  'adminUsers/updateUserRoles',
  async ({ userId, roles }: { userId: string; roles: string[] }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.changeUserRoles(userId, roles);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user roles');
    }
  }
);

export const banUser = createAsyncThunk(
  'adminUsers/banUser',
  async ({ userId, reason, duration }: { userId: string; reason: string; duration?: number }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.banUser(userId, reason, duration);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to ban user');
    }
  }
);

export const unbanUser = createAsyncThunk(
  'adminUsers/unbanUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await adminAPI.unbanUser(userId);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unban user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'adminUsers/deleteUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await adminAPI.deleteUser(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

export const deactivateAccount = createAsyncThunk(
  'adminUsers/deactivateAccount',
  async ({ userId, reason }: { userId: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.deactivateAccount(userId, reason);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deactivate account');
    }
  }
);

export const reactivateAccount = createAsyncThunk(
  'adminUsers/reactivateAccount',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await adminAPI.reactivateAccount(userId);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reactivate account');
    }
  }
);

export const getAccountStatus = createAsyncThunk(
  'adminUsers/getAccountStatus',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getAccountStatus(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get account status');
    }
  }
);

const adminUsersSlice = createSlice({
  name: 'adminUsers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns: axios response => response.data = { success, data: [...users], meta: {...} }
        const payload = (action.payload as any);
        const responseData = payload?.data?.data ?? payload?.data ?? [];
        const meta = payload?.data?.meta ?? {};
        state.users = Array.isArray(responseData) ? responseData : [];
        state.total = meta.total ?? state.users.length;
        state.totalPages = meta.totalPages ?? 1;
        state.page = meta.page ?? 1;
        state.limit = meta.limit ?? 20;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateUserRoles
      .addCase(updateUserRoles.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUserRoles.fulfilled, (state, action) => {
        state.loading = false;
        // Update in-place
        const updated = (action.payload as any)?.data?.data ?? (action.payload as any)?.data;
        if (updated?.id) {
          const index = state.users.findIndex((u) => u.id === updated.id?.toString());
          if (index !== -1) {
            state.users[index] = { ...state.users[index], role: updated.role, sellerId: updated.sellerId, deliveryId: updated.deliveryId };
          }
        }
      })
      .addCase(updateUserRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // banUser
      .addCase(banUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(banUser.fulfilled, (state, action) => {
        state.loading = false;
        const updated = (action.payload as any)?.data?.data ?? (action.payload as any)?.data;
        if (updated?.id) {
          const index = state.users.findIndex((u) => u.id === updated.id?.toString());
          if (index !== -1) {
            state.users[index] = { ...state.users[index], banned: true };
          }
        }
      })
      .addCase(banUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // unbanUser
      .addCase(unbanUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(unbanUser.fulfilled, (state, action) => {
        state.loading = false;
        const updated = (action.payload as any)?.data?.data ?? (action.payload as any)?.data;
        if (updated?.id) {
          const index = state.users.findIndex((u) => u.id === updated.id?.toString());
          if (index !== -1) {
            state.users[index] = { ...state.users[index], banned: false };
          }
        }
      })
      .addCase(unbanUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // deleteUser
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        // action.payload is the userId string
        state.users = state.users.filter((u) => u.id !== action.payload?.toString());
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // deactivateAccount
      .addCase(deactivateAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(deactivateAccount.fulfilled, (state, action) => {
        state.loading = false;
        const updated = (action.payload as any)?.data?.data ?? (action.payload as any)?.data;
        if (updated?.id) {
          const index = state.users.findIndex((u) => u.id === updated.id?.toString());
          if (index !== -1) {
            state.users[index] = { 
              ...state.users[index], 
              // Add isActive or similar field if backend returns it
              ...updated
            };
          }
        }
      })
      .addCase(deactivateAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // reactivateAccount
      .addCase(reactivateAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(reactivateAccount.fulfilled, (state, action) => {
        state.loading = false;
        const updated = (action.payload as any)?.data?.data ?? (action.payload as any)?.data;
        if (updated?.id) {
          const index = state.users.findIndex((u) => u.id === updated.id?.toString());
          if (index !== -1) {
            state.users[index] = { 
              ...state.users[index], 
              ...updated
            };
          }
        }
      })
      .addCase(reactivateAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // getAccountStatus
      .addCase(getAccountStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAccountStatus.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(getAccountStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = adminUsersSlice.actions;
export default adminUsersSlice.reducer;
