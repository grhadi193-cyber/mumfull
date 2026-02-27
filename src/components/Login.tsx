import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Eye, EyeOff, LogIn, GraduationCap, Shield, UserCheck, BookOpen, Brain, Users, Building2 } from 'lucide-react';

const quickLogins = [
  { label: 'مدیر سیستم', username: 'admin', password: 'admin123', icon: Shield, color: 'from-purple-600 to-purple-700', textColor: 'text-purple-700', bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { label: 'استاد مشاور', username: 'advisor1', password: '123456', icon: UserCheck, color: 'from-blue-600 to-blue-700', textColor: 'text-blue-700', bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { label: 'دانشجو', username: 'student1', password: '123456', icon: GraduationCap, color: 'from-emerald-600 to-emerald-700', textColor: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { label: 'مرکز مشاوره', username: 'counseling', password: '123456', icon: Brain, color: 'from-pink-600 to-pink-700', textColor: 'text-pink-700', bg: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { label: 'مسئول آموزش', username: 'education', password: '123456', icon: BookOpen, color: 'from-teal-600 to-teal-700', textColor: 'text-teal-700', bg: 'bg-teal-50 border-teal-200 hover:bg-teal-100' },
  { label: 'مسئول اساتید مشاور', username: 'supervisor', password: '123456', icon: Users, color: 'from-indigo-600 to-indigo-700', textColor: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' },
  { label: 'مدیر گروه', username: 'depthead', password: '123456', icon: Building2, color: 'from-amber-600 to-amber-700', textColor: 'text-amber-700', bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
];

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { showToast('لطفاً نام کاربری و رمز عبور را وارد کنید', 'warning'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const result = login(username, password);
    setLoading(false);
    if (result.success) {
      showToast('ورود موفقیت‌آمیز بود', 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const result = login(u, p);
    setLoading(false);
    if (result.success) {
      showToast('ورود موفقیت‌آمیز بود', 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-800 via-navy-900 to-navy-900 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-navy-700/20 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg mx-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
          {/* Logo */}
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }} className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-navy-700 to-navy-900 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-navy-800 mb-1">دانشگاه علوم پزشکی مشهد</h1>
            <p className="text-navy-500 text-sm">سامانه مدیریت مشاوران تحصیلی</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">نام کاربری</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 text-navy-800 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all text-sm"
                placeholder="نام کاربری خود را وارد کنید" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">رمز عبور</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 text-navy-800 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all text-sm pl-10"
                  placeholder="رمز عبور خود را وارد کنید" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} disabled={loading} type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white font-bold text-sm hover:from-navy-800 hover:to-navy-900 transition-all shadow-lg shadow-navy-900/20 flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn className="w-4 h-4" /> ورود به سامانه</>
              )}
            </motion.button>
          </form>

          {/* Quick Login Buttons */}
          <div className="border-t border-navy-100 pt-5">
            <p className="text-xs text-navy-400 text-center mb-3">🔑 ورود آزمایشی:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickLogins.map((ql, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickLogin(ql.username, ql.password)}
                  disabled={loading}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-50 ${ql.bg} ${ql.textColor}`}
                >
                  <ql.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{ql.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center text-navy-400 text-xs mt-4">© ۱۴۰۴ - تمامی حقوق محفوظ است</p>
      </motion.div>
    </div>
  );
}
