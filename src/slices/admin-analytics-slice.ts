import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAnalyticsAPI } from '@services/api/admin-api';

interface AnalyticsState {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    totalProducts: number;
  } | null;
  orders: any[];
  topProducts: any[];
  topSellers: any[];
  timeline: any[];
  revenue: any[];
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  summary: null,
  orders: [],
  topProducts: [],
  topSellers: [],
  timeline: [],
  revenue: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchDashboardSummary = createAsyncThunk(
  'admin/fetchDashboardSummary',
  async (dateRange?: { startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const response = await adminAnalyticsAPI.getDashboardSummary(dateRange);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
    }
  }
);

export const fetchOrders = createAsyncThunk(
  'admin/fetchOrders',
  async ({ page = 1, limit = 20, filters = {} }: any, { rejectWithValue }) => {
    try {
      const response = await adminAnalyticsAPI.getOrders(page, limit, filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchRevenue = createAsyncThunk(
  'admin/fetchRevenue',
  async (dateRange?: { startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const response = await adminAnalyticsAPI.getRevenue(dateRange);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch revenue');
    }
  }
);

export const fetchTopProducts = createAsyncThunk(
  'admin/fetchTopProducts',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await adminAnalyticsAPI.getTopProducts(limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch top products');
    }
  }
);

export const fetchTopSellers = createAsyncThunk(
  'admin/fetchTopSellers',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await adminAnalyticsAPI.getTopSellers(limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch top sellers');
    }
  }
);

export const fetchTimeline = createAsyncThunk(
  'admin/fetchTimeline',
  async ({ period = 'daily', limit = 30 }: { period: 'daily' | 'weekly' | 'monthly'; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await adminAnalyticsAPI.getAnalyticsTimeline(period, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch timeline');
    }
  }
);

const adminAnalyticsSlice = createSlice({
  name: 'adminAnalytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDashboardSummary
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchOrders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data || [];
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchRevenue
      .addCase(fetchRevenue.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRevenue.fulfilled, (state, action) => {
        state.loading = false;
        state.revenue = action.payload.data || [];
      })
      .addCase(fetchRevenue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchTopProducts
      .addCase(fetchTopProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.topProducts = action.payload.data || [];
      })
      .addCase(fetchTopProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchTopSellers
      .addCase(fetchTopSellers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTopSellers.fulfilled, (state, action) => {
        state.loading = false;
        state.topSellers = action.payload.data || [];
      })
      .addCase(fetchTopSellers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchTimeline
      .addCase(fetchTimeline.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTimeline.fulfilled, (state, action) => {
        state.loading = false;
        state.timeline = action.payload.data || [];
      })
      .addCase(fetchTimeline.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = adminAnalyticsSlice.actions;
export default adminAnalyticsSlice.reducer;
