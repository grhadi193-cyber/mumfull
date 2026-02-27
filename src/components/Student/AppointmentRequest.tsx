import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { Calendar, Send, Clock } from 'lucide-react';
import { appointmentTypes } from '@/utils/mockData';
import PersianDatePicker from '@/components/Shared/PersianDatePicker';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AppointmentRequest() {
  const { user } = useAuth();
  const { students, advisors, addAppointment } = useData();
  const { showToast } = useToast();

  const currentStudent = useMemo(() => students.find(s => s.id === user?.id), [students, user]);
  const myAdvisor = useMemo(() => advisors.find(a => a.id === currentStudent?.advisorId), [advisors, currentStudent]);

  const [form, setForm] = useState({
    date: '',
    time: '',
    appointmentType: appointmentTypes[0].value,
    description: '',
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.time) {
      showToast('لطفاً تاریخ و ساعت را انتخاب کنید', 'warning');
      return;
    }
    if (!currentStudent || !myAdvisor) {
      showToast('اطلاعات ناقص است', 'error');
      return;
    }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 500));

    const appointmentType = appointmentTypes.find(t => t.value === form.appointmentType) || appointmentTypes[0];

    addAppointment({
      studentId: currentStudent.id,
      advisorId: myAdvisor.id,
      date: form.date,
      time: form.time,
      appointmentType,
      status: 'pending',
      description: form.description || 'درخواست نوبت مشاوره',
    });

    showToast('درخواست نوبت با موفقیت ثبت شد', 'success');
    setForm({ date: '', time: '', appointmentType: appointmentTypes[0].value, description: '' });
    setSelectedDay(null);
    setSubmitting(false);
  };

  if (!myAdvisor) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-navy-100">
        <Calendar className="w-16 h-16 text-navy-300 mx-auto mb-4" />
        <p className="text-navy-500 text-lg font-bold">مشاوری برای شما تعریف نشده است</p>
        <p className="text-navy-400 text-sm mt-1">لطفاً با مدیر سیستم تماس بگیرید</p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item}>
        <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          درخواست نوبت مشاوره
        </h2>
        <p className="text-sm text-navy-500 mt-0.5">نوبت مشاوره از دکتر {myAdvisor.firstName} {myAdvisor.lastName} دریافت کنید</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Availability */}
        <motion.div variants={item} className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-navy-600" />
            <h3 className="font-bold text-navy-800">زمان‌های در دسترس مشاور</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
            {myAdvisor.availability.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(selectedDay === i ? null : i)}
                className={`p-3 rounded-xl text-sm font-bold text-center transition-all ${
                  selectedDay === i
                    ? 'bg-navy-800 text-white shadow-lg'
                    : 'bg-navy-50 text-navy-700 hover:bg-navy-100'
                }`}
              >
                {day.day}
                <p className={`text-[10px] font-normal mt-1 ${selectedDay === i ? 'text-navy-300' : 'text-navy-400'}`}>
                  {day.slots.filter(s => s.available).length} بازه فعال
                </p>
              </button>
            ))}
          </div>

          {selectedDay !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              {myAdvisor.availability[selectedDay].slots.map((slot, i) => (
                <button
                  key={i}
                  disabled={!slot.available}
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      time: slot.time,
                      date: `1404/11/${String(selectedDay + 1).padStart(2, '0')}`,
                    }));
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                    !slot.available
                      ? 'bg-navy-50 text-navy-300 cursor-not-allowed line-through'
                      : form.time === slot.time
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Request Form */}
        <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
          <h3 className="font-bold text-navy-800 mb-4">فرم درخواست</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PersianDatePicker
              value={form.date}
              onChange={(d) => setForm(prev => ({ ...prev, date: d }))}
              label="تاریخ"
              required
            />
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">ساعت *</label>
              <input
                value={form.time}
                readOnly
                placeholder="از جدول انتخاب کنید"
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm bg-navy-50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">نوع مشاوره</label>
              <select
                value={form.appointmentType}
                onChange={e => setForm(prev => ({ ...prev, appointmentType: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20"
              >
                {appointmentTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">توضیحات</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="توضیحات خود را وارد کنید..."
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 resize-none"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={submitting || !form.date || !form.time}
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  ارسال درخواست
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
