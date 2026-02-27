import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Star, ExternalLink, CheckCircle, User } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function StudentEvaluation() {
  const { user } = useAuth();
  const { students, advisors } = useData();

  const currentStudent = useMemo(() => students.find(s => s.id === user?.id), [students, user]);
  const myAdvisor = useMemo(() => advisors.find(a => a.id === currentStudent?.advisorId), [advisors, currentStudent]);

  const steps = [
    { num: '۱', text: 'روی دکمه «شروع ارزشیابی» کلیک کنید' },
    { num: '۲', text: 'به صفحه پرسشنامه پُرسلاین منتقل خواهید شد' },
    { num: '۳', text: 'به تمامی سوالات با دقت پاسخ دهید' },
    { num: '۴', text: 'در پایان دکمه ثبت نهایی را بزنید' },
    { num: '۵', text: 'نتایج به صورت محرمانه ثبت خواهد شد' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500" />
          ارزشیابی استاد مشاور
        </h2>
        <p className="text-sm text-navy-500 mt-0.5">نظر خود را درباره عملکرد استاد مشاور ثبت کنید</p>
      </motion.div>

      {/* Advisor Info */}
      {myAdvisor && (
        <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-navy-600" />
            <h3 className="font-bold text-navy-800">استاد مشاور شما</h3>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-navy-50">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {myAdvisor.firstName[0]}
            </div>
            <div>
              <p className="text-lg font-bold text-navy-800">دکتر {myAdvisor.firstName} {myAdvisor.lastName}</p>
              <p className="text-sm text-navy-500">{myAdvisor.specialty || 'مشاور تحصیلی'}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Survey Link */}
      <motion.div variants={item} className="bg-gradient-to-l from-amber-50 to-amber-100 rounded-2xl p-6 shadow-sm border border-amber-200">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl">
            <Star className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-extrabold text-amber-800 mb-2">پرسشنامه ارزشیابی</h3>
          <p className="text-sm text-amber-700 mb-6 max-w-md mx-auto">
            با تکمیل این پرسشنامه، به بهبود کیفیت خدمات مشاوره‌ای کمک کنید.
            پاسخ‌های شما کاملاً محرمانه است.
          </p>
          <motion.a
            href="https://survey.porsline.ir/s/example-survey"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-l from-amber-500 to-amber-600 text-white font-bold text-base shadow-xl shadow-amber-500/30 hover:shadow-2xl transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            شروع ارزشیابی در پُرسلاین
          </motion.a>
          <p className="text-[11px] text-amber-600 mt-3">
            با کلیک روی دکمه بالا، به وبسایت پُرسلاین منتقل می‌شوید
          </p>
        </div>
      </motion.div>

      {/* Steps */}
      <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
        <h3 className="font-bold text-navy-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          راهنمای تکمیل پرسشنامه
        </h3>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-navy-50/50 hover:bg-navy-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                {step.num}
              </div>
              <p className="text-sm text-navy-700">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Important Notes */}
      <motion.div variants={item} className="bg-blue-50 rounded-2xl p-5 shadow-sm border border-blue-200">
        <h3 className="font-bold text-blue-800 mb-3 text-sm">📌 نکات مهم:</h3>
        <ul className="space-y-2 text-xs text-blue-700">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            پاسخ‌های شما کاملاً محرمانه بوده و هیچ اطلاعات شخصی شما ذخیره نمی‌شود.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            لطفاً با صداقت و دقت به سوالات پاسخ دهید.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            نتایج ارزشیابی در بهبود خدمات مشاوره‌ای مؤثر خواهد بود.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            امکان تکمیل پرسشنامه فقط یکبار در هر نیمسال وجود دارد.
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
