import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/Shared/Modal';
import { FileText, Plus, Search, BookOpen, ExternalLink, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { referralTargets, type Referral } from '@/utils/mockData';
import PersianDatePicker from '@/components/Shared/PersianDatePicker';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function SessionRecords() {
  const { user } = useAuth();
  const { getStudentsByAdvisor, addSession } = useData();
  const { showToast } = useToast();

  const myStudents = useMemo(() => user ? getStudentsByAdvisor(user.id) : [], [user, getStudentsByAdvisor]);

  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Session form state
  const [sessionForm, setSessionForm] = useState({
    date: '',
    time: '',
    type: 'مشاوره تحصیلی',
    notes: '',
  });

  // Referral state
  const [hasReferral, setHasReferral] = useState(false);
  const [referrals, setReferrals] = useState<Omit<Referral, 'id'>[]>([]);
  const [currentReferral, setCurrentReferral] = useState({
    target: '',
    reason: '',
  });

  const filteredStudents = useMemo(() =>
    myStudents.filter(s => !search || `${s.firstName} ${s.lastName} ${s.studentNumber}`.includes(search)),
    [myStudents, search]
  );

  const activeStudent = myStudents.find(s => s.id === selectedStudent);

  const addReferralToList = () => {
    if (!currentReferral.target) {
      showToast('لطفاً مقصد ارجاع را انتخاب کنید', 'warning');
      return;
    }
    if (!currentReferral.reason || currentReferral.reason.length < 3) {
      showToast('لطفاً دلیل ارجاع را وارد کنید (حداقل ۳ کاراکتر)', 'warning');
      return;
    }
    setReferrals(prev => [...prev, {
      target: currentReferral.target,
      reason: currentReferral.reason,
      date: sessionForm.date || new Date().toISOString().split('T')[0],
      status: 'pending' as const,
    }]);
    setCurrentReferral({ target: '', reason: '' });
    showToast('ارجاع اضافه شد', 'success');
  };

  const removeReferral = (index: number) => {
    setReferrals(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !sessionForm.date) {
      showToast('لطفاً فیلدهای ضروری را پر کنید', 'warning');
      return;
    }

    addSession(selectedStudent, {
      date: sessionForm.date,
      time: sessionForm.time,
      type: sessionForm.type,
      notes: sessionForm.notes,
      referrals: referrals.map((r, i) => ({
        ...r,
        id: `ref_${Date.now()}_${i}`,
      })),
    });

    showToast('جلسه جدید با موفقیت ثبت شد', 'success');
    setShowAddModal(false);
    setSessionForm({ date: '', time: '', type: 'مشاوره تحصیلی', notes: '' });
    setReferrals([]);
    setHasReferral(false);
    setCurrentReferral({ target: '', reason: '' });
  };

  const getReferralStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: typeof CheckCircle; label: string }> = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'در انتظار' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', icon: AlertCircle, label: 'در حال بررسی' },
      completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: 'تکمیل شده' },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${s.bg} ${s.text}`}>
        <s.icon className="w-3 h-3" />
        {s.label}
      </span>
    );
  };

  const getReferralTargetInfo = (target: string) => {
    return referralTargets.find(r => r.value === target) || { label: target, icon: '📋', color: 'from-gray-500 to-gray-600' };
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            سوابق جلسات
          </h2>
          <p className="text-sm text-navy-500 mt-0.5">مدیریت جلسات مشاوره و ارجاعات دانشجویان</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="جستجوی دانشجو..."
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400" />
        </div>
      </motion.div>

      {/* Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map(student => {
          const totalReferrals = student.sessions.reduce((sum, s) => sum + s.referrals.length, 0);
          return (
            <motion.div
              key={student.id}
              variants={item}
              whileHover={{ y: -2 }}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-all cursor-pointer ${
                selectedStudent === student.id ? 'border-navy-500 shadow-md ring-2 ring-navy-500/20' : 'border-navy-100 hover:shadow-md'
              }`}
              onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-sm font-bold">
                  {student.firstName[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-navy-800">{student.firstName} {student.lastName}</p>
                  <p className="text-[11px] text-navy-500">{student.studentNumber} • معدل: {student.gpa}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-navy-100 text-navy-600 text-xs font-bold">{student.totalSessions} جلسه</span>
                {totalReferrals > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-600 text-xs font-bold flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {totalReferrals} ارجاع
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Student Sessions */}
      {activeStudent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              جلسات {activeStudent.firstName} {activeStudent.lastName}
            </h3>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-xs font-bold shadow-lg">
              <Plus className="w-3.5 h-3.5" /> ثبت جلسه جدید
            </motion.button>
          </div>

          {activeStudent.sessions.length > 0 ? (
            <div className="space-y-2.5">
              {activeStudent.sessions.map(session => (
                <div key={session.id} className="rounded-xl bg-navy-50/50 hover:bg-navy-50 transition-colors overflow-hidden">
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-navy-700">{session.date}</span>
                        <span className="text-[10px] text-navy-400">ساعت {session.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold">{session.type}</span>
                        {session.referrals.length > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {session.referrals.length} ارجاع
                          </span>
                        )}
                        {(session.referrals.length > 0 || session.notes) && (
                          expandedSession === session.id
                            ? <ChevronUp className="w-4 h-4 text-navy-400" />
                            : <ChevronDown className="w-4 h-4 text-navy-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-navy-600 line-clamp-1">{session.notes}</p>
                  </div>

                  <AnimatePresence>
                    {expandedSession === session.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 border-t border-navy-200/50 pt-2">
                          {session.notes && (
                            <div className="mb-3">
                              <p className="text-[10px] text-navy-400 font-bold mb-1">یادداشت کامل:</p>
                              <p className="text-xs text-navy-600">{session.notes}</p>
                            </div>
                          )}

                          {session.referrals.length > 0 && (
                            <div>
                              <p className="text-[10px] text-navy-400 font-bold mb-2 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                ارجاعات:
                              </p>
                              <div className="space-y-2">
                                {session.referrals.map((ref) => {
                                  const targetInfo = getReferralTargetInfo(ref.target);
                                  return (
                                    <div key={ref.id} className="bg-white rounded-lg p-2.5 border border-navy-100">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                          <span className={`w-6 h-6 rounded-lg bg-gradient-to-br ${targetInfo.color} flex items-center justify-center text-[10px]`}>
                                            {targetInfo.icon}
                                          </span>
                                          <span className="text-xs font-bold text-navy-800">{ref.target}</span>
                                        </div>
                                        {getReferralStatusBadge(ref.status)}
                                      </div>
                                      <p className="text-[11px] text-navy-600 mr-8">{ref.reason}</p>
                                      <p className="text-[10px] text-navy-400 mr-8 mt-1">تاریخ: {ref.date}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-navy-400 text-sm py-6">جلسه‌ای ثبت نشده</p>
          )}
        </motion.div>
      )}

      {/* Add Session Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setHasReferral(false); setReferrals([]); setCurrentReferral({ target: '', reason: '' }); }} title="ثبت جلسه جدید">
        <form onSubmit={handleAddSession} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <PersianDatePicker
              value={sessionForm.date}
              onChange={(d) => setSessionForm({ ...sessionForm, date: d })}
              label="تاریخ"
              required
            />
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">ساعت</label>
              <input value={sessionForm.time} onChange={e => setSessionForm({ ...sessionForm, time: e.target.value })}
                placeholder="10:00"
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">موضوع جلسه</label>
            <select value={sessionForm.type} onChange={e => setSessionForm({ ...sessionForm, type: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20">
              <option>مشاوره تحصیلی</option>
              <option>مشاوره روانشناسی</option>
              <option>مشاوره شغلی</option>
              <option>مشاوره گروهی</option>
              <option>بررسی وضعیت تحصیلی</option>
              <option>انتخاب واحد</option>
              <option>سایر</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">یادداشت</label>
            <textarea value={sessionForm.notes} onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })}
              rows={3} className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 resize-none"
              placeholder="خلاصه جلسه مشاوره را بنویسید..." />
          </div>

          {/* Referral Section */}
          <div className="border-t border-navy-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-bold text-navy-700">
                <ExternalLink className="w-4 h-4 text-purple-600" />
                ارجاع دانشجو
              </label>
              <button
                type="button"
                onClick={() => setHasReferral(!hasReferral)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  hasReferral ? 'bg-purple-600' : 'bg-navy-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hasReferral ? '-translate-x-6' : '-translate-x-1'
                }`} />
              </button>
            </div>

            <AnimatePresence>
              {hasReferral && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {/* Referral Target Selection */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-navy-700 mb-2">مقصد ارجاع *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {referralTargets.map(target => (
                        <button
                          key={target.value}
                          type="button"
                          onClick={() => setCurrentReferral(prev => ({ ...prev, target: target.value }))}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-right ${
                            currentReferral.target === target.value
                              ? 'border-purple-500 bg-purple-50 shadow-sm'
                              : 'border-navy-100 hover:border-navy-300 bg-white'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${target.color} flex items-center justify-center text-sm flex-shrink-0`}>
                            {target.icon}
                          </span>
                          <span className={`text-xs font-bold ${currentReferral.target === target.value ? 'text-purple-700' : 'text-navy-700'}`}>
                            {target.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-navy-700 mb-1">دلیل ارجاع *</label>
                    <textarea
                      value={currentReferral.reason}
                      onChange={e => setCurrentReferral(prev => ({ ...prev, reason: e.target.value }))}
                      rows={2}
                      placeholder="دلیل ارجاع دانشجو را شرح دهید..."
                      className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                    />
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={addReferralToList}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-l from-purple-600 to-purple-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 mb-3"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    افزودن ارجاع
                  </motion.button>

                  {/* Added Referrals List */}
                  {referrals.length > 0 && (
                    <div className="space-y-2 mb-2">
                      <p className="text-[10px] text-navy-500 font-bold">ارجاعات ثبت شده ({referrals.length}):</p>
                      {referrals.map((ref, index) => {
                        const targetInfo = getReferralTargetInfo(ref.target);
                        return (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 border border-purple-100">
                            <span className={`w-6 h-6 rounded-md bg-gradient-to-br ${targetInfo.color} flex items-center justify-center text-[10px] flex-shrink-0`}>
                              {targetInfo.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-purple-800">{ref.target}</p>
                              <p className="text-[10px] text-purple-600 truncate">{ref.reason}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeReferral(index)}
                              className="p-1 rounded-md hover:bg-red-100 text-red-500 transition-colors flex-shrink-0"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-navy-100">
            <button type="button" onClick={() => { setShowAddModal(false); setHasReferral(false); setReferrals([]); }} className="px-4 py-2 rounded-xl text-sm text-navy-600 hover:bg-navy-100">انصراف</button>
            <button type="submit" className="px-6 py-2 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-sm font-bold shadow-lg">ثبت جلسه</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
