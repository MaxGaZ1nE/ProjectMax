import { createBrowserRouter } from 'react-router-dom';

import ProductDetail from '@/features/productDetail/product-detail';
import { Profile } from '@/features/profile';

import { AuthGuard, GuestGuard, DeliveryGuard } from '@guards/index';
import SellerGuard from '@/guards/SellerGuard';
import { AdminGuard } from '@/guards/admin-guard';

import { AuthLayout, MainLayout } from '@layouts/index';

import { LoginPage, RegisterPage } from '@pages/auth';
import ForgotPasswordPage from '@pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@pages/auth/ResetPasswordPage';
import OTPVerificationPage from '@/features/auth/OTPVerificationPage';
import { Error401Page, Error404Page, Error500Page } from '@pages/errors';
import { HomePage } from '@pages/home';
import CartPage from '@pages/cart/CartPage';

import CheckoutPage from '@pages/checkout/CheckoutPage';
import PromptPayPaymentPage from '@pages/checkout/PromptPayPaymentPage';
import OrderDetailPage from '@pages/orders/OrderDetailPage';
import OrderSuccessPage from '@pages/orders/OrderSuccessPage';

import SearchPage from '@pages/search/SearchPage';
import FollowedShopsPage from '@pages/followedShops/FollowedShopsPage';

// Admin
import AdminOrdersPage from '@pages/admin/AdminOrdersPage';
import AdminLoginPage from '@pages/admin/AdminLoginPage';
import AdminDashboardPage from '@pages/admin/AdminDashboardPage';
import AdminUsersPage from '@pages/admin/AdminUsersPage';
import AdminUserDetailsPage from '@pages/admin/AdminUserDetailsPage';
import AdminProductsPage from '@pages/admin/AdminProductsPage';
import AdminOrdersAnalyticsPage from '@pages/admin/AdminOrdersAnalyticsPage';
import AdminSellerManagementPage from '@pages/admin/AdminSellerManagementPage';
import AdminDeliveryApprovalsPage from '@pages/admin/AdminDeliveryApprovalsPage';
import AdminCourierPage from '@pages/admin/AdminCourierPage';
import AdminDirectoryPage from '@pages/admin/AdminDirectoryPage';
import AdminLayout from '@pages/admin/AdminLayout';

// Seller
import SellerRegisterPage from '@/pages/seller/SellerRegisterPage';
import SellerRegistrationPendingApproval from '@components/seller-registration/SellerRegistrationPendingApproval';
import SellerLayout from '@/pages/seller/SellerLayout';
import SellerHomePage from '@/pages/seller/pages/SellerHomePage';
import SellerProductsPage from '@/pages/seller/SellerProductsPage';
import SellerOrdersPendingPage from '@/pages/seller/pages/SellerOrdersPendingPage';
import SellerOrdersToShipPage from '@/pages/seller/pages/SellerOrdersToShipPage';
import SellerSalesPage from '@/pages/seller/SellerSalesPage';
import SellerShopSettingsPage from '@/pages/seller/SellerShopSettingsPage';
import SellerMessagesPage from '@/pages/seller/SellerMessagesPage';
import SellerRegisterGuard from '@/guards/SellerRegisterGuard';
import SellerEditProfilePage from '@/pages/seller/SellerEditProfilePage';
// Delivery
import DeliverySignupPage from '@/pages/delivery/DeliverySignupPage';
import CourierLoginPage from '@/pages/delivery/CourierLoginPage';
import CourierDashboardPage from '@/pages/delivery/CourierDashboardPage';
import CourierEditProfilePageDelivery from '@/pages/delivery/CourierEditProfilePage';
import CourierEditProfilePage from '@/pages/delivery/CourierEditProfilePage';
import CourierChangePasswordPage from '@/pages/delivery/CourierChangePasswordPage';
import CourierBankPage from '@/pages/delivery/CourierBankPage';
import CourierNotificationsPage from '@/pages/delivery/CourierNotificationsPage';

