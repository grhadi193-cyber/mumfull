import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import { FileText, Filter, Trash2, Calendar, AlertTriangle } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AppointmentHistory() {
  const { user } = useAuth();
  const { getAppointmentsByStudent, advisors, deleteAppointment } = useData();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const appointments = useMemo(() => {
    const all = user ? getAppointmentsByStudent(user.id) : [];
    if (statusFilter === 'all') return all;
    return all.filter(a => a.status === statusFilter);
  }, [user, getAppointmentsByStudent, statusFilter]);

  const sorted = useMemo(() =>
    [...appointments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [appointments]
  );

  const handleCancel = () => {
    if (cancelTarget) {
      deleteAppointment(cancelTarget);
      showToast('نوبت لغو شد', 'success');
      setCancelTarget(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' };
    const labels: Record<string, string> = { pending: 'در انتظار', approved: 'تأیید شده', rejected: 'رد شده' };
    return <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${map[status]}`}>{labels[status]}</span>;
  };

  const filters = [
    { label: 'همه', value: 'all' },
    { label: 'در انتظار', value: 'pending' },
    { label: 'تأیید شده', value: 'approved' },
    { label: 'رد شده', value: 'rejected' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item}>
        <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          سوابق نوبت‌ها
        </h2>
        <p className="text-sm text-navy-500 mt-0.5">{appointments.length} نوبت ثبت شده</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-wrap gap-2 bg-white rounded-2xl p-3 shadow-sm border border-navy-100">
        <Filter className="w-4 h-4 text-navy-400 mt-1.5" />
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === f.value ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Appointment List */}
      <div className="space-y-3">
        {sorted.map((apt) => {
          const advisor = advisors.find(a => a.id === apt.advisorId);
          return (
            <motion.div
              key={apt.id}
              variants={item}
              className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                    apt.status === 'approved' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                    apt.status === 'pending' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                    'bg-gradient-to-br from-red-400 to-red-500'
                  }`}>
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-navy-800">{apt.date} • {apt.time}</p>
                    <p className="text-[11px] text-navy-500">
                      مشاور: دکتر {advisor?.firstName} {advisor?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(apt.status)}
                  {apt.status === 'pending' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCancelTarget(apt.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="لغو نوبت"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-navy-100 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-navy-400">نوع مشاوره</p>
                  <p className="text-xs font-bold text-navy-700">{apt.appointmentType.label}</p>
                </div>
                <div>
                  <p className="text-[10px] text-navy-400">توضیحات</p>
                  <p className="text-xs text-navy-600 truncate">{apt.description}</p>
                </div>
              </div>
              {/* Show rejection reason */}
              {apt.status === 'rejected' && apt.rejectionReason && (
                <div className="mt-3 pt-3 border-t border-red-100 bg-red-50/50 -mx-4 -mb-4 px-4 pb-4 rounded-b-2xl">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-red-500 font-bold mb-0.5">دلیل رد درخواست توسط مشاور:</p>
                      <p className="text-xs text-red-700">{apt.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-navy-100">
            <FileText className="w-12 h-12 text-navy-300 mx-auto mb-3" />
            <p className="text-navy-400 text-sm">نوبتی یافت نشد</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="لغو نوبت"
        message="آیا از لغو این نوبت اطمینان دارید؟"
        confirmText="لغو نوبت"
      />
    </motion.div>
  );
}
