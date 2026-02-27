import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, UserCog, BarChart3, Calendar,
  Clock, LogOut, Menu, X, ChevronLeft, Download,
  GraduationCap, MessageSquare, Star, Handshake, LifeBuoy, HeadphonesIcon,
  ClipboardList
} from 'lucide-react';

interface LayoutProps { children: ReactNode; }
interface NavItem { label: string; path: string; icon: React.ElementType; }

const adminNav: NavItem[] = [
  { label: 'داشبورد', path: '/admin', icon: LayoutDashboard },
  { label: 'مدیریت دانشجویان', path: '/admin/students', icon: Users },
  { label: 'مدیریت مشاوران', path: '/admin/advisors', icon: UserCog },
  { label: 'پیام‌های پشتیبانی', path: '/admin/support-messages', icon: HeadphonesIcon },
  { label: 'دانلود قالب', path: '/admin/download-templates', icon: Download },
  { label: 'پیام‌ها', path: '/admin/messages', icon: MessageSquare },
];

const advisorNav: NavItem[] = [
  { label: 'داشبورد', path: '/advisor', icon: LayoutDashboard },
  { label: 'ساعات حضور', path: '/advisor/availability', icon: Clock },
  { label: 'نوبت‌ها', path: '/advisor/appointments', icon: Calendar },
  { label: 'گزارش عملکرد', path: '/advisor/performance', icon: BarChart3 },
  { label: 'پیام‌ها', path: '/advisor/messages', icon: MessageSquare },
];

const studentNav: NavItem[] = [
  { label: 'داشبورد', path: '/student', icon: LayoutDashboard },
  { label: 'نوبت‌گیری', path: '/student/request', icon: Calendar },
  { label: 'ارزشیابی استاد', path: '/student/evaluation', icon: Star },
  { label: 'ثبت جلسه اشتراکی', path: '/student/shared-session', icon: Handshake },
  { label: 'پشتیبانی', path: '/student/support', icon: LifeBuoy },
  { label: 'پیام‌ها', path: '/student/messages', icon: MessageSquare },
];

const specialRoleNav: NavItem[] = [
  { label: 'داشبورد ارجاعات', path: '/special', icon: ClipboardList },
];

const roleLabels: Record<string, string> = {
  admin: 'مدیر سیستم',
  advisor: 'مشاور',
  student: 'دانشجو',
  counseling_center: 'مرکز مشاوره',
  education_admin: 'مسئول آموزش',
  advisor_supervisor: 'مسئول اساتید مشاور',
  department_head: 'مدیر گروه',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  advisor: 'bg-blue-100 text-blue-700',
  student: 'bg-emerald-100 text-emerald-700',
  counseling_center: 'bg-purple-100 text-purple-700',
  education_admin: 'bg-emerald-100 text-emerald-700',
  advisor_supervisor: 'bg-blue-100 text-blue-700',
  department_head: 'bg-amber-100 text-amber-700',
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const role = (user as any).role || '';
  const isSpecialRole = ['counseling_center', 'education_admin', 'advisor_supervisor', 'department_head'].includes(role);

  const navItems = role === 'admin' ? adminNav :
    role === 'advisor' ? advisorNav :
    role === 'student' ? studentNav :
    isSpecialRole ? specialRoleNav : [];

  const roleLabel = roleLabels[role] || role;
  const roleColor = roleColors[role] || 'bg-gray-100 text-gray-700';

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentNav = navItems.find(n => n.path === location.pathname);
  const pageTitle = currentNav?.label || 'داشبورد';

  return (
    <div className="flex min-h-screen bg-navy-50" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-l border-navy-100 fixed h-full z-30">
        <div className="p-5 border-b border-navy-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-navy-700 to-navy-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-navy-800 truncate">علوم پزشکی مشهد</h1>
              <p className="text-[10px] text-navy-400">سامانه مشاوران تحصیلی</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(navItem => (
            <NavLink key={navItem.path} to={navItem.path}
              end={navItem.path === '/admin' || navItem.path === '/advisor' || navItem.path === '/student' || navItem.path === '/special'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-navy-800 text-white shadow-lg shadow-navy-900/20' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-800'
                }`
              }>
              <navItem.icon className="w-5 h-5 flex-shrink-0" />
              <span>{navItem.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-navy-100">
          <div className="p-3 rounded-xl bg-navy-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-xs font-bold">
                {(user as any).firstName?.[0] || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy-800 truncate">{(user as any).firstName} {(user as any).lastName}</p>
                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium ${roleColor}`}>{roleLabel}</span>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-navy-200 text-navy-600 text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
              <LogOut className="w-3.5 h-3.5" /> خروج از سامانه
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-40"
              onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed right-0 top-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col">
              <div className="p-4 border-b border-navy-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-navy-700 to-navy-900 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-navy-800">علوم پزشکی مشهد</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-navy-100">
                  <X className="w-5 h-5 text-navy-500" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1">
                {navItems.map(navItem => (
                  <NavLink key={navItem.path} to={navItem.path}
                    end={navItem.path === '/admin' || navItem.path === '/advisor' || navItem.path === '/student' || navItem.path === '/special'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50'
                      }`
                    }>
                    <navItem.icon className="w-5 h-5" />
                    <span>{navItem.label}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="p-3 border-t border-navy-100">
                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-all">
                  <LogOut className="w-4 h-4" /> خروج
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:mr-64">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-navy-100">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-navy-100 transition-colors">
                <Menu className="w-5 h-5 text-navy-600" />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-navy-400 hidden sm:inline">صفحه اصلی</span>
                <ChevronLeft className="w-3.5 h-3.5 text-navy-300 hidden sm:inline" />
                <span className="font-bold text-navy-800">{pageTitle}</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 pr-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-xs font-bold">
                {(user as any).firstName?.[0] || '?'}
              </div>
              <div>
                <p className="text-xs font-bold text-navy-700">{(user as any).firstName} {(user as any).lastName}</p>
                <p className="text-[10px] text-navy-400">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>

        <footer className="border-t border-navy-100 py-4 px-6 text-center">
          <p className="text-xs text-navy-400">© ۱۴۰۴ دانشگاه علوم پزشکی مشهد - سامانه مدیریت مشاوران تحصیلی | تمامی حقوق محفوظ است</p>
        </footer>
      </div>
    </div>
  );
}