import ShopPage from '@pages/shop/ShopPage';
import OrdersPage from '@pages/orders/OrdersPage';
import SellerOrdersPage from '@/pages/seller/pages/SellerOrdersPage';

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <MainLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    path: '/search',
    element: <MainLayout />,
    children: [{ index: true, element: <SearchPage /> }],
  },
  {
    path: '/cart',
    element: <MainLayout />,
    children: [{ index: true, element: <CartPage /> }],
  },
  {
    path: '/details/:id',
    element: <MainLayout />,
    children: [{ index: true, element: <ProductDetail /> }],
  },
  {
    path: '/shop/:shopId',
    element: <MainLayout />,
    children: [{ index: true, element: <ShopPage /> }],
  },
  {
    path: '/profile',
    element: <MainLayout />,
    children: [{ index: true, element: <Profile /> }],
  },

  // Admin Login (Public Route)
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },

  // Delivery Login & Register (Public Routes)
  {
    path: '/delivery/login',
    element: <CourierLoginPage />,
  },
  {
    path: '/delivery/register',
    element: <MainLayout />,
    children: [{ index: true, element: <DeliverySignupPage /> }],
  },

  // Protected Routes (Auth Required)
  {
    element: <AuthGuard />,
    children: [
      {
        path: '/checkout',
        element: <MainLayout />,
        children: [{ index: true, element: <CheckoutPage /> }],
      },
      {
        path: '/checkout/promptpay',
        element: <MainLayout />,
        children: [{ index: true, element: <PromptPayPaymentPage /> }],
      },
      {
        path: '/orders/success',
        element: <MainLayout />,
        children: [{ index: true, element: <OrderSuccessPage /> }],
      },
      {
        path: '/orders/:id',
        element: <MainLayout />,
        children: [{ index: true, element: <OrderDetailPage /> }],
      },
      {
        path: '/orders',
        element: <MainLayout />,
        children: [{ index: true, element: <OrdersPage /> }],
      },
      {
        path: '/followed-shops',
        element: <MainLayout />,
        children: [{ index: true, element: <FollowedShopsPage /> }],
      },

      // Admin: ตรวจสลิป
      {
        path: '/admin/orders',
        element: <MainLayout />,
        children: [{ index: true, element: <AdminOrdersPage /> }],
      },

      // Seller: register
      {
  path: '/seller/register',
  element: <MainLayout />,
  children: [{ 
    index: true, 
    element: (
      <SellerRegisterGuard>
        <SellerRegisterPage />
      </SellerRegisterGuard>
    ),
  }],
},
      // Seller: pending approval
      {
        path: '/seller/register/pending-approval',
        element: <MainLayout />,
        children: [{ index: true, element: <SellerRegistrationPendingApproval /> }],
      },



      // Delivery: dashboard
      {
        path: '/delivery/dashboard',
        element: <DeliveryGuard><CourierDashboardPage /></DeliveryGuard>,
      },

      // Delivery: Edit Profile (Old - kept for backward compatibility)
      {
        path: '/delivery/profile/edit',
        element: <DeliveryGuard><CourierEditProfilePage /></DeliveryGuard>,
      },

      // Courier: Edit Profile (New main route)
      {
        path: '/courier/profile/edit',
        element: <AuthGuard><CourierEditProfilePage /></AuthGuard>,
      },

      // Delivery: Change Password
      {
        path: '/delivery/profile/change-password',
        element: <DeliveryGuard><CourierChangePasswordPage /></DeliveryGuard>,
      },

      // Delivery: Bank Account
      {
        path: '/delivery/profile/bank',
        element: <DeliveryGuard><CourierBankPage /></DeliveryGuard>,
      },

      // Delivery: Notifications
      {
        path: '/delivery/profile/notifications',
        element: <DeliveryGuard><CourierNotificationsPage /></DeliveryGuard>,
      },

      // Seller Center
      {
        path: '/seller',
        element: (
          <SellerGuard>
            <SellerLayout />
          </SellerGuard>
        ),
        children: [
          { index: true, element: <SellerHomePage /> },
          { path: 'products', element: <SellerProductsPage /> },
          { path: 'orders', element: <SellerOrdersPage /> },
          { path: 'orders/pending', element: <SellerOrdersPendingPage /> },
          { path: 'orders/to-ship', element: <SellerOrdersToShipPage /> },
          { path: 'sales', element: <SellerSalesPage /> },
          { path: 'settings', element: <SellerShopSettingsPage /> },
          { path: 'messages', element: <SellerMessagesPage /> },
          { path: 'profile/edit', element: <SellerEditProfilePage /> },
        ],
      },
    ],
  },

  // Auth Routes (Guest Only)
  {
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'auth/login', element: <LoginPage /> },
          { path: 'auth/register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },

  // Protected Routes (Auth Required)
  {
    element: <AuthGuard />,
    children: [
      {
        path: '/verify-otp',
        element: <MainLayout />,
        children: [{ index: true, element: <OTPVerificationPage /> }],
      },
    ],
  },

  // Admin Routes
  {
    path: '/admin/dashboard',
    element: (
      <AdminGuard>
        <AdminLayout>
          <AdminDashboardPage />
        </AdminLayout>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <AdminGuard>
        <AdminLayout>
          <AdminUsersPage />
        </AdminLayout>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/users/:id',
    element: (
      <AdminGuard>
        <AdminLayout>
          <AdminUserDetailsPage />
        </AdminLayout>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/products',
    element: (
      <AdminGuard>
        <AdminLayout>
          <AdminProductsPage />
        </AdminLayout>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/analytics',
    element: (
      <AdminGuard>
        <AdminLayout>
          <AdminOrdersAnalyticsPage />
        </AdminLayout>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/orders',
    element: (
      <AdminGuard>
        <AdminLayout>
          <AdminOrdersPage />
        </AdminLayout>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/sellers/pending',
    element: (
      <AdminGuard>
        <AdminLayout>
          <AdminSellerManagementPage />
        </AdminLayout>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/delivery/pending',
    element: (
      <AdminGuard>
        <AdminLayout>
          <AdminDeliveryApprovalsPage />
        </AdminLayout>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/couriers',
    element: (
      <AdminGuard>
        <AdminLayout>
          <AdminCourierPage />
        </AdminLayout>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/directory',
    element: (
      <AdminGuard>
        <AdminLayout>
          <AdminDirectoryPage />
        </AdminLayout>
      </AdminGuard>
    ),
  },

  // Error Pages
  { path: '401', element: <Error401Page /> },
  { path: '500', element: <Error500Page /> },
  { path: '*', element: <Error404Page /> },
]);
