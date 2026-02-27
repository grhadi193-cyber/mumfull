import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import {
  BarChart3, Users, Calendar, Clock, Download,
  BookOpen, AlertTriangle, TrendingUp
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const semesters = ['1404-1', '1404-2', '1403-1', '1403-2', '1402-1', '1402-2'];

const noSessionFilters = [
  { label: 'عموم دانشجویان', value: 'all' },
  { label: 'دانشجویان در معرض افت', value: 'at_risk' },
  { label: 'دانشجویان معدل پایین', value: 'low_gpa' },
  { label: 'دانشجویان مشروطی', value: 'probation' },
];

// All possible session topics are tracked dynamically from student data

export default function AdvisorPerformanceReport() {
  const { user } = useAuth();
  const { getStudentsByAdvisor, getAppointmentsByAdvisor } = useData();
  const { showToast } = useToast();

  const [selectedSemester, setSelectedSemester] = useState('1404-1');
  const [noSessionFilter, setNoSessionFilter] = useState('all');

  const myStudents = useMemo(() => user ? getStudentsByAdvisor(user.id) : [], [user, getStudentsByAdvisor]);
  const myAppointments = useMemo(() => user ? getAppointmentsByAdvisor(user.id) : [], [user, getAppointmentsByAdvisor]);

  // Stats
  const totalStudents = myStudents.length;
  const totalSessions = myStudents.reduce((sum, s) => sum + s.totalSessions, 0);
  const pendingAppointments = myAppointments.filter(a => a.status === 'pending').length;

  // Students without sessions based on filter
  const studentsWithNoSessions = useMemo(() => {
    let filtered = myStudents.filter(s => s.totalSessions === 0);
    switch (noSessionFilter) {
      case 'at_risk':
        filtered = myStudents.filter(s => s.totalSessions === 0 && s.gpa < 14);
        break;
      case 'low_gpa':
        filtered = myStudents.filter(s => s.totalSessions === 0 && s.gpa < 14);
        break;
      case 'probation':
        filtered = myStudents.filter(s => s.totalSessions === 0 && s.gpa < 12);
        break;
    }
    return filtered;
  }, [myStudents, noSessionFilter]);

  // Topic distribution chart
  const topicDistribution = useMemo(() => {
    const topicCounts: Record<string, number> = {};
    myStudents.forEach(student => {
      student.sessions.forEach(session => {
        // Handle multi-topic sessions
        const topics = session.type.split('، ');
        topics.forEach(topic => {
          const trimmed = topic.trim();
          if (trimmed) {
            topicCounts[trimmed] = (topicCounts[trimmed] || 0) + 1;
          }
        });
      });
    });
    return topicCounts;
  }, [myStudents]);

  // Chart: Sessions per student
  const sessionsChartData = useMemo(() => ({
    labels: myStudents.map(s => `${s.firstName} ${s.lastName}`),
    datasets: [{
      label: 'تعداد جلسات',
      data: myStudents.map(s => s.totalSessions),
      backgroundColor: 'rgba(30, 41, 59, 0.7)',
      borderColor: '#1e293b',
      borderWidth: 1,
      borderRadius: 8,
    }],
  }), [myStudents]);

  // Chart: Topic distribution (Pie)
  const topicChartData = useMemo(() => {
    const topics = Object.keys(topicDistribution);
    const counts = Object.values(topicDistribution);
    const colors = [
      '#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16',
      '#6366f1', '#14b8a6', '#e11d48', '#a855f7',
    ];
    return {
      labels: topics,
      datasets: [{
        data: counts,
        backgroundColor: colors.slice(0, topics.length),
        borderWidth: 2,
        borderColor: '#fff',
      }],
    };
  }, [topicDistribution]);

  // Chart: Mock evaluation scores
  const evaluationChartData = useMemo(() => ({
    labels: ['کیفیت مشاوره', 'وقت‌شناسی', 'توجه به مشکلات', 'راهنمایی مناسب', 'دسترسی‌پذیری'],
    datasets: [{
      label: 'امتیاز ارزشیابی (از ۵)',
      data: [4.2, 4.5, 3.8, 4.1, 3.9],
      backgroundColor: [
        'rgba(59, 130, 246, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(139, 92, 246, 0.7)',
        'rgba(236, 72, 153, 0.7)',
      ],
      borderColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
      ],
      borderWidth: 1,
      borderRadius: 8,
    }],
  }), []);

  // Export to Excel
  const exportReport = () => {
    const summaryData = [
      { 'شاخص': 'نیمسال', 'مقدار': selectedSemester },
      { 'شاخص': 'تعداد کل دانشجویان', 'مقدار': totalStudents },
      { 'شاخص': 'تعداد کل جلسات', 'مقدار': totalSessions },
      { 'شاخص': 'نوبت‌های در انتظار', 'مقدار': pendingAppointments },
      { 'شاخص': 'جلسات برگزار نشده', 'مقدار': studentsWithNoSessions.length },
    ];

    const studentData = myStudents.map(s => ({
      'نام و نام خانوادگی': `${s.firstName} ${s.lastName}`,
      'شماره دانشجویی': s.studentNumber,
      'معدل': s.gpa,
      'تعداد جلسات': s.totalSessions,
    }));

    const topicData = Object.entries(topicDistribution).map(([topic, count]) => ({
      'موضوع': topic,
      'تعداد': count,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'خلاصه گزارش');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentData), 'دانشجویان');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topicData), 'موضوعات جلسات');
    XLSX.writeFile(wb, `performance_report_${selectedSemester}.xlsx`);
    showToast('گزارش اکسل با موفقیت دانلود شد', 'success');
  };

  const statCards = [
    { label: 'تعداد کل دانشجویان', value: totalStudents, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'تعداد کل جلسات برگزار شده', value: totalSessions, icon: BookOpen, color: 'from-emerald-500 to-emerald-600' },
    { label: 'نوبت‌های در انتظار تأیید', value: pendingAppointments, icon: Clock, color: 'from-amber-500 to-amber-600' },
    { label: 'جلسات برگزار نشده', value: studentsWithNoSessions.length, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            گزارش عملکرد
          </h2>
          <p className="text-sm text-navy-500 mt-0.5">خلاصه عملکرد مشاوره‌ای شما</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Semester Select */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-navy-600 whitespace-nowrap">نیمسال:</label>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="px-3 py-2 rounded-xl border border-navy-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20"
            >
              {semesters.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportReport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-700 text-white text-xs font-bold shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            خروجی اکسل
          </motion.button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={i} variants={item} whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-navy-800">{card.value.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-navy-500 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* No Sessions Filter */}
      <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-navy-700">دانشجویان بدون جلسه:</span>
          <div className="flex flex-wrap gap-1.5">
            {noSessionFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setNoSessionFilter(f.value)}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  noSessionFilter === f.value
                    ? 'bg-red-600 text-white'
                    : 'text-navy-600 hover:bg-navy-100 bg-navy-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {studentsWithNoSessions.length > 0 ? (
          <div className="space-y-2">
            {studentsWithNoSessions.map(student => (
              <div key={student.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50/50 border border-red-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {student.firstName[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-navy-800">{student.firstName} {student.lastName}</p>
                  <p className="text-[11px] text-navy-500">{student.studentNumber} • معدل: {student.gpa}</p>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 text-[10px] font-bold">بدون جلسه</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-navy-400 text-sm py-3">همه دانشجویان حداقل یک جلسه داشته‌اند ✅</p>
        )}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart: Sessions per Student */}
        <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-navy-600" />
            <h3 className="font-bold text-navy-800">تعداد دانشجو و جلسات برگزار شده</h3>
          </div>
          <div className="h-64">
            <Bar
              data={sessionsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { titleFont: { family: 'Vazirmatn' }, bodyFont: { family: 'Vazirmatn' } },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { font: { family: 'Vazirmatn', size: 10 }, stepSize: 1 },
                  },
                  x: {
                    ticks: { font: { family: 'Vazirmatn', size: 10 } },
                  },
                },
              }}
            />
          </div>
        </motion.div>

        {/* Chart: Evaluation */}
        <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-navy-600" />
            <h3 className="font-bold text-navy-800">پرسشنامه ارزشیابی دانشجویان</h3>
          </div>
          <div className="h-64">
            <Bar
              data={evaluationChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y' as const,
                plugins: {
                  legend: { display: false },
                  tooltip: { titleFont: { family: 'Vazirmatn' }, bodyFont: { family: 'Vazirmatn' } },
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    max: 5,
                    ticks: { font: { family: 'Vazirmatn', size: 10 } },
                  },
                  y: {
                    ticks: { font: { family: 'Vazirmatn', size: 10 } },
                  },
                },
              }}
            />
          </div>
          <p className="text-[10px] text-navy-400 mt-2 text-center">
            بر اساس نظرسنجی دانشجویان - میانگین از ۵
          </p>
        </motion.div>

        {/* Chart: Topic Distribution */}
        <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-navy-600" />
            <h3 className="font-bold text-navy-800">توزیع موضوعات جلسات</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-64 flex items-center justify-center">
              {Object.keys(topicDistribution).length > 0 ? (
                <Doughnut
                  data={topicChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { font: { family: 'Vazirmatn', size: 10 }, padding: 12 },
                      },
                      tooltip: { titleFont: { family: 'Vazirmatn' }, bodyFont: { family: 'Vazirmatn' } },
                    },
                  }}
                />
              ) : (
                <p className="text-navy-400 text-sm">داده‌ای موجود نیست</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-navy-700 mb-3">جزئیات موضوعات:</p>
              {Object.entries(topicDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([topic, count], i) => {
                  const total = Object.values(topicDistribution).reduce((s, v) => s + v, 0);
                  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={topic} className="flex items-center gap-2">
                      <span className="text-[10px] text-navy-500 w-4">{(i + 1).toLocaleString('fa-IR')}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-bold text-navy-700">{topic}</span>
                          <span className="text-[10px] text-navy-500">{count.toLocaleString('fa-IR')} جلسه ({percent}٪)</span>
                        </div>
                        <div className="w-full h-1.5 bg-navy-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className="h-full bg-gradient-to-l from-navy-600 to-navy-800 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
