import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/Shared/Modal';
import {
  Users, Search, Filter, Download, FileText, ClipboardList,
  ChevronDown, ChevronUp, ExternalLink, CheckCircle, X, Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { type Referral } from '@/utils/mockData';
import PersianDatePicker from '@/components/Shared/PersianDatePicker';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const semesters = ['1404-1', '1404-2', '1403-1', '1403-2', '1402-1', '1402-2'];

const gpaFilters = [
  { label: 'همه', value: 'all' },
  { label: '۱۸ تا ۲۰', value: '18to20' },
  { label: '۱۶ تا ۱۷.۹۹', value: '16to18' },
  { label: '۱۴ تا ۱۵.۹۹', value: '14to16' },
  { label: '۱۲ تا ۱۳.۹۹', value: '12to14' },
  { label: 'مشروط عادی', value: 'probation_normal' },
  { label: 'مشروط بین‌الملل', value: 'probation_international' },
  { label: 'مشروط سهمیه', value: 'probation_quota' },
  { label: 'افت تحصیلی عادی', value: 'decline_normal' },
  { label: 'افت تحصیلی بین‌الملل', value: 'decline_international' },
  { label: 'افت تحصیلی سهمیه', value: 'decline_quota' },
];

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
  { label: 'کلینیک مشاوره', value: 'کلینیک مشاوره', icon: '🧠', color: 'from-purple-500 to-purple-600' },
  { label: 'مسئول اساتید مشاور', value: 'مسئول اساتید مشاور', icon: '👨‍💼', color: 'from-blue-500 to-blue-600' },
  { label: 'مسئول آموزش', value: 'مسئول آموزش', icon: '📚', color: 'from-emerald-500 to-emerald-600' },
  { label: 'مدیرگروه', value: 'مدیرگروه', icon: '🏛️', color: 'from-amber-500 to-amber-600' },
];

