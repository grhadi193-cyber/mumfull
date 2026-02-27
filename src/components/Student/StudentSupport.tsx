import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { LifeBuoy, Clock, AlertTriangle, Send, CheckCircle, MessageSquare } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

interface SupportTicket {
  id: string;
  type: 'delayed_appointment' | 'registration_issue';
  appointmentId?: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

export default function StudentSupport() {
  const { user } = useAuth();
  const { appointments } = useData();
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<string>('');
  const [description, setDescription] = useState('');

  // Load tickets from localStorage
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem(`support_tickets_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Pending appointments (more than 24 hours)
  const pendingAppointments = useMemo(() =>
    appointments.filter(a => a.studentId === user?.id && a.status === 'pending'),
    [appointments, user]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) {
      showToast('لطفاً نوع مشکل را انتخاب کنید', 'warning');
      return;
    }

    if (selectedType === 'delayed_appointment' && !selectedAppointment) {
      showToast('لطفاً نوبت مربوطه را انتخاب کنید', 'warning');
      return;
    }

    if (selectedType === 'registration_issue' && !description.trim()) {
      showToast('لطفاً توضیحات مشکل را وارد کنید', 'warning');
      return;
    }

    const newTicket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      type: selectedType as SupportTicket['type'],
      appointmentId: selectedAppointment || undefined,
      description: selectedType === 'delayed_appointment'
        ? `۲۴ ساعت از درخواست نوبت گذشته و هنوز تأیید/رد نشده. نوبت: ${selectedAppointment}`
        : description,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    const updated = [...tickets, newTicket];
    setTickets(updated);
    localStorage.setItem(`support_tickets_${user?.id}`, JSON.stringify(updated));

    showToast('تیکت پشتیبانی با موفقیت ثبت شد', 'success');

    setSelectedType('');
    setSelectedAppointment('');
    setDescription('');
  };

  const ticketStats = useMemo(() => ({
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }), [tickets]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold"><Clock className="w-3 h-3" />باز</span>;
      case 'in_progress': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold"><MessageSquare className="w-3 h-3" />در حال بررسی</span>;
      case 'resolved': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold"><CheckCircle className="w-3 h-3" />پاسخ داده شده</span>;
      default: return null;
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
          <LifeBuoy className="w-6 h-6" />
          پشتیبانی
        </h2>
        <p className="text-sm text-navy-500 mt-0.5">درصورت مشکل، تیکت پشتیبانی ثبت کنید</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 text-center">
          <p className="text-2xl font-extrabold text-amber-600">{ticketStats.open.toLocaleString('fa-IR')}</p>
          <p className="text-[10px] text-navy-500">تیکت باز</p>
        </motion.div>
        <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 text-center">
          <p className="text-2xl font-extrabold text-blue-600">{ticketStats.inProgress.toLocaleString('fa-IR')}</p>
          <p className="text-[10px] text-navy-500">در حال بررسی</p>
        </motion.div>
        <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 text-center">
          <p className="text-2xl font-extrabold text-emerald-600">{ticketStats.resolved.toLocaleString('fa-IR')}</p>
          <p className="text-[10px] text-navy-500">پاسخ داده شده</p>
        </motion.div>
      </div>

      {/* New Ticket Form */}
      <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
        <h3 className="font-bold text-navy-800 mb-4">ثبت تیکت جدید</h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Selection */}
          <div>
            <label className="block text-xs font-bold text-navy-700 mb-3">نوع مشکل <span className="text-red-500">*</span></label>
            <div className="space-y-3">
              {/* Option 1 */}
              <button
                type="button"
                onClick={() => { setSelectedType('delayed_appointment'); setDescription(''); }}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-right transition-all ${
                  selectedType === 'delayed_appointment'
                    ? 'border-amber-500 bg-amber-50 shadow-sm'
                    : 'border-navy-100 bg-white hover:border-navy-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selectedType === 'delayed_appointment' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${
                    selectedType === 'delayed_appointment' ? 'text-amber-800' : 'text-navy-800'
                  }`}>
                    ۲۴ ساعت از درخواست نوبت گذشته
                  </p>
                  <p className="text-[11px] text-navy-500 mt-0.5">
                    از زمان درخواست نوبت از استاد مشاور گذشته و تاکنون تأیید یا رد نشده
                  </p>
                </div>
              </button>

              {/* Option 2 */}
              <button
                type="button"
                onClick={() => { setSelectedType('registration_issue'); setSelectedAppointment(''); }}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-right transition-all ${
                  selectedType === 'registration_issue'
                    ? 'border-red-500 bg-red-50 shadow-sm'
                    : 'border-navy-100 bg-white hover:border-navy-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selectedType === 'registration_issue' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${
                    selectedType === 'registration_issue' ? 'text-red-800' : 'text-navy-800'
                  }`}>
                    در ثبت اطلاعات به مشکل خورده‌ام
                  </p>
                  <p className="text-[11px] text-navy-500 mt-0.5">
                    مشکل فنی در سامانه یا خطا در ثبت اطلاعات
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Fields */}
          {selectedType === 'delayed_appointment' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
              <label className="block text-xs font-bold text-navy-700 mb-2">
                نوبت مربوطه <span className="text-red-500">*</span>
              </label>
              {pendingAppointments.length > 0 ? (
                <div className="space-y-2">
                  {pendingAppointments.map(apt => (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => setSelectedAppointment(apt.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-right transition-all ${
                        selectedAppointment === apt.id
                          ? 'border-navy-500 bg-navy-50'
                          : 'border-navy-100 hover:border-navy-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedAppointment === apt.id ? 'border-navy-600 bg-navy-600' : 'border-navy-300'
                      }`}>
                        {selectedAppointment === apt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-navy-800">{apt.date} • {apt.time}</p>
                        <p className="text-[10px] text-navy-500">{apt.appointmentType.label} - {apt.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-navy-400 text-center py-4 bg-navy-50 rounded-xl">
                  نوبت در انتظاری وجود ندارد
                </p>
              )}
            </motion.div>
          )}

          {selectedType === 'registration_issue' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
              <label className="block text-xs font-bold text-navy-700 mb-1.5">
                توضیحات مشکل <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="لطفاً مشکل خود را به طور کامل شرح دهید..."
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 resize-none"
              />
            </motion.div>
          )}

          {/* Submit */}
          {selectedType && (
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full py-3 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              ارسال تیکت
            </motion.button>
          )}
        </form>
      </motion.div>

      {/* Ticket History */}
      {tickets.length > 0 && (
        <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
          <h3 className="font-bold text-navy-800 mb-4">سوابق تیکت‌ها</h3>
          <div className="space-y-3">
            {[...tickets].reverse().map(ticket => (
              <div key={ticket.id} className="p-4 rounded-xl bg-navy-50/50 border border-navy-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {ticket.type === 'delayed_appointment' ? (
                      <Clock className="w-4 h-4 text-amber-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-xs font-bold text-navy-800">
                      {ticket.type === 'delayed_appointment' ? 'تأخیر در پاسخ نوبت' : 'مشکل ثبت اطلاعات'}
                    </span>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
                <p className="text-xs text-navy-600">{ticket.description}</p>
                <p className="text-[10px] text-navy-400 mt-1.5">
                  {new Date(ticket.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
