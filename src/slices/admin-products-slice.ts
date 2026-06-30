import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminProductAPI, adminCategoryAPI } from '@services/api/admin-api';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  seller_id: string;
  status?: string;
  createdAt: string;
}

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 20,
};

// Async Thunks
export const fetchProducts = createAsyncThunk(
  'admin/fetchProducts',
  async ({ page = 1, limit = 20, search = '', sellerId = '' }: any, { rejectWithValue }) => {
    try {
      const response = await adminProductAPI.getProducts(page, limit, search, sellerId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const approveProduct = createAsyncThunk(
  'admin/approveProduct',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await adminProductAPI.approveProduct(productId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve product');
    }
  }
);

export const rejectProduct = createAsyncThunk(
  'admin/rejectProduct',
  async ({ productId, reason }: { productId: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await adminProductAPI.rejectProduct(productId, reason);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async ({ productId, reason }: { productId: string; reason?: string }, { rejectWithValue }) => {
    try {
      await adminProductAPI.deleteProduct(productId, reason);
      return productId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

export const featuredProduct = createAsyncThunk(
  'admin/featuredProduct',
  async ({ productId, featured }: { productId: string; featured: boolean }, { rejectWithValue }) => {
    try {
      const response = await adminProductAPI.featuredProduct(productId, featured);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update featured status');
    }
  }
);

const adminProductsSlice = createSlice({
  name: 'adminProducts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 20;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // approveProduct
      .addCase(approveProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = { ...state.products[index], status: 'approved' };
        }
      })
      .addCase(approveProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // deleteProduct
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError: clearProductError } = adminProductsSlice.actions;
export default adminProductsSlice.reducer;
