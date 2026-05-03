import { createBrowserRouter } from 'react-router';
import { RootWrapper } from './RootWrapper';
import { Layout } from './layout';
import { AdminLayout } from './adminLayout';
import { ArtistLayout } from './artistLayout';
import { HomePage } from './pages/HomePage';
import { LiveMonitor } from './pages/LiveMonitor';
// Staff pages
import { OverviewDashboard } from './pages/OverviewDashboard';
import { Tables } from './pages/Tables';
import { ReservationsPage } from './pages/Reservations'; // 🚨 Updated import
import { Queue } from './pages/Queue';
import { ActivityLog } from './pages/ActivityLog';
import { FeedbackPage } from './pages/Feedback';
import { PromoCodesPage } from './pages/PromoCodes';
import { SettingsPage } from './pages/Settings';
import { HistoryPage } from './pages/History'; 
// Admin pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { AdminTableManagement } from './pages/AdminTableManagement';
import { AdminTattooArtists } from './pages/AdminTattooArtists';
import { AdminPromoCodes } from './pages/AdminPromoCodes';
import { AdminRates } from './pages/AdminRates';
import { AdminReservationTerms } from './pages/AdminReservationTerms';
import { AdminAnnouncements } from './pages/AdminAnnouncements';
import { AdminCalendar } from './pages/AdminCalendar';
import { Analytics } from './pages/Analytics';
import { ReportsPage } from './pages/Reports'; 
import { SiteCustomization } from './pages/SiteCustomization';
// Artist portal
import { ArtistPortal } from './pages/ArtistPortal';
import { NotFound } from './pages/NotFound';
import { ResetPassword } from './pages/ResetPassword';

export const router = createBrowserRouter([
  {
    Component: RootWrapper,
    children: [
      { path: '/',             Component: HomePage },
      { path: '/monitor',      Component: LiveMonitor },
      // ── Staff Portal ──────────────────────────────────────
      {
        path: '/staff',
        Component: Layout,
        children: [
          { index: true,                  Component: OverviewDashboard },
          { path: 'tables',               Component: Tables },
          { path: 'reservations',         Component: ReservationsPage }, // 🚨 Updated component
          { path: 'queue',                Component: Queue },
          { path: 'feedback',             Component: FeedbackPage },
          { path: 'promo-codes',          Component: PromoCodesPage },
          { path: 'history',              Component: HistoryPage }, 
          { path: 'settings',             Component: SettingsPage },
        ],
      },
      // ── Admin Portal ──────────────────────────────────────
      {
        path: '/admin',
        Component: AdminLayout,
        children: [
          { index: true,                    Component: AdminDashboard },
          { path: 'customization',          Component: SiteCustomization },
          { path: 'activity',               Component: ActivityLog },
          { path: 'users',                  Component: AdminUsers },
          { path: 'tables',                 Component: AdminTableManagement },
          { path: 'tattoo-artists',         Component: AdminTattooArtists },
          { path: 'promo-codes',            Component: AdminPromoCodes },
          { path: 'rates',                  Component: AdminRates },
          { path: 'reservation-terms',      Component: AdminReservationTerms },
          { path: 'announcements',          Component: AdminAnnouncements },
          { path: 'calendar',               Component: AdminCalendar },
          { path: 'analytics',              Component: Analytics },
          { path: 'reports',                Component: ReportsPage }, 
          { path: 'settings',               Component: SettingsPage },
          { path: 'reservations',           Component: ReservationsPage }, // 🚨 Used single Reservations page for admin too
        ],
      },
      // ── Artist Portal ─────────────────────────────────────
      {
        path: '/artist',
        Component: ArtistLayout,
        children: [
          { index: true, Component: ArtistPortal },
        ],
      },
      // 🚨 Reset Password Page ───────────────────────────────
      { path: '/reset-password', Component: ResetPassword },
      { path: '*', Component: NotFound },
    ],
  },
]);