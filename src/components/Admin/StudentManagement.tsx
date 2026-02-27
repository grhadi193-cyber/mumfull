import { useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/Shared/Modal';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Upload, Download, Filter, X, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

interface StudentForm {
  firstName: string; lastName: string; studentNumber: string; username: string;
  password: string; gpa: string; phoneNumber: string; advisorId: string;
  advisorName: string; semester: string;
}

const emptyForm: StudentForm = {
  firstName: '', lastName: '', studentNumber: '', username: '', password: '123456',
  gpa: '', phoneNumber: '', advisorId: '', advisorName: '', semester: '1404-1',
};

export default function StudentManagement() {
  const { students, advisors, addStudent, updateStudent, deleteStudent, importStudents } = useData();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [filterAdvisor, setFilterAdvisor] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchSearch = !search || `${s.firstName} ${s.lastName} ${s.studentNumber}`.includes(search);
      const matchAdvisor = !filterAdvisor || s.advisorId === filterAdvisor;
      const matchSemester = !filterSemester || s.semester === filterSemester;
      return matchSearch && matchAdvisor && matchSemester;
    });
  }, [students, search, filterAdvisor, filterSemester]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const semesters = [...new Set(students.map(s => s.semester))];

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowAddModal(true); };
  const openEdit = (s: typeof students[0]) => {
    setForm({
      firstName: s.firstName, lastName: s.lastName, studentNumber: s.studentNumber,
      username: s.username, password: s.password, gpa: String(s.gpa), phoneNumber: s.phoneNumber,
      advisorId: s.advisorId, advisorName: s.advisorName, semester: s.semester,
    });
    setEditingId(s.id);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.studentNumber) {
      showToast('لطفاً فیلدهای ضروری را پر کنید', 'warning'); return;
    }
    const advisor = advisors.find(a => a.id === form.advisorId);
    const data = {
      ...form,
      username: form.username || form.studentNumber,
      gpa: parseFloat(form.gpa) || 0,
      advisorName: advisor ? `دکتر ${advisor.firstName} ${advisor.lastName}` : form.advisorName,
    };

    if (editingId) {
      updateStudent(editingId, data);
      showToast('اطلاعات دانشجو بروزرسانی شد', 'success');
    } else {
      addStudent(data);
      showToast('دانشجو با موفقیت اضافه شد', 'success');
    }
    setShowAddModal(false);
  };

  const handleDelete = useCallback(() => {
    if (deleteTarget) {
      deleteStudent(deleteTarget);
      showToast('دانشجو با موفقیت حذف شد', 'success');
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteStudent, showToast]);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
        const newStudents = data.map(row => ({
          firstName: row['نام'] || row['firstName'] || '',
          lastName: row['نام خانوادگی'] || row['lastName'] || '',
          studentNumber: row['شماره دانشجویی'] || row['studentNumber'] || '',
          username: row['شماره دانشجویی'] || row['studentNumber'] || '',
          password: row['رمز عبور'] || row['password'] || '123456',
          gpa: parseFloat(row['معدل'] || row['gpa'] || '0'),
          phoneNumber: row['تلفن'] || row['phoneNumber'] || '',
          advisorId: row['شناسه مشاور'] || row['advisorId'] || '',
          advisorName: row['نام مشاور'] || row['advisorName'] || '',
          semester: row['ترم'] || row['semester'] || '1404-1',
        }));
        importStudents(newStudents);
        showToast(`${newStudents.length} دانشجو با موفقیت وارد شد`, 'success');
      } catch {
        showToast('خطا در خواندن فایل اکسل', 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const template = [
      { 'نام': 'علی', 'نام خانوادگی': 'احمدی', 'شماره دانشجویی': '9912350', 'معدل': '17.5', 'تلفن': '09121234567', 'شناسه مشاور': 'advisor1', 'نام مشاور': 'دکتر محمد رضایی', 'ترم': '1404-1', 'رمز عبور': '123456' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_template.xlsx');
    showToast('قالب اکسل دانلود شد', 'info');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
            <Users className="w-6 h-6" />
            مدیریت دانشجویان
          </h2>
          <p className="text-sm text-navy-500 mt-0.5">{students.length} دانشجو ثبت شده</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-100 text-navy-700 text-xs font-medium hover:bg-navy-200 transition-colors">
            <Download className="w-3.5 h-3.5" /> قالب اکسل
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-colors">
            <Upload className="w-3.5 h-3.5" /> آپلود اکسل
          </motion.button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-xs font-bold shadow-lg shadow-navy-900/20 hover:shadow-xl transition-shadow">
            <Plus className="w-4 h-4" /> افزودن دانشجو
          </motion.button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 bg-white rounded-2xl p-4 shadow-sm border border-navy-100">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="جستجوی نام یا شماره دانشجویی..."
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400 transition-all"
          />
          {search && <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-navy-400" /></button>}
        </div>
        <select value={filterAdvisor} onChange={e => { setFilterAdvisor(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-navy-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20">
          <option value="">همه مشاوران</option>
          {advisors.map(a => <option key={a.id} value={a.id}>دکتر {a.lastName}</option>)}
        </select>
        <select value={filterSemester} onChange={e => { setFilterSemester(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-navy-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20">
          <option value="">همه ترم‌ها</option>
          {semesters.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterAdvisor || filterSemester) && (
          <button onClick={() => { setSearch(''); setFilterAdvisor(''); setFilterSemester(''); setPage(1); }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors">
            <Filter className="w-3.5 h-3.5" /> پاک کردن فیلتر
          </button>
        )}
      </motion.div>

      {/* Table */}
      <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs">ردیف</th>
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs">نام و نام خانوادگی</th>
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs">شماره دانشجویی</th>
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs">معدل</th>
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs">مشاور</th>
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs">ترم</th>
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs">جلسات</th>
                <th className="px-4 py-3 text-right font-bold text-navy-700 text-xs">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-navy-50 hover:bg-navy-50/50 transition-colors"
                >
                  <td className="px-4 py-3 text-navy-500">{((page - 1) * perPage + i + 1).toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {s.firstName[0]}
                      </div>
                      <span className="font-bold text-navy-800">{s.firstName} {s.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-600 font-mono text-xs">{s.studentNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                      s.gpa >= 17 ? 'bg-emerald-100 text-emerald-700' : s.gpa >= 14 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {s.gpa.toLocaleString('fa-IR')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-600 text-xs">{s.advisorName || '-'}</td>
                  <td className="px-4 py-3 text-navy-500 text-xs">{s.semester}</td>
                  <td className="px-4 py-3 text-navy-600 text-center font-bold">{s.totalSessions.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="ویرایش">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="حذف">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-navy-400 text-sm">دانشجویی یافت نشد</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy-100">
            <p className="text-xs text-navy-500">نمایش {((page - 1) * perPage + 1).toLocaleString('fa-IR')} تا {Math.min(page * perPage, filtered.length).toLocaleString('fa-IR')} از {filtered.length.toLocaleString('fa-IR')}</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === i + 1 ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-100'}`}>
                  {(i + 1).toLocaleString('fa-IR')}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editingId ? 'ویرایش دانشجو' : 'افزودن دانشجو'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">نام *</label>
              <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">نام خانوادگی *</label>
              <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">شماره دانشجویی *</label>
              <input value={form.studentNumber} onChange={e => setForm({ ...form, studentNumber: e.target.value, username: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">رمز عبور</label>
              <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">معدل</label>
              <input type="number" step="0.01" min="0" max="20" value={form.gpa} onChange={e => setForm({ ...form, gpa: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">شماره تلفن</label>
              <input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">مشاور</label>
              <select value={form.advisorId} onChange={e => setForm({ ...form, advisorId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400">
                <option value="">انتخاب مشاور</option>
                {advisors.map(a => <option key={a.id} value={a.id}>دکتر {a.firstName} {a.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1">ترم</label>
              <input value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-navy-100">
            <button type="button" onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-sm text-navy-600 hover:bg-navy-100 transition-colors">انصراف</button>
            <button type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-shadow">
              {editingId ? 'بروزرسانی' : 'افزودن'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف دانشجو"
        message="آیا از حذف این دانشجو اطمینان دارید؟ تمام اطلاعات و نوبت‌های مرتبط نیز حذف خواهد شد."
        confirmText="حذف"
      />
    </motion.div>
  );
}
