// Base API for internal/authenticated endpoints
export { baseApi, baseApiMiddleware, baseApiReducer, axiosInstance } from './base-api';

// Factory for creating external API instances
export {
    createExternalApi,
    type ExternalApiOptions,
    type ExternalApiResult
} from './create-external-api';

// Seller API
export { sellerAPI } from './seller-api';
export type { SellerProfile, SellerProduct, SellerOrder, SellerStats } from './seller-api';

// Delivery API
export { deliveryJobAPI } from './delivery-api';
export type { DeliveryJob, CreateDeliveryJobPayload } from './delivery-api';

// Admin API
export {
    adminUserAPI,
    adminProductAPI,
    adminCategoryAPI,
    adminAnalyticsAPI,
    adminSellerAPI,
    adminSellerApprovalAPI,
    adminDeliveryApprovalAPI,
    adminSettingsAPI,
} from './admin-api';

// API Base URL
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';
