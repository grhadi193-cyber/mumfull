import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Award, Download, Star, BookOpen } from 'lucide-react';
import * as XLSX from 'xlsx';

const FACULTIES = [
  { label: 'بهداشت', value: 'health' },
  { label: 'پزشکی', value: 'medicine' },
  { label: 'پیراپزشکی', value: 'paramedical' },
  { label: 'پرستاری مامایی', value: 'nursing' },
  { label: 'داروسازی', value: 'pharmacy' },
  { label: 'دندانپزشکی', value: 'dentistry' },
];

const SESSION_TOPICS = [
  'بررسی افت تحصیلی', 'بررسی مشروطی', 'بررسی آموزشی', 'بررسی پژوهشی',
  'اعلام وضعیت روانی و خانوادگی', 'مشورت امور مالی', 'مشورت شغلی', 'سوال متفرقه',
];

const TOPIC_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const BAR_COLORS = ['#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

type FilterType = 'students_sessions' | 'evaluation' | 'topics';

export default function AdminDashboard() {
  const { students, advisors } = useData();
  const [activeFilter, setActiveFilter] = useState<FilterType>('students_sessions');

  const advisorDataList = useMemo(() => {
    return advisors.map(a => {
      const faculty = a.faculty || FACULTIES[parseInt(a.id.replace(/\D/g, '') || '0') % FACULTIES.length].value;
      const facultyLabel = FACULTIES.find(f => f.value === faculty)?.label || faculty;
      const myStudents = students.filter(s => s.advisorId === a.id);
      const totalSessions = myStudents.reduce((sum, s) => sum + (s.totalSessions || 0), 0);
      const seed = a.id.charCodeAt(a.id.length - 1);
      const evaluation = parseFloat((3 + (seed % 20) / 10).toFixed(1));
      const topics: Record<string, number> = {};
      SESSION_TOPICS.forEach((topic, i) => {
        topics[topic] = Math.max(1, Math.floor((seed * (i + 1)) % 8));
      });
      return {
        id: a.id, name: `دکتر ${a.firstName} ${a.lastName}`,
        faculty, facultyLabel,
        studentCount: myStudents.length, sessionCount: totalSessions,
        evaluation, topics,
        score: parseFloat((totalSessions * 2 + evaluation * 10).toFixed(1)),
      };
    });
  }, [advisors, students]);

  const facultyGroups = useMemo(() => {
    return FACULTIES.map(f => ({
      ...f,
      advisors: advisorDataList.filter(a => a.faculty === f.value),
    })).filter(fg => fg.advisors.length > 0);
  }, [advisorDataList]);

  const rankings = useMemo(() => {
    return [...advisorDataList].sort((a, b) => b.score - a.score);
  }, [advisorDataList]);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      rankings.map((a, i) => ({ 'رتبه': i + 1, 'نام': a.name, 'دانشکده': a.facultyLabel, 'ارزشیابی': a.evaluation, 'جلسات': a.sessionCount, 'دانشجو': a.studentCount, 'امتیاز': a.score }))
    ), 'رتبه‌بندی');
    XLSX.writeFile(wb, 'گزارش_عملکرد.xlsx');
  };

  return (
    <div className="space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">داشبورد مدیر سیستم</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">مقایسه عملکرد مشاوران در هر دانشکده</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors">
          <Download className="w-4 h-4" /> دانلود اکسل
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveFilter('students_sessions')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeFilter === 'students_sessions' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          📊 تعداد دانشجو و جلسات
        </button>
        <button onClick={() => setActiveFilter('evaluation')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeFilter === 'evaluation' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          ⭐ ارزشیابی دانشجویان
        </button>
        <button onClick={() => setActiveFilter('topics')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeFilter === 'topics' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          📋 موضوعات جلسه
        </button>
      </div>

      {/* Faculty Cards */}
      {facultyGroups.map(faculty => (
        <div key={faculty.value + activeFilter} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-l from-slate-700 to-slate-800 px-4 sm:px-5 py-3">
            <h3 className="font-bold text-white text-sm">دانشکده {faculty.label}</h3>
            <p className="text-slate-300 text-xs">{faculty.advisors.length} استاد مشاور</p>
          </div>

          <div className="p-3 sm:p-5">
            {/* ===== FILTER: STUDENTS & SESSIONS ===== */}
            {activeFilter === 'students_sessions' && (
              <div className="space-y-4">
                {faculty.advisors.map((advisor, idx) => {
                  const maxS = Math.max(...faculty.advisors.map(a => a.studentCount), 1);
                  const maxJ = Math.max(...faculty.advisors.map(a => a.sessionCount), 1);
                  return (
                    <div key={advisor.id} className="space-y-2 pb-3 border-b border-dashed border-slate-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                          style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}>
                          {idx + 1}
                        </div>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">{advisor.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mr-8">
                        <span className="text-[10px] sm:text-xs text-slate-500 w-14 shrink-0">👨‍🎓 دانشجو</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                          <div className="h-full rounded-full flex items-center justify-end px-2 transition-all duration-700"
                            style={{ width: `${Math.max((advisor.studentCount / maxS) * 100, 15)}%`, backgroundColor: '#3b82f6' }}>
                            <span className="text-white text-[10px] font-bold">{advisor.studentCount} نفر</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mr-8">
                        <span className="text-[10px] sm:text-xs text-slate-500 w-14 shrink-0">📅 جلسات</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                          <div className="h-full rounded-full flex items-center justify-end px-2 transition-all duration-700"
                            style={{ width: `${Math.max((advisor.sessionCount / maxJ) * 100, 15)}%`, backgroundColor: '#10b981' }}>
                            <span className="text-white text-[10px] font-bold">{advisor.sessionCount} جلسه</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ===== FILTER: EVALUATION ===== */}
            {activeFilter === 'evaluation' && (
              <div className="space-y-4">
                {faculty.advisors.map((advisor, idx) => (
                  <div key={advisor.id} className="space-y-2 pb-3 border-b border-dashed border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}>
                        {idx + 1}
                      </div>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">{advisor.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mr-8">
                      <span className="text-[10px] sm:text-xs text-slate-500 w-14 shrink-0">⭐ امتیاز</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-7 overflow-hidden">
                        <div className="h-full rounded-full flex items-center justify-end px-2 transition-all duration-700"
                          style={{
                            width: `${(advisor.evaluation / 5) * 100}%`,
                            background: advisor.evaluation >= 4 ? 'linear-gradient(to left, #10b981, #059669)' : advisor.evaluation >= 3 ? 'linear-gradient(to left, #f59e0b, #d97706)' : 'linear-gradient(to left, #ef4444, #dc2626)',
                          }}>
                          <span className="text-white text-[10px] font-bold">{advisor.evaluation} از ۵</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 mr-8 pr-16">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(advisor.evaluation) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== FILTER: TOPICS ===== */}
            {activeFilter === 'topics' && (
              <div className="space-y-5">
                {faculty.advisors.map((advisor, idx) => {
                  const entries = Object.entries(advisor.topics).filter(([, v]) => v > 0);
                  const maxV = Math.max(...entries.map(([, v]) => v), 1);
                  return (
                    <div key={advisor.id} className="space-y-2 pb-4 border-b border-dashed border-slate-100 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                          style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}>
                          {idx + 1}
                        </div>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">{advisor.name}</span>
                        <span className="text-[10px] text-slate-400 mr-1">
                          (مجموع: {entries.reduce((s, [, v]) => s + v, 0)} مورد)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 mr-8">
                        {entries.map(([topic, count], tIdx) => (
                          <div key={topic} className="flex items-center gap-2">
                            <BookOpen className="w-3 h-3 shrink-0" style={{ color: TOPIC_COLORS[tIdx % TOPIC_COLORS.length] }} />
                            <span className="text-[10px] text-slate-600 w-28 sm:w-36 shrink-0 truncate">{topic}</span>
                            <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                              <div className="h-full rounded-full flex items-center justify-end px-1.5 transition-all duration-500"
                                style={{ width: `${(count / maxV) * 100}%`, backgroundColor: TOPIC_COLORS[tIdx % TOPIC_COLORS.length], opacity: 0.8 }}>
                                <span className="text-white text-[9px] font-bold">{count}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Rankings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-l from-amber-500 to-amber-600 px-4 sm:px-5 py-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-white" />
          <h3 className="font-bold text-white text-sm">رتبه‌بندی مشاوران</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm" style={{ minWidth: '600px' }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-right font-bold text-slate-700">رتبه</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700">نام استاد</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700">دانشکده</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700">ارزشیابی</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700">جلسات</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700">دانشجو</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700">امتیاز</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((a, i) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-slate-800">{a.name}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px]">{a.facultyLabel}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold">{a.evaluation}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold">{a.sessionCount}</span>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-slate-700">{a.studentCount}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs font-bold">{a.score}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
