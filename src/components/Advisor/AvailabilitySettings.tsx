import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { Clock, Save, RotateCcw } from 'lucide-react';
import type { DayAvailability } from '@/utils/mockData';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AvailabilitySettings() {
  const { user } = useAuth();
  const { advisors, updateAvailability } = useData();
  const { showToast } = useToast();

  const advisor = advisors.find(a => a.id === user?.id);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);

  useEffect(() => {
    if (advisor) {
      setAvailability(JSON.parse(JSON.stringify(advisor.availability)));
    }
  }, [advisor]);

  const toggleSlot = (dayIndex: number, slotIndex: number) => {
    setAvailability(prev => {
      const next = [...prev];
      next[dayIndex] = {
        ...next[dayIndex],
        slots: next[dayIndex].slots.map((s, i) => i === slotIndex ? { ...s, available: !s.available } : s),
      };
      return next;
    });
  };

  const handleSave = () => {
    if (user) {
      updateAvailability(user.id, availability);
      showToast('زمان‌بندی با موفقیت ذخیره شد', 'success');
    }
  };

  const handleReset = () => {
    if (advisor) {
      setAvailability(JSON.parse(JSON.stringify(advisor.availability)));
      showToast('تغییرات بازنشانی شد', 'info');
    }
  };

  if (!advisor) return null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            ساعات حضور
          </h2>
          <p className="text-sm text-navy-500 mt-0.5">ساعات حضور خود را تنظیم کنید</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-100 text-navy-700 text-xs font-medium hover:bg-navy-200 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> بازنشانی
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-xs font-bold shadow-lg">
            <Save className="w-3.5 h-3.5" /> ذخیره تغییرات
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs min-w-[100px]">ساعت</th>
                {availability.map((day, i) => (
                  <th key={i} className="px-3 py-3 text-center font-bold text-navy-700 text-xs min-w-[90px]">{day.day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {availability[0]?.slots.map((_, slotIndex) => (
                <tr key={slotIndex} className="border-b border-navy-50">
                  <td className="px-4 py-2 text-navy-600 text-xs font-mono whitespace-nowrap">
                    {availability[0].slots[slotIndex].time}
                  </td>
                  {availability.map((day, dayIndex) => (
                    <td key={dayIndex} className="px-3 py-2 text-center">
                      <button
                        onClick={() => toggleSlot(dayIndex, slotIndex)}
                        className={`w-full py-2 rounded-lg text-[10px] font-bold transition-all ${
                          day.slots[slotIndex].available
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-navy-100 text-navy-400 hover:bg-navy-200'
                        }`}
                      >
                        {day.slots[slotIndex].available ? 'فعال' : 'غیرفعال'}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex gap-4 text-xs text-navy-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          <span>فعال (قابل رزرو)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-navy-100 border border-navy-200" />
          <span>غیرفعال</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
