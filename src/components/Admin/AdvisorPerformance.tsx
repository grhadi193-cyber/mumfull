import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Award, TrendingUp, AlertTriangle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AdvisorPerformance() {
  const { students, advisors, appointments } = useData();

  const performance = useMemo(() => {
    return advisors.map(a => {
      const myStudents = students.filter(s => s.advisorId === a.id);
      const totalSessions = myStudents.reduce((sum, s) => sum + s.totalSessions, 0);
      const avgGpa = myStudents.length > 0 ? myStudents.reduce((sum, s) => sum + s.gpa, 0) / myStudents.length : 0;
      const myAppointments = appointments.filter(ap => ap.advisorId === a.id);
      const approved = myAppointments.filter(ap => ap.status === 'approved').length;
      return {
        id: a.id,
        name: `دکتر ${a.firstName} ${a.lastName}`,
        shortName: `دکتر ${a.lastName}`,
        studentCount: myStudents.length,
        totalSessions,
        avgGpa: Math.round(avgGpa * 10) / 10,
        appointmentCount: myAppointments.length,
        approvedCount: approved,
        specialty: a.specialty || '-',
      };
    }).sort((a, b) => b.totalSessions - a.totalSessions);
  }, [advisors, students, appointments]);

  const noAdvisorStudents = useMemo(() => students.filter(s => !s.advisorId || !advisors.find(a => a.id === s.advisorId)), [students, advisors]);

  const chartData = performance.map(p => ({ name: p.shortName, جلسات: p.totalSessions, دانشجو: p.studentCount, معدل: p.avgGpa }));

  const exportReport = () => {
    const data = performance.map((p, i) => ({
      'رتبه': i + 1,
      'نام مشاور': p.name,
      'تخصص': p.specialty,
      'تعداد دانشجو': p.studentCount,
      'تعداد جلسات': p.totalSessions,
      'میانگین معدل': p.avgGpa,
      'تعداد نوبت': p.appointmentCount,
      'نوبت تأیید شده': p.approvedCount,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Performance');
    XLSX.writeFile(wb, 'advisor_performance.xlsx');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            گزارش عملکرد مشاوران
          </h2>
          <p className="text-sm text-navy-500 mt-0.5">مقایسه و رتبه‌بندی عملکرد مشاوران</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={exportReport}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-colors">
          <Download className="w-3.5 h-3.5" /> خروجی اکسل
        </motion.button>
      </motion.div>

      {/* Warning for students without advisor */}
      {noAdvisorStudents.length > 0 && (
        <motion.div variants={item} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">{noAdvisorStudents.length} دانشجو بدون مشاور</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {noAdvisorStudents.map(s => `${s.firstName} ${s.lastName}`).join('، ')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
          <h3 className="font-bold text-navy-800 mb-4">مقایسه جلسات و دانشجویان</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Vazirmatn' }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Vazirmatn', fontSize: 12 }} />
              <Bar dataKey="جلسات" fill="#1e293b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="دانشجو" fill="#94a3b8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
          <h3 className="font-bold text-navy-800 mb-4">میانگین معدل دانشجویان</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Vazirmatn' }} />
              <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Vazirmatn', fontSize: 12 }} />
              <Line type="monotone" dataKey="معدل" stroke="#1e293b" strokeWidth={3} dot={{ r: 6, fill: '#1e293b' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Rankings Table */}
      <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-navy-800">جدول رتبه‌بندی مشاوران</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs">رتبه</th>
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs">نام مشاور</th>
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs">تخصص</th>
                <th className="px-4 py-3 text-center font-bold text-navy-700 text-xs">تعداد دانشجو</th>
                <th className="px-4 py-3 text-center font-bold text-navy-700 text-xs">تعداد جلسات</th>
                <th className="px-4 py-3 text-center font-bold text-navy-700 text-xs">میانگین معدل</th>
                <th className="px-4 py-3 text-center font-bold text-navy-700 text-xs">نوبت‌ها</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((p, i) => (
                <tr key={p.id} className="border-b border-navy-50 hover:bg-navy-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-navy-200 text-navy-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-navy-100 text-navy-500'
                    }`}>
                      {(i + 1).toLocaleString('fa-IR')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-navy-800">{p.name}</td>
                  <td className="px-4 py-3 text-navy-500 text-xs">{p.specialty}</td>
                  <td className="px-4 py-3 text-center font-bold text-navy-700">{p.studentCount.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2.5 py-1 rounded-lg bg-navy-100 text-navy-700 text-xs font-bold">{p.totalSessions.toLocaleString('fa-IR')}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      p.avgGpa >= 17 ? 'bg-emerald-100 text-emerald-700' : p.avgGpa >= 14 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {p.avgGpa > 0 ? p.avgGpa : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-navy-600 text-xs">
                    {p.approvedCount.toLocaleString('fa-IR')} / {p.appointmentCount.toLocaleString('fa-IR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
