import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { Calendar, Check, X, Clock, Filter, AlertTriangle, Edit3 } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AppointmentManagement() {
  const { user } = useAuth();
  const { getAppointmentsByAdvisor, students, updateAppointmentStatus } = useData();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  // Edit modal (for changing rejected back to approved/pending)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editNewStatus, setEditNewStatus] = useState<'pending' | 'approved'>('approved');

  const appointments = useMemo(() => {
    const all = user ? getAppointmentsByAdvisor(user.id) : [];
    if (statusFilter === 'all') return all;
    return all.filter(a => a.status === statusFilter);
  }, [user, getAppointmentsByAdvisor, statusFilter]);

  const sorted = useMemo(() =>
    [...appointments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [appointments]
  );

  const handleApprove = (id: string) => {
    updateAppointmentStatus(id, 'approved');
    showToast('نوبت تأیید شد', 'success');
  };

  const openRejectModal = (id: string) => {
    setRejectTargetId(id);
    setRejectionReason('');
    setReasonError('');
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      setReasonError('لطفاً دلیل رد درخواست را وارد کنید');
      return;
    }
    if (rejectionReason.trim().length < 5) {
      setReasonError('دلیل رد باید حداقل ۵ کاراکتر باشد');
      return;
    }
    if (rejectTargetId) {
      updateAppointmentStatus(rejectTargetId, 'rejected', rejectionReason.trim());
      showToast('نوبت رد شد و دلیل برای دانشجو ارسال شد', 'warning');
      setRejectModalOpen(false);
      setRejectTargetId(null);
      setRejectionReason('');
      setReasonError('');
    }
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setRejectTargetId(null);
    setRejectionReason('');
    setReasonError('');
  };

  // Edit (change rejected status)
  const openEditModal = (id: string) => {
    setEditTargetId(id);
    setEditNewStatus('approved');
    setEditModalOpen(true);
  };

  const handleEditConfirm = () => {
    if (editTargetId) {
      updateAppointmentStatus(editTargetId, editNewStatus);
      showToast(
        editNewStatus === 'approved' ? 'نوبت تأیید شد' : 'نوبت به حالت انتظار بازگردانده شد',
        'success'
      );
      setEditModalOpen(false);
      setEditTargetId(null);
    }
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditTargetId(null);
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

  const rejectTargetAppointment = rejectTargetId ? appointments.find(a => a.id === rejectTargetId) : null;
  const rejectTargetStudent = rejectTargetAppointment ? students.find(s => s.id === rejectTargetAppointment.studentId) : null;

  const editTargetAppointment = editTargetId ? appointments.find(a => a.id === editTargetId) : null;
  const editTargetStudent = editTargetAppointment ? students.find(s => s.id === editTargetAppointment.studentId) : null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item}>
        <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          مدیریت نوبت‌ها
        </h2>
        <p className="text-sm text-navy-500 mt-0.5">{appointments.length} نوبت</p>
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

      {/* Appointment Cards */}
      <div className="space-y-3">
        {sorted.map((apt) => {
          const student = students.find(s => s.id === apt.studentId);
          return (
            <motion.div
              key={apt.id}
              variants={item}
              className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-sm font-bold">
                    {student?.firstName?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-navy-800">{student?.firstName} {student?.lastName}</p>
                    <p className="text-[11px] text-navy-500">{student?.studentNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(apt.status)}
                  {apt.status === 'pending' && (
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleApprove(apt.id)}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="تأیید"
                      >
                        <Check className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => openRejectModal(apt.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="رد"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
                  {/* Edit button for rejected appointments */}
                  {apt.status === 'rejected' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => openEditModal(apt.id)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      title="ویرایش وضعیت"
                    >
                      <Edit3 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-navy-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] text-navy-400">تاریخ</p>
                  <p className="text-xs font-bold text-navy-700">{apt.date}</p>
                </div>
                <div>
                  <p className="text-[10px] text-navy-400">ساعت</p>
                  <p className="text-xs font-bold text-navy-700">{apt.time}</p>
                </div>
                <div>
                  <p className="text-[10px] text-navy-400">نوع</p>
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
                      <p className="text-[10px] text-red-500 font-bold mb-0.5">دلیل رد درخواست:</p>
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
            <Clock className="w-12 h-12 text-navy-300 mx-auto mb-3" />
            <p className="text-navy-400 text-sm">نوبتی یافت نشد</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50"
              onClick={closeRejectModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" dir="rtl" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-l from-red-500 to-red-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <X className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-white">رد درخواست نوبت</h3>
                      {rejectTargetStudent && (
                        <p className="text-red-100 text-xs mt-0.5">
                          دانشجو: {rejectTargetStudent.firstName} {rejectTargetStudent.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      لطفاً دلیل رد درخواست را بنویسید. این پیام به دانشجو نمایش داده خواهد شد.
                    </p>
                  </div>
                  <label className="block text-sm font-bold text-navy-700 mb-2">
                    دلیل رد درخواست <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      if (reasonError) setReasonError('');
                    }}
                    placeholder="مثال: در این زمان نوبت دیگری ثبت شده است..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none ${
                      reasonError
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                        : 'border-navy-200 focus:border-navy-500 bg-navy-50/50'
                    }`}
                    autoFocus
                  />
                  {reasonError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {reasonError}
                    </motion.p>
                  )}
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={handleRejectConfirm}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-l from-red-500 to-red-600 text-white rounded-xl text-sm font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20"
                  >
                    تأیید و ارسال دلیل
                  </button>
                  <button
                    onClick={closeRejectModal}
                    className="flex-1 px-4 py-2.5 bg-navy-100 text-navy-700 rounded-xl text-sm font-bold hover:bg-navy-200 transition-all"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Status Modal (for rejected appointments) */}
      <AnimatePresence>
        {editModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50"
              onClick={closeEditModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" dir="rtl" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-l from-blue-500 to-blue-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Edit3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-white">ویرایش وضعیت نوبت</h3>
                      {editTargetStudent && (
                        <p className="text-blue-100 text-xs mt-0.5">
                          دانشجو: {editTargetStudent.firstName} {editTargetStudent.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <Edit3 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      این نوبت قبلاً رد شده بود. می‌توانید وضعیت آن را تغییر دهید.
                    </p>
                  </div>

                  {editTargetAppointment && (
                    <div className="bg-navy-50 rounded-xl p-3 mb-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-navy-400">تاریخ:</span>
                          <span className="font-bold text-navy-700 mr-1">{editTargetAppointment.date}</span>
                        </div>
                        <div>
                          <span className="text-navy-400">ساعت:</span>
                          <span className="font-bold text-navy-700 mr-1">{editTargetAppointment.time}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-navy-400">نوع:</span>
                          <span className="font-bold text-navy-700 mr-1">{editTargetAppointment.appointmentType.label}</span>
                        </div>
                      </div>
                      {editTargetAppointment.rejectionReason && (
                        <div className="mt-2 pt-2 border-t border-navy-200">
                          <span className="text-[10px] text-red-500 font-bold">دلیل رد قبلی:</span>
                          <p className="text-xs text-red-600 mt-0.5">{editTargetAppointment.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <label className="block text-sm font-bold text-navy-700 mb-3">
                    وضعیت جدید:
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setEditNewStatus('approved')}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        editNewStatus === 'approved'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-navy-100 bg-white hover:border-navy-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        editNewStatus === 'approved' ? 'bg-emerald-500 text-white' : 'bg-navy-100 text-navy-400'
                      }`}>
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${editNewStatus === 'approved' ? 'text-emerald-700' : 'text-navy-700'}`}>
                          تأیید نوبت
                        </p>
                        <p className="text-[10px] text-navy-400">نوبت تأیید و به دانشجو اطلاع داده می‌شود</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditNewStatus('pending')}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        editNewStatus === 'pending'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-navy-100 bg-white hover:border-navy-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        editNewStatus === 'pending' ? 'bg-amber-500 text-white' : 'bg-navy-100 text-navy-400'
                      }`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${editNewStatus === 'pending' ? 'text-amber-700' : 'text-navy-700'}`}>
                          بازگرداندن به حالت انتظار
                        </p>
                        <p className="text-[10px] text-navy-400">نوبت به لیست انتظار بازمی‌گردد</p>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={handleEditConfirm}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-l from-blue-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    ذخیره تغییرات
                  </button>
                  <button
                    onClick={closeEditModal}
                    className="flex-1 px-4 py-2.5 bg-navy-100 text-navy-700 rounded-xl text-sm font-bold hover:bg-navy-200 transition-all"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
