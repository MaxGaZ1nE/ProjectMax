import { ProductDetail } from '@/features/productDetail';
import { Profile } from '@/features/profile';
import { AuthGuard, GuestGuard } from '@guards/index';
import { AuthLayout, DashboardLayout, MainLayout } from '@layouts/index';
import { AboutPage } from '@pages/about';
import { LoginPage } from '@pages/auth';
import { BlankPage } from '@pages/blank';
import { DashboardPage } from '@pages/dashboard';
import { Error401Page, Error404Page, Error500Page } from '@pages/errors';
import { HomePage } from '@pages/home';
import { createBrowserRouter } from 'react-router-dom';

// Router Configuration
export const router = createBrowserRouter([
  // Public Routes (accessible by all)
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
  {
    path: '/details/:id',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <ProductDetail />,
      },
    ],
  },
  {
    path: '/profile',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Profile />,
      },
    ],
  },

  // Auth Routes (Guest Only - redirect to dashboard if logged in)
  {
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: 'auth/login', element: <LoginPage /> }],
      },
    ],
  },

  // Protected Routes (Auth Required)
  // {
  //   element: <AuthGuard />,
  //   children: [
  //     {
  //       element: <DashboardLayout />,
  //       children: [
  //         { path: 'about', element: <AboutPage /> },
  //         { path: 'dashboard', element: <DashboardPage /> },
  //         { path: 'blank', element: <BlankPage /> },
  //       ],
  //     },
  //   ],
  // },

  // Error Pages
  { path: '401', element: <Error401Page /> },
  { path: '500', element: <Error500Page /> },
  { path: '*', element: <Error404Page /> },
]);
