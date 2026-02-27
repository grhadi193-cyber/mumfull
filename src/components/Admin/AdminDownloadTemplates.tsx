import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { Download, Users, UserCog, Calendar, FileSpreadsheet, Archive } from 'lucide-react';
import * as XLSX from 'xlsx';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AdminDownloadTemplates() {
  const { students, advisors, appointments } = useData();
  const { showToast } = useToast();

  const downloadStudents = () => {
    const data = students.map(s => ({
      'نام': s.firstName,
      'نام خانوادگی': s.lastName,
      'شماره دانشجویی': s.studentNumber,
      'شماره تماس': s.phoneNumber,
      'معدل': s.gpa,
      'نیمسال': s.semester,
      'استاد مشاور': s.advisorName,
      'تعداد جلسات': s.totalSessions,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'دانشجویان');
    XLSX.writeFile(wb, 'لیست_دانشجویان.xlsx');
    showToast('فایل لیست دانشجویان دانلود شد', 'success');
  };

  const downloadAdvisors = () => {
    const data = advisors.map(a => {
      const myStudents = students.filter(s => s.advisorId === a.id);
      const totalSessions = myStudents.reduce((sum, s) => sum + s.totalSessions, 0);
      return {
        'نام': a.firstName,
        'نام خانوادگی': a.lastName,
        'نام کاربری': a.username,
        'تعداد دانشجو': myStudents.length,
        'تعداد جلسات': totalSessions,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'مشاوران');
    XLSX.writeFile(wb, 'لیست_مشاوران.xlsx');
    showToast('فایل لیست مشاوران دانلود شد', 'success');
  };

  const downloadAppointments = () => {
    const data = appointments.map(apt => {
      const student = students.find(s => s.id === apt.studentId);
      const advisor = advisors.find(a => a.id === apt.advisorId);
      return {
        'دانشجو': student ? `${student.firstName} ${student.lastName}` : '-',
        'شماره دانشجویی': student?.studentNumber || '-',
        'استاد مشاور': advisor ? `دکتر ${advisor.firstName} ${advisor.lastName}` : '-',
        'تاریخ': apt.date,
        'ساعت': apt.time,
        'نوع': apt.appointmentType?.label || '-',
        'وضعیت': apt.status === 'pending' ? 'در انتظار' : apt.status === 'approved' ? 'تأیید شده' : 'رد شده',
        'توضیحات': apt.description || '-',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'نوبت‌ها');
    XLSX.writeFile(wb, 'لیست_نوبت‌ها.xlsx');
    showToast('فایل لیست نوبت‌ها دانلود شد', 'success');
  };

  const downloadSessions = () => {
    const data: any[] = [];
    students.forEach(s => {
      (s.sessions || []).forEach(session => {
        data.push({
          'دانشجو': `${s.firstName} ${s.lastName}`,
          'شماره دانشجویی': s.studentNumber,
          'استاد مشاور': s.advisorName,
          'تاریخ جلسه': session.date,
          'ساعت': session.time,
          'موضوع': session.type,
          'یادداشت': session.notes,
          'ارجاعات': (session.referrals || []).map((r: any) => r.target || r).join('، '),
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'جلسات');
    XLSX.writeFile(wb, 'گزارش_جلسات.xlsx');
    showToast('فایل گزارش جلسات دانلود شد', 'success');
  };

  const downloadAll = () => {
    const wb = XLSX.utils.book_new();

    // Students
    const studentData = students.map(s => ({
      'نام': s.firstName, 'نام خانوادگی': s.lastName, 'شماره دانشجویی': s.studentNumber,
      'شماره تماس': s.phoneNumber, 'معدل': s.gpa, 'نیمسال': s.semester,
      'استاد مشاور': s.advisorName, 'تعداد جلسات': s.totalSessions,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentData), 'دانشجویان');

    // Advisors
    const advisorData = advisors.map(a => ({
      'نام': a.firstName, 'نام خانوادگی': a.lastName, 'نام کاربری': a.username,
      'تعداد دانشجو': students.filter(s => s.advisorId === a.id).length,
      'تعداد جلسات': students.filter(s => s.advisorId === a.id).reduce((sum, s) => sum + s.totalSessions, 0),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(advisorData), 'مشاوران');

    // Appointments
    const aptData = appointments.map(apt => {
      const student = students.find(s => s.id === apt.studentId);
      const advisor = advisors.find(a => a.id === apt.advisorId);
      return {
        'دانشجو': student ? `${student.firstName} ${student.lastName}` : '-',
        'استاد مشاور': advisor ? `دکتر ${advisor.firstName} ${advisor.lastName}` : '-',
        'تاریخ': apt.date, 'ساعت': apt.time, 'وضعیت': apt.status === 'pending' ? 'در انتظار' : apt.status === 'approved' ? 'تأیید شده' : 'رد شده',
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(aptData), 'نوبت‌ها');

    // Sessions
    const sessionData: any[] = [];
    students.forEach(s => {
      (s.sessions || []).forEach(session => {
        sessionData.push({
          'دانشجو': `${s.firstName} ${s.lastName}`, 'شماره دانشجویی': s.studentNumber,
          'تاریخ': session.date, 'موضوع': session.type, 'یادداشت': session.notes,
        });
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessionData), 'جلسات');

    XLSX.writeFile(wb, 'گزارش_جامع.xlsx');
    showToast('فایل گزارش جامع دانلود شد', 'success');
  };

  const templates = [
    {
      title: 'لیست دانشجویان',
      description: 'شامل نام، شماره دانشجویی، شماره تماس، معدل، استاد مشاور و تعداد جلسات',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      count: `${students.length} دانشجو`,
      onClick: downloadStudents,
    },
    {
      title: 'لیست مشاوران',
      description: 'شامل نام، نام کاربری، تعداد دانشجو و تعداد جلسات برگزار شده',
      icon: UserCog,
      color: 'from-purple-500 to-purple-600',
      count: `${advisors.length} مشاور`,
      onClick: downloadAdvisors,
    },
    {
      title: 'لیست نوبت‌ها',
      description: 'شامل نام دانشجو، استاد مشاور، تاریخ، ساعت، نوع نوبت و وضعیت',
      icon: Calendar,
      color: 'from-emerald-500 to-emerald-600',
      count: `${appointments.length} نوبت`,
      onClick: downloadAppointments,
    },
    {
      title: 'گزارش جلسات',
      description: 'شامل تمام جلسات برگزار شده با جزئیات موضوع، تاریخ و ارجاعات',
      icon: FileSpreadsheet,
      color: 'from-amber-500 to-amber-600',
      count: `${students.reduce((s, st) => s + st.totalSessions, 0)} جلسه`,
      onClick: downloadSessions,
    },
    {
      title: 'گزارش جامع (همه در یک فایل)',
      description: 'شامل تمام اطلاعات دانشجویان، مشاوران، نوبت‌ها و جلسات در یک فایل اکسل با چند شیت',
      icon: Archive,
      color: 'from-navy-700 to-navy-900',
      count: 'همه داده‌ها',
      onClick: downloadAll,
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item}>
        <h2 className="text-xl font-extrabold text-navy-800">دانلود قالب</h2>
        <p className="text-sm text-navy-500 mt-1">خروجی اکسل از تمام اطلاعات سامانه</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t, i) => (
          <motion.div
            key={i}
            variants={item}
            whileHover={{ scale: 1.01, y: -2 }}
            className={`bg-white rounded-2xl p-5 shadow-sm border border-navy-100 hover:shadow-md transition-all ${
              i === templates.length - 1 ? 'md:col-span-2' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <t.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-navy-800 text-sm">{t.title}</h3>
                <p className="text-xs text-navy-500 mt-1 leading-relaxed">{t.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-navy-400 bg-navy-50 px-2.5 py-1 rounded-lg">{t.count}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={t.onClick}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l ${t.color} text-white text-xs font-bold shadow-lg`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    دانلود اکسل
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
