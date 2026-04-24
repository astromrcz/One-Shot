import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Users, Table2, Tag, BarChart3,
  DollarSign, FileText, Megaphone, CalendarX2, LayoutTemplate,
  Palette, Menu, X, LogOut, ChevronRight,
  ShieldCheck, Bell, Circle, Activity, Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from './context/AppContext';
import logoImg from '@/app/assets/40eb82831843e17a3c48a360fd80f0aaaa58ddc8.png';
import OneSignal from 'react-onesignal';
const navItems = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Dashboard',           exact: true },
  { to: '/admin/customization', icon: LayoutTemplate,  label: 'Site Customization' },
  { to: '/admin/users',         icon: Users,           label: 'User Management' },
  { to: '/admin/tables',        icon: Table2,          label: 'Table Management' },
  { to: '/admin/tattoo-artists',icon: Palette,         label: 'Tattoo Artists' },
  { to: '/admin/promo-codes',   icon: Tag,             label: 'Promo Codes' },
  { to: '/admin/rates',         icon: DollarSign,      label: 'Rates Editor' },
  { to: '/admin/reservation-terms', icon: FileText,    label: 'Reservation Terms' },
  { to: '/admin/announcements', icon: Megaphone,       label: 'Announcements' },
  { to: '/admin/calendar',      icon: CalendarX2,      label: 'Closing Calendar' },
  { to: '/admin/analytics',     icon: BarChart3,       label: 'Analytics' },
  { to: '/admin/activity',      icon: Activity,        label: 'Activity Log' },
  { to: '/admin/settings',      icon: SettingsIcon,    label: 'Account Settings' },
];

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/customization': 'Site Customization',
  '/admin/users': 'User Management',
  '/admin/tables': 'Table Management',
  '/admin/tattoo-artists': 'Tattoo Artists',
  '/admin/promo-codes': 'Promo Codes',
  '/admin/rates': 'Rates Editor',
  '/admin/reservation-terms': 'Reservation Terms',
  '/admin/announcements': 'Announcements',
  '/admin/calendar': 'Closing Calendar',
  '/admin/analytics': 'Analytics',
  '/admin/activity': 'Activity Log',
};

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 👈 Grab the 'loading' state from context
  const { adminLoggedIn, staffLoggedIn, adminLogout, announcements, closedDates, loading } = useAppContext(); 
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // 👈 FIREWALL: Wait for session to load first!

    if (adminLoggedIn) {
      OneSignal.User.addTag("role", "admin");
    }
    
    if (!adminLoggedIn) {
      if (staffLoggedIn) {
        navigate('/staff', { replace: true });
        toast.error("Access Denied", { description: "You do not have administrator privileges." });
      } else {
        navigate('/', { replace: true }); // Redirect to homepage
      }
    }
  }, [adminLoggedIn, staffLoggedIn, loading, navigate]);

  // 👈 Show a quick spinner while the session loads instead of crashing
  if (loading) {
    return (
      <div className="h-screen bg-neutral-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!adminLoggedIn) return null;

  const activeAnnouncements = announcements.filter(a => a.isActive).length;
  const upcomingClosed = closedDates.filter(c => new Date(c.date) >= new Date()).length;
  const pageTitle = pageTitles[location.pathname] || 'Admin';

  const handleLogout = async () => {
    try {
      await adminLogout(); // or staffLogout()
      navigate('/');
      toast.info("Signed out", { 
        description: "Admin session ended successfully.",
        duration: 3000 
      });
    } catch (error) {
      toast.error("Logout failed", { description: "Please try again." });
    }
  };

  return (
    <div className="flex h-screen bg-neutral-900 text-neutral-100 overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-neutral-950 border-r border-amber-900/30 flex flex-col transition-transform duration-300
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-amber-900/30">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="One Shot Bar" className="w-10 h-10 object-contain rounded-xl" />
            <div>
              <p className="text-sm font-bold text-neutral-100 leading-tight">One Shot Bar</p>
              <p className="text-[10px] text-amber-500/70 uppercase tracking-widest font-semibold">Admin Portal</p>
            </div>
          </div>
          <button className="lg:hidden text-neutral-500 hover:text-neutral-200" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        

        {/* System Health Widget */}
        <div className="px-4 pb-3">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-3">
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-2.5 flex items-center gap-1.5">
              <Activity size={11} className="text-emerald-500" />
              System Status
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-neutral-200 font-medium">Operational</span>
              </div>
              <span className="text-[9px] bg-neutral-800/80 text-emerald-400/80 border border-emerald-900/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
                DB CONNECTED
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-semibold px-3 py-2">Admin Navigation</p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm group ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
                    : 'text-neutral-400 hover:bg-neutral-800/70 hover:text-neutral-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={16} className={isActive ? 'text-amber-400' : ''} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={13} className="text-amber-500/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Staff Portal link */}
        <div className="px-4 pb-2">
          <button
            onClick={() => navigate('/staff')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 transition-all text-xs font-semibold"
          >
            <ShieldCheck size={13} />
            <span className="flex-1 text-left">Staff Portal</span>
            {/* Changed the arrow to point right instead of up-right since it's no longer opening a new tab */}
            <span className="text-[9px] text-neutral-600 font-black">→</span> 
          </button>
        </div>

        {/* Bottom */}
        <div className="p-4 border-t border-amber-900/20">
          <div className="flex items-center gap-2 text-neutral-600">
            <Circle size={8} className="fill-amber-500 text-amber-500" />
            <span className="text-xs">Admin · One Shot Bar & Billiards</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 flex-none bg-neutral-950/80 border-b border-amber-900/20 flex items-center justify-between px-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-neutral-400 hover:text-neutral-200 p-1" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-amber-500" />
              <h1 className="text-base font-semibold text-neutral-200">{pageTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
              <ShieldCheck size={13} className="text-amber-400" />
              <span className="text-xs text-amber-400 font-semibold">Admin Mode</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-neutral-400 hover:text-rose-400 bg-neutral-800 hover:bg-rose-950/20 border border-neutral-700 hover:border-rose-800/40 px-3 py-1.5 rounded-full transition-all font-medium"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-neutral-900">
          <div className="p-6 max-w-screen-xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
