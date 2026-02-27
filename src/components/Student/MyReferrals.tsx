import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { referralTargets } from '@/utils/mockData';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function MyReferrals() {
  const { user } = useAuth();
  const { students } = useData();

  const currentStudent = useMemo(() => students.find(s => s.id === user?.id), [students, user]);

  const allReferrals = useMemo(() => {
    if (!currentStudent) return [];
    return currentStudent.sessions.flatMap(session =>
      session.referrals.map(ref => ({
        ...ref,
        sessionDate: session.date,
        sessionType: session.type,
        sessionNotes: session.notes,
      }))
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [currentStudent]);

  const stats = useMemo(() => ({
    total: allReferrals.length,
    pending: allReferrals.filter(r => r.status === 'pending').length,
    inProgress: allReferrals.filter(r => r.status === 'in_progress').length,
    completed: allReferrals.filter(r => r.status === 'completed').length,
  }), [allReferrals]);

  const getReferralTargetInfo = (target: string) => {
    return referralTargets.find(r => r.value === target) || { label: target, icon: '📋', color: 'from-gray-500 to-gray-600' };
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: typeof CheckCircle; label: string; borderColor: string }> = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'در انتظار بررسی', borderColor: 'border-amber-200' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', icon: AlertCircle, label: 'در حال پیگیری', borderColor: 'border-blue-200' },
      completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: 'انجام شده', borderColor: 'border-emerald-200' },
    };
    return map[status] || map.pending;
  };

  const statCards = [
    { label: 'کل ارجاعات', value: stats.total, color: 'from-purple-500 to-purple-600', icon: ExternalLink },
    { label: 'در انتظار', value: stats.pending, color: 'from-amber-500 to-amber-600', icon: Clock },
    { label: 'در حال پیگیری', value: stats.inProgress, color: 'from-blue-500 to-blue-600', icon: AlertCircle },
    { label: 'تکمیل شده', value: stats.completed, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item}>
        <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
          <ExternalLink className="w-6 h-6" />
          ارجاعات من
        </h2>
        <p className="text-sm text-navy-500 mt-0.5">مشاهده وضعیت ارجاعات ثبت شده توسط مشاور</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card, i) => (
          <motion.div key={i} variants={item} whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-navy-800">{card.value.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-navy-500 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Referrals List */}
      <div className="space-y-3">
        {allReferrals.map((ref, index) => {
          const targetInfo = getReferralTargetInfo(ref.target);
          const statusInfo = getStatusInfo(ref.status);

          return (
            <motion.div
              key={ref.id || index}
              variants={item}
              whileHover={{ y: -1 }}
              className={`bg-white rounded-2xl p-4 shadow-sm border ${statusInfo.borderColor} hover:shadow-md transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${targetInfo.color} flex items-center justify-center text-xl shadow-lg flex-shrink-0`}>
                  {targetInfo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-navy-800 text-sm">ارجاع به {ref.target}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${statusInfo.bg} ${statusInfo.text}`}>
                      <statusInfo.icon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-navy-600 mb-2">{ref.reason}</p>
                  <div className="flex items-center gap-3 text-[10px] text-navy-400">
                    <span>تاریخ ارجاع: {ref.date}</span>
                    <span>•</span>
                    <span>جلسه: {ref.sessionDate}</span>
                    <span>•</span>
                    <span>نوع: {ref.sessionType}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 pt-3 border-t border-navy-100/50">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-navy-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: ref.status === 'completed' ? '100%' : ref.status === 'in_progress' ? '50%' : '15%'
                      }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        ref.status === 'completed' ? 'bg-emerald-500' :
                        ref.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-navy-400 flex-shrink-0">
                    {ref.status === 'completed' ? '۱۰۰٪' : ref.status === 'in_progress' ? '۵۰٪' : '۱۵٪'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {allReferrals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-navy-100">
            <ExternalLink className="w-12 h-12 text-navy-300 mx-auto mb-3" />
            <p className="text-navy-500 font-bold">ارجاعی ثبت نشده</p>
            <p className="text-navy-400 text-xs mt-1">ارجاعات توسط استاد مشاور شما ثبت می‌شود</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
