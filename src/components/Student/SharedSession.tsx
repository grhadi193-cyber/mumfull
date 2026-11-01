import { storage } from '@/utils/storage';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import PersianDatePicker from '@/components/Shared/PersianDatePicker';
import { Handshake, CheckCircle, Send, Clock, XCircle, BookOpen } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const sessionTopics = [
  'بررسی افت تحصیلی',
  'بررسی مشروطی',
  'بررسی آموزشی',
  'بررسی پژوهشی',
  'اعلام وضعیت روانی و خانوادگی',
  'مشورت امور مالی',
  'مشورت شغلی',
  'سوال متفرقه',
];

const referralOptions = [
  { label: 'کلینیک مشاوره', value: 'کلینیک مشاوره', icon: '🧠' },
  { label: 'مسئول اساتید مشاور', value: 'مسئول اساتید مشاور', icon: '👨‍💼' },
  { label: 'مسئول آموزش', value: 'مسئول آموزش', icon: '📚' },
  { label: 'مدیرگروه', value: 'مدیرگروه', icon: '🏛️' },
];

interface SharedSessionRecord {
  id: string;
  date: string;
  topics: string[];
  referrals: string[];
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function SharedSession() {
  const { user } = useAuth();
  const { students, advisors } = useData();
  const { showToast } = useToast();

  const currentStudent = useMemo(() => students.find(s => s.id === user?.id), [students, user]);
  const myAdvisor = useMemo(() => advisors.find(a => a.id === currentStudent?.advisorId), [advisors, currentStudent]);

  const [sessionDate, setSessionDate] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedReferrals, setSelectedReferrals] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Load shared sessions from localStorage
  const [sharedSessions, setSharedSessions] = useState<SharedSessionRecord[]>(() => {
    const saved = storage.getItem(`shared_sessions_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const toggleReferral = (ref: string) => {
    setSelectedReferrals(prev =>
      prev.includes(ref) ? prev.filter(r => r !== ref) : [...prev, ref]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionDate) {
      showToast('لطفاً تاریخ جلسه را انتخاب کنید', 'warning');
      return;
    }
    if (selectedTopics.length === 0) {
      showToast('لطفاً حداقل یک موضوع جلسه انتخاب کنید', 'warning');
      return;
    }

    const newSession: SharedSessionRecord = {
      id: `shared_${Date.now()}`,
      date: sessionDate,
      topics: selectedTopics,
      referrals: selectedReferrals,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updated = [...sharedSessions, newSession];
    setSharedSessions(updated);
    storage.setItem(`shared_sessions_${user?.id}`, JSON.stringify(updated));

    showToast('اطلاعات جلسه برای استاد مشاور ارسال شد', 'success');

    // Reset form
    setSessionDate('');
    setSelectedTopics([]);
    setSelectedReferrals([]);
    setNotes('');
  };

  const sessionCount = currentStudent?.totalSessions || 0;
  const sharedCount = sharedSessions.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-[11px] font-bold">
            <Clock className="w-3 h-3" /> در انتظار تأیید استاد
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-bold">
            <CheckCircle className="w-3 h-3" /> تأیید شده
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-[11px] font-bold">
            <XCircle className="w-3 h-3" /> رد شده
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
          <Handshake className="w-6 h-6" />
          ثبت جلسه اشتراکی با استاد مشاور
        </h2>
        <p className="text-sm text-navy-500 mt-0.5">
          {myAdvisor ? `استاد مشاور: دکتر ${myAdvisor.firstName} ${myAdvisor.lastName}` : 'استاد مشاور تعیین نشده'}
        </p>
      </motion.div>

      {/* Session Count */}
      <motion.div variants={item} className="bg-gradient-to-l from-navy-700 to-navy-900 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-navy-300 text-xs">تعداد جلسات برگزار شده تاکنون</p>
            <p className="text-3xl font-extrabold">{(sessionCount + sharedCount).toLocaleString('fa-IR')} جلسه</p>
          </div>
        </div>
      </motion.div>

      {/* Session Form */}
      <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-center">
          <p className="text-sm font-bold text-blue-700">
            ثبت جلسه {(sessionCount + sharedCount + 1).toLocaleString('fa-IR')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date */}
          <PersianDatePicker
            value={sessionDate}
            onChange={setSessionDate}
            label="تاریخ جلسه"
            required
          />

          {/* Topics - Multi Select */}
          <div>
            <label className="block text-xs font-bold text-navy-700 mb-2">
              موضوع جلسه <span className="text-red-500">*</span>
              <span className="text-[10px] text-navy-400 mr-1">(چند انتخابی)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sessionTopics.map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-right text-xs font-medium transition-all ${
                    selectedTopics.includes(topic)
                      ? 'border-navy-600 bg-navy-50 text-navy-800 shadow-sm'
                      : 'border-navy-100 bg-white text-navy-600 hover:border-navy-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                    selectedTopics.includes(topic)
                      ? 'bg-navy-700 text-white'
                      : 'border border-navy-300'
                  }`}>
                    {selectedTopics.includes(topic) && <CheckCircle className="w-3 h-3" />}
                  </div>
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Referrals - Multi Select */}
          <div>
            <label className="block text-xs font-bold text-navy-700 mb-2">
              ارجاع <span className="text-[10px] text-navy-400">(چند انتخابی - اختیاری)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {referralOptions.map(ref => (
                <button
                  key={ref.value}
                  type="button"
                  onClick={() => toggleReferral(ref.value)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-right transition-all ${
                    selectedReferrals.includes(ref.value)
                      ? 'border-purple-500 bg-purple-50 shadow-sm'
                      : 'border-navy-100 bg-white hover:border-navy-300'
                  }`}
                >
                  <span className="text-lg">{ref.icon}</span>
                  <span className={`text-xs font-bold ${
                    selectedReferrals.includes(ref.value) ? 'text-purple-700' : 'text-navy-700'
                  }`}>
                    {ref.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-navy-700 mb-1.5">توضیحات (اختیاری)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="توضیحات تکمیلی جلسه..."
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 resize-none"
            />
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-700 text-white text-sm font-bold shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 hover:shadow-2xl transition-all"
          >
            <Send className="w-4 h-4" />
            ارسال برای استاد مشاور
          </motion.button>
          <p className="text-[10px] text-navy-400 text-center">
            اطلاعات ثبت شده پس از تأیید استاد مشاور، نهایی خواهد شد.
          </p>
        </form>
      </motion.div>

      {/* Shared Sessions History */}
      {sharedSessions.length > 0 && (
        <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
          <h3 className="font-bold text-navy-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            سوابق جلسات اشتراکی ثبت شده
          </h3>
          <div className="space-y-3">
            {[...sharedSessions].reverse().map(session => (
              <div key={session.id} className="p-4 rounded-xl bg-navy-50/50 border border-navy-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-navy-800">📅 {session.date}</span>
                  {getStatusBadge(session.status)}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {session.topics.map((topic, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold">
                      {topic}
                    </span>
                  ))}
                </div>
                {session.referrals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {session.referrals.map((ref, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 text-[10px] font-bold">
                        ارجاع: {ref}
                      </span>
                    ))}
                  </div>
                )}
                {session.notes && (
                  <p className="text-xs text-navy-600">{session.notes}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
