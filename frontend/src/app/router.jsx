import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './RootLayout';
import RouteError from './RouteError';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { GuestOnly, RequireAuth } from '@/features/auth/guards';

import HomePage from '@/pages/Home/HomePage';
import SearchPage from '@/pages/Search/SearchPage';
import TitleDetailPage from '@/pages/TitleDetail/TitleDetailPage';
import SeatSelectionPage from '@/pages/SeatSelection/SeatSelectionPage';
import CheckoutPage from '@/pages/Checkout/CheckoutPage';
import BookingPage from '@/pages/Booking/BookingPage';
import MyBookingsPage from '@/pages/Booking/MyBookingsPage';
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import VerifyOtpPage from '@/pages/Auth/VerifyOtpPage';
import ForgotPasswordPage from '@/pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/Auth/ResetPasswordPage';
import HelpPage from '@/pages/Static/HelpPage';
import LegalPage from '@/pages/Static/LegalPage';
import NotFoundPage from '@/pages/Static/NotFoundPage';

// Partner/admin dashboard is code-split: patrons never download it.
const VenuesPage = lazy(() => import('@/pages/admin/VenuesPage'));
const VenueDetailPage = lazy(() => import('@/pages/admin/VenueDetailPage'));
const CatalogPage = lazy(() => import('@/pages/admin/CatalogPage'));
const TitleFormPage = lazy(() => import('@/pages/admin/TitleFormPage'));
const ShowsPage = lazy(() => import('@/pages/admin/ShowsPage'));
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'));
const PartnersPage = lazy(() => import('@/pages/admin/PartnersPage'));
const DisputesPage = lazy(() => import('@/pages/admin/DisputesPage'));
const AuditLogPage = lazy(() => import('@/pages/admin/AuditLogPage'));

export const routes = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <MainLayout />,
        children: [
          // Public — guests can browse and search (REQ-2.3)
          { path: '/', element: <HomePage /> },
          { path: '/search', element: <SearchPage /> },
          { path: '/movies/:id', element: <TitleDetailPage kind="movie" /> },
          { path: '/events/:id', element: <TitleDetailPage kind="event" /> },
          { path: '/shows/:showId/seats', element: <SeatSelectionPage /> },
          { path: '/help', element: <HelpPage /> },
          { path: '/terms', element: <LegalPage doc="terms" /> },
          { path: '/refund-policy', element: <LegalPage doc="refund-policy" /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
          { path: '/verify-otp', element: <VerifyOtpPage /> },

          // Signed-out only
          {
            element: <GuestOnly />,
            children: [
              { path: '/login', element: <LoginPage /> },
              { path: '/register', element: <RegisterPage /> },
              { path: '/forgot-password', element: <ForgotPasswordPage /> },
            ],
          },

          // Patrons (BR-2: checkout requires authentication)
          {
            element: <RequireAuth roles={['patron']} />,
            children: [
              { path: '/checkout/:bookingId', element: <CheckoutPage /> },
              { path: '/bookings/:bookingId', element: <BookingPage /> },
              { path: '/my-bookings', element: <MyBookingsPage /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },

      // Partner / admin dashboard (BR-4 is enforced by the API; the UI gates by role)
      {
        element: <RequireAuth roles={['partner', 'admin']} />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <VenuesPage /> },
              { path: 'venues/:venueId', element: <VenueDetailPage /> },
              { path: 'catalog', element: <CatalogPage /> },
              { path: 'catalog/new', element: <TitleFormPage /> },
              { path: 'catalog/:id/edit', element: <TitleFormPage /> },
              { path: 'shows', element: <ShowsPage /> },
              { path: 'analytics', element: <AnalyticsPage /> },
              {
                element: <RequireAuth roles={['admin']} />,
                children: [
                  { path: 'partners', element: <PartnersPage /> },
                  { path: 'disputes', element: <DisputesPage /> },
                  { path: 'audit-log', element: <AuditLogPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