export default function AdvisorDashboard() {
  const { user } = useAuth();
  const { getStudentsByAdvisor, addSession } = useData();
  const { showToast } = useToast();

  const myStudents = useMemo(() => user ? getStudentsByAdvisor(user.id) : [], [user, getStudentsByAdvisor]);

  const [selectedSemester, setSelectedSemester] = useState('1404-1');
  const [search, setSearch] = useState('');
  const [gpaFilter, setGpaFilter] = useState('all');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Session form
  const [sessionDate, setSessionDate] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedReferrals, setSelectedReferrals] = useState<string[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');

  const getGpaHistory = (studentId: string) => {
    const seed = studentId.charCodeAt(studentId.length - 1);
    return [
      { semester: '1402-1', gpa: parseFloat((14 + ((seed * 3) % 50) / 10).toFixed(1)) },
      { semester: '1402-2', gpa: parseFloat((14 + ((seed * 7) % 50) / 10).toFixed(1)) },
      { semester: '1403-1', gpa: parseFloat((14 + ((seed * 11) % 50) / 10).toFixed(1)) },
      { semester: '1403-2', gpa: parseFloat((14 + ((seed * 13) % 50) / 10).toFixed(1)) },
    ];
  };

  const filteredStudents = useMemo(() => {
    let result = myStudents.filter(s => s.semester === selectedSemester || selectedSemester === 'all');
    if (result.length === 0 && selectedSemester !== 'all') result = myStudents;

    if (search) {
      result = result.filter(s =>
        `${s.firstName} ${s.lastName}`.includes(search) ||
        s.studentNumber.includes(search)
      );
    }

    switch (gpaFilter) {
      case '18to20':
        result = result.filter(s => s.gpa >= 18 && s.gpa <= 20);
        break;
      case '16to18':
        result = result.filter(s => s.gpa >= 16 && s.gpa < 18);
        break;
      case '14to16':
        result = result.filter(s => s.gpa >= 14 && s.gpa < 16);
        break;
      case '12to14':
        result = result.filter(s => s.gpa >= 12 && s.gpa < 14);
        break;
      case 'probation_normal':
        result = result.filter(s => s.gpa < 12 && (!s.studentType || s.studentType === 'normal'));
        break;
      case 'probation_international':
        result = result.filter(s => s.gpa < 14 && s.studentType === 'international');
        break;
      case 'probation_quota':
        result = result.filter(s => s.gpa < 14 && s.studentType === 'quota');
        break;
      case 'decline_normal': {
        result = result.filter(s => {
          if (s.studentType && s.studentType !== 'normal') return false;
          const history = getGpaHistory(s.id);
          if (history.length < 1) return false;
          const prevGpa = history[history.length - 1].gpa;
          return (prevGpa - s.gpa) >= 2;
        });
        break;
      }
      case 'decline_international': {
        result = result.filter(s => {
          if (s.studentType !== 'international') return false;
          const history = getGpaHistory(s.id);
          if (history.length < 1) return false;
          const prevGpa = history[history.length - 1].gpa;
          return (prevGpa - s.gpa) >= 2;
        });
        break;
      }
      case 'decline_quota': {
        result = result.filter(s => {
          if (s.studentType !== 'quota') return false;
          const history = getGpaHistory(s.id);
          if (history.length < 1) return false;
          const prevGpa = history[history.length - 1].gpa;
          return (prevGpa - s.gpa) >= 2;
        });
        break;
      }
    }
    return result;
  }, [myStudents, selectedSemester, search, gpaFilter]);

  const selectedStudent = myStudents.find(s => s.id === selectedStudentId);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  const toggleReferral = (ref: string) => {
    setSelectedReferrals(prev => prev.includes(ref) ? prev.filter(r => r !== ref) : [...prev, ref]);
  };

  const openSessionModal = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSessionDate('');
    setSelectedTopics([]);
    setSelectedReferrals([]);
    setSessionNotes('');
    setShowSessionModal(true);
  };

  const openHistoryModal = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowHistoryModal(true);
  };

  const handleSubmitSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    if (!sessionDate) { showToast('لطفاً تاریخ جلسه را وارد کنید', 'warning'); return; }
    if (selectedTopics.length === 0) { showToast('لطفاً حداقل یک موضوع انتخاب کنید', 'warning'); return; }

    const referrals: Omit<Referral, 'id'>[] = selectedReferrals.map(ref => ({
      target: ref,
      reason: `ارجاع - ${selectedTopics.join('، ')}`,
      date: sessionDate,
      status: 'pending' as const,
    }));

    addSession(selectedStudentId, {
      date: sessionDate,
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      type: selectedTopics.join('، '),
      notes: sessionNotes || selectedTopics.join('، '),
      referrals: referrals.map((r, i) => ({ ...r, id: `ref_${Date.now()}_${i}` })),
    });

    showToast('جلسه با موفقیت ثبت شد', 'success');
    setShowSessionModal(false);
  };

  const exportToExcel = () => {
    const data = filteredStudents.map(s => ({
      'نام و نام خانوادگی': `${s.firstName} ${s.lastName}`,
      'شماره دانشجویی': s.studentNumber,
      'شماره تماس': s.phoneNumber,
      'معدل': s.gpa,
      'نوع پذیرش': s.studentType === 'international' ? 'بین‌الملل' : s.studentType === 'quota' ? 'سهمیه' : 'عادی',
      'نیمسال': s.semester,
      'تعداد جلسات': s.totalSessions,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'دانشجویان');
    XLSX.writeFile(wb, `students_${selectedSemester}.xlsx`);
    showToast('فایل اکسل دانلود شد', 'success');
  };

  const getGpaColor = (gpa: number) => {
    if (gpa >= 17) return 'text-emerald-600 bg-emerald-50';
    if (gpa >= 14) return 'text-blue-600 bg-blue-50';
    if (gpa >= 12) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getStudentTypeLabel = (type?: string) => {
    if (type === 'international') return 'بین‌الملل';
    if (type === 'quota') return 'سهمیه';
    return 'عادی';
  };

  const getReferralStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getReferralStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'تکمیل شده';
      case 'in_progress': return 'در حال پیگیری';
      default: return 'در انتظار';
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Welcome */}
      <motion.div variants={item} className="bg-gradient-to-l from-navy-700 to-navy-900 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-extrabold mb-1">خوش آمدید، دکتر {user?.lastName}</h2>
        <p className="text-navy-300 text-sm">داشبورد مشاور تحصیلی</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item}>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100 hover:shadow-md transition-all inline-flex items-center gap-4 min-w-[200px]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-navy-800">{myStudents.length.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-navy-500 mt-0.5">دانشجویان تحت سرپرستی</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 min-w-[180px]">
            <label className="text-xs font-bold text-navy-600 whitespace-nowrap">نیمسال:</label>
            <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-navy-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20">
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو نام، نام خانوادگی یا شماره دانشجویی..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20" />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportToExcel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-700 text-white text-xs font-bold shadow-lg whitespace-nowrap">
            <Download className="w-3.5 h-3.5" /> خروجی اکسل
          </motion.button>
        </div>

        {/* GPA Filter - 11 options */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-navy-400" />
            <span className="text-xs font-bold text-navy-600">فیلتر معدل:</span>
            <span className="text-[11px] text-navy-400">({filteredStudents.length.toLocaleString('fa-IR')} دانشجو)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {gpaFilters.map(f => (
              <button key={f.value} onClick={() => setGpaFilter(f.value)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  gpaFilter === f.value
                    ? 'bg-navy-800 text-white shadow-sm'
                    : 'text-navy-600 hover:bg-navy-100 bg-navy-50'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Students Table */}
      <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="px-3 py-3 text-right font-bold text-navy-700 text-xs">#</th>
                <th className="px-3 py-3 text-right font-bold text-navy-700 text-xs">نام و نام خانوادگی</th>
                <th className="px-3 py-3 text-right font-bold text-navy-700 text-xs">شماره دانشجویی</th>
                <th className="px-3 py-3 text-right font-bold text-navy-700 text-xs">شماره تماس</th>
                <th className="px-3 py-3 text-right font-bold text-navy-700 text-xs">نوع پذیرش</th>
                <th className="px-3 py-3 text-right font-bold text-navy-700 text-xs">معدل</th>
                <th className="px-3 py-3 text-right font-bold text-navy-700 text-xs">سابقه معدل</th>
                <th className="px-3 py-3 text-right font-bold text-navy-700 text-xs">جلسات</th>
                <th className="px-3 py-3 text-right font-bold text-navy-700 text-xs min-w-[220px]">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const gpaHistory = getGpaHistory(student.id);
                const isExpanded = expandedStudent === student.id;
                const prevGpa = gpaHistory.length > 0 ? gpaHistory[gpaHistory.length - 1].gpa : null;
                const hasDecline = prevGpa !== null && (prevGpa - student.gpa) >= 2;

                return (
                  <AnimatePresence key={student.id}>
                    <tr className="border-b border-navy-50 hover:bg-navy-50/50 transition-colors">
                      <td className="px-3 py-3 text-navy-500 text-xs">{(index + 1).toLocaleString('fa-IR')}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {student.firstName[0]}
                          </div>
                          <div>
                            <span className="font-bold text-navy-800 text-sm">{student.firstName} {student.lastName}</span>
                            {hasDecline && (
                              <span className="block text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                                ⚠️ افت {(prevGpa! - student.gpa).toFixed(1)} نمره
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-navy-600 font-mono text-xs">{student.studentNumber}</td>
                      <td className="px-3 py-3 text-navy-600 text-xs font-mono" dir="ltr">{student.phoneNumber}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          student.studentType === 'international' ? 'bg-purple-100 text-purple-700' :
                          student.studentType === 'quota' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getStudentTypeLabel(student.studentType)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getGpaColor(student.gpa)}`}>
                          {student.gpa}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                          مشاهده {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-1 rounded-lg bg-navy-100 text-navy-700 text-xs font-bold">
                          {student.totalSessions.toLocaleString('fa-IR')} جلسه
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => openSessionModal(student.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-l from-navy-700 to-navy-800 text-white text-[11px] font-bold shadow-sm">
                            <FileText className="w-3 h-3" /> ثبت جلسه
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => openHistoryModal(student.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-l from-indigo-500 to-indigo-600 text-white text-[11px] font-bold shadow-sm">
                            <ClipboardList className="w-3 h-3" /> گزارش جلسات
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                    {/* GPA History */}
                    {isExpanded && (
                      <tr key={`${student.id}-hist`}>
                        <td colSpan={9} className="px-3 py-0">
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="py-3 px-4 bg-blue-50/50 rounded-xl my-2">
                              <p className="text-xs font-bold text-navy-700 mb-2">📊 سابقه معدل:</p>
                              <div className="flex flex-wrap gap-3">
                                {gpaHistory.map((h, i) => (
                                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-blue-100">
                                    <span className="text-[10px] text-navy-500">{h.semester}</span>
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getGpaColor(h.gpa)}`}>{h.gpa}</span>
                                  </div>
                                ))}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-800 text-white rounded-lg">
                                  <span className="text-[10px]">{selectedSemester} (فعلی)</span>
                                  <span className="text-xs font-bold">{student.gpa}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-navy-300 mx-auto mb-3" />
            <p className="text-navy-400 text-sm">دانشجویی یافت نشد</p>
          </div>
        )}
      </motion.div>

      {/* Session Registration Modal */}
      <Modal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)}
        title={selectedStudent ? `ثبت جلسه - ${selectedStudent.firstName} ${selectedStudent.lastName}` : 'ثبت جلسه'}>
        {selectedStudent && (
          <form onSubmit={handleSubmitSession} className="space-y-5">
            <div className="bg-navy-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-sm font-bold">
                {selectedStudent.firstName[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-navy-800">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p className="text-xs text-navy-500">جلسات تا کنون: <span className="font-bold text-navy-700">{selectedStudent.totalSessions.toLocaleString('fa-IR')}</span></p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-blue-700">ثبت جلسه {(selectedStudent.totalSessions + 1).toLocaleString('fa-IR')}</p>
            </div>

            <PersianDatePicker value={sessionDate} onChange={setSessionDate} label="تاریخ جلسه" required />

            <div>
              <label className="block text-xs font-bold text-navy-700 mb-2">
                موضوع جلسه <span className="text-red-500">*</span>
                <span className="text-[10px] text-navy-400 mr-1">(چند انتخابی)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sessionTopics.map(topic => (
                  <button key={topic} type="button" onClick={() => toggleTopic(topic)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-right text-xs font-medium transition-all ${
                      selectedTopics.includes(topic) ? 'border-navy-600 bg-navy-50 text-navy-800 shadow-sm' : 'border-navy-100 bg-white text-navy-600 hover:border-navy-300'
                    }`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                      selectedTopics.includes(topic) ? 'bg-navy-700 text-white' : 'border border-navy-300'
                    }`}>
                      {selectedTopics.includes(topic) && <CheckCircle className="w-3 h-3" />}
                    </div>
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-700 mb-2 flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-purple-600" /> ارجاع
                <span className="text-[10px] text-navy-400">(چند انتخابی - اختیاری)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {referralOptions.map(ref => (
                  <button key={ref.value} type="button" onClick={() => toggleReferral(ref.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-right transition-all ${
                      selectedReferrals.includes(ref.value) ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-navy-100 bg-white hover:border-navy-300'
                    }`}>
                    <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ref.color} flex items-center justify-center text-sm flex-shrink-0`}>{ref.icon}</span>
                    <span className={`text-xs font-bold ${selectedReferrals.includes(ref.value) ? 'text-purple-700' : 'text-navy-700'}`}>{ref.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-700 mb-1.5">یادداشت (اختیاری)</label>
              <textarea value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} rows={3}
                placeholder="توضیحات تکمیلی..." className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 resize-none" />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
              <button type="button" onClick={() => setShowSessionModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-navy-600 hover:bg-navy-100">انصراف</button>
              <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-sm font-bold shadow-lg">ثبت اطلاعات</motion.button>
            </div>
          </form>
        )}
      </Modal>

      {/* Session History Modal */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)}
        title={selectedStudent ? `گزارش جلسات - ${selectedStudent.firstName} ${selectedStudent.lastName}` : 'گزارش جلسات'}>
        {selectedStudent && (
          <div className="space-y-4">
            {/* Student Info */}
            <div className="bg-navy-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-sm font-bold">
                  {selectedStudent.firstName[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-800">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                  <p className="text-xs text-navy-500">شماره دانشجویی: {selectedStudent.studentNumber}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-2xl font-extrabold text-navy-800">{selectedStudent.totalSessions.toLocaleString('fa-IR')}</p>
                <p className="text-[10px] text-navy-500">کل جلسات</p>
              </div>
            </div>

            {/* Sessions List */}
            {selectedStudent.sessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-navy-300 mx-auto mb-2" />
                <p className="text-navy-400 text-sm">هنوز جلسه‌ای ثبت نشده</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {selectedStudent.sessions.map((session, idx) => (
                  <motion.div key={session.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border border-navy-100 rounded-xl p-4 hover:shadow-md transition-all">
                    {/* Session Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                          {(idx + 1).toLocaleString('fa-IR')}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-navy-800">جلسه {(idx + 1).toLocaleString('fa-IR')}</p>
                          <p className="text-[10px] text-navy-400">{session.date} - ساعت {session.time}</p>
                        </div>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-navy-500 mb-1.5">📋 موضوعات:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {session.type.split('، ').map((topic, i) => (
                          <span key={i} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-medium">{topic}</span>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {session.notes && (
                      <div className="mb-3">
                        <p className="text-[10px] font-bold text-navy-500 mb-1">📝 یادداشت:</p>
                        <p className="text-xs text-navy-600 bg-navy-50 rounded-lg p-2">{session.notes}</p>
                      </div>
                    )}

                    {/* Referrals */}
                    {session.referrals.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-navy-500 mb-1.5">🔄 ارجاعات:</p>
                        <div className="space-y-2">
                          {session.referrals.map(ref => (
                            <div key={ref.id} className="bg-purple-50 border border-purple-100 rounded-lg p-2.5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-purple-700">← {ref.target}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getReferralStatusBadge(ref.status)}`}>
                                  {getReferralStatusLabel(ref.status)}
                                </span>
                              </div>
                              <p className="text-[10px] text-navy-600">{ref.reason}</p>
                              <div className="flex gap-3 mt-1">
                                <span className="text-[10px] text-navy-400">📅 تاریخ ارجاع: {ref.date}</span>
                                {ref.confirmedDate && (
                                  <span className="text-[10px] text-emerald-600">✅ تاریخ تأیید: {ref.confirmedDate}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-navy-100">
              <button onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-navy-600 hover:bg-navy-100 flex items-center gap-1">
                <X className="w-4 h-4" /> بستن
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
