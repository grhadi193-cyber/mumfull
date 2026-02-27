import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { User, Phone, GraduationCap, BookOpen, Clock, Calendar, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function StudentDashboard() {
  const { user } = useAuth();
  const { students, appointments, advisors } = useData();
  const [showGpaHistory, setShowGpaHistory] = useState(false);

  const currentStudent = useMemo(() => students.find(s => s.id === user?.id), [students, user]);
  const myAppointments = useMemo(() => appointments.filter(a => a.studentId === user?.id), [appointments, user]);
  const myAdvisor = useMemo(() => advisors.find(a => a.id === currentStudent?.advisorId), [advisors, currentStudent]);

  const pendingCount = myAppointments.filter(a => a.status === 'pending').length;
  const approvedCount = myAppointments.filter(a => a.status === 'approved').length;
  const rejectedAppointments = myAppointments.filter(a => a.status === 'rejected');

  // Mock GPA history
  const gpaHistory = [
    { semester: '۱۴۰۲-۱', gpa: 16.2 },
    { semester: '۱۴۰۲-۲', gpa: 15.8 },
    { semester: '۱۴۰۳-۱', gpa: 16.9 },
    { semester: '۱۴۰۳-۲', gpa: 17.1 },
  ];

  const getGpaColor = (gpa: number) => {
    if (gpa >= 16) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (gpa >= 14) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (!currentStudent) return null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Welcome - Only name */}
      <motion.div variants={item} className="bg-gradient-to-l from-navy-700 to-navy-900 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-extrabold">
          خوش آمدید، {currentStudent.firstName} {currentStudent.lastName}
        </h2>
        <p className="text-navy-300 text-sm mt-1">سامانه مشاوران تحصیلی - دانشگاه علوم پزشکی مشهد</p>
      </motion.div>

      {/* Personal Information */}
      <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-100 bg-navy-50/50">
          <h3 className="font-bold text-navy-800 flex items-center gap-2">
            <User className="w-5 h-5 text-navy-600" />
            اطلاعات شخصی
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Name */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-50/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white font-bold shadow-md">
                {currentStudent.firstName[0]}
              </div>
              <div>
                <p className="text-[10px] text-navy-400">نام و نام خانوادگی</p>
                <p className="text-sm font-bold text-navy-800">{currentStudent.firstName} {currentStudent.lastName}</p>
              </div>
            </div>

            {/* Student Number */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-50/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-navy-400">شماره دانشجویی</p>
                <p className="text-sm font-bold text-navy-800 font-mono">{currentStudent.studentNumber}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-50/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-navy-400">شماره تماس</p>
                <p className="text-sm font-bold text-navy-800 font-mono" dir="ltr">{currentStudent.phoneNumber}</p>
              </div>
            </div>

            {/* GPA */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-50/50">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md font-extrabold text-sm border ${getGpaColor(currentStudent.gpa)}`}>
                {currentStudent.gpa}
              </div>
              <div>
                <p className="text-[10px] text-navy-400">معدل این نیمسال</p>
                <p className={`text-sm font-bold ${currentStudent.gpa >= 16 ? 'text-emerald-700' : currentStudent.gpa >= 14 ? 'text-amber-700' : 'text-red-700'}`}>
                  {currentStudent.gpa >= 16 ? 'وضعیت عالی' : currentStudent.gpa >= 14 ? 'قابل قبول' : 'نیاز به بهبود'}
                </p>
              </div>
            </div>

            {/* Sessions */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-50/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-navy-400">تعداد جلسات برگزار شده</p>
                <p className="text-sm font-bold text-navy-800">{currentStudent.totalSessions.toLocaleString('fa-IR')} جلسه</p>
              </div>
            </div>

            {/* Advisor */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-50/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md text-xs">
                {myAdvisor?.firstName?.[0] || '؟'}
              </div>
              <div>
                <p className="text-[10px] text-navy-400">استاد مشاور</p>
                <p className="text-sm font-bold text-navy-800">
                  {myAdvisor ? `دکتر ${myAdvisor.firstName} ${myAdvisor.lastName}` : 'تعیین نشده'}
                </p>
              </div>
            </div>
          </div>

          {/* GPA History - Expandable */}
          <div className="mt-4 pt-4 border-t border-navy-100">
            <button
              onClick={() => setShowGpaHistory(!showGpaHistory)}
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              📊 سابقه معدل در هر نیمسال
              {showGpaHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {showGpaHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-3 mt-3">
                    {gpaHistory.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                        <span className="text-[11px] text-navy-500">{h.semester}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${getGpaColor(h.gpa)}`}>
                          {h.gpa}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 px-3 py-2 bg-navy-800 text-white rounded-xl">
                      <span className="text-[11px]">{currentStudent.semester} (فعلی)</span>
                      <span className="text-xs font-bold">{currentStudent.gpa}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Appointment Stats */}
          <div className="mt-4 pt-4 border-t border-navy-100">
            <p className="text-xs font-bold text-navy-600 mb-3">📅 وضعیت نوبت‌ها:</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-amber-700">{pendingCount.toLocaleString('fa-IR')}</p>
                <p className="text-[10px] text-amber-600">در انتظار</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-emerald-700">{approvedCount.toLocaleString('fa-IR')}</p>
                <p className="text-[10px] text-emerald-600">تأیید شده</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-red-700">{rejectedAppointments.length.toLocaleString('fa-IR')}</p>
                <p className="text-[10px] text-red-600">رد شده</p>
              </div>
            </div>
          </div>

          {/* Rejected Appointments with Reasons */}
          {rejectedAppointments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-navy-100">
              <p className="text-xs font-bold text-red-600 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                نوبت‌های رد شده به همراه دلیل:
              </p>
              <div className="space-y-2">
                {rejectedAppointments.map(apt => (
                  <div key={apt.id} className="p-3 rounded-xl bg-red-50/70 border border-red-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs font-bold text-red-800">{apt.date} • {apt.time}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 text-[10px] font-bold">رد شده</span>
                    </div>
                    <p className="text-[11px] text-navy-600 mb-1">{apt.appointmentType.label} - {apt.description}</p>
                    {apt.rejectionReason && (
                      <div className="mt-1.5 p-2 rounded-lg bg-red-100/50 border border-red-200">
                        <p className="text-[10px] text-red-500 font-bold mb-0.5">دلیل رد:</p>
                        <p className="text-xs text-red-700">{apt.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
