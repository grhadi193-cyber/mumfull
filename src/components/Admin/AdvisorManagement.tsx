import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/Shared/Modal';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, UserCog, Users, BookOpen } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

interface AdvisorForm {
  firstName: string; lastName: string; username: string; password: string; specialty: string;
}
const emptyForm: AdvisorForm = { firstName: '', lastName: '', username: '', password: '123456', specialty: '' };

export default function AdvisorManagement() {
  const { advisors, students, addAdvisor, updateAdvisor, deleteAdvisor } = useData();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdvisorForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return advisors.filter(a => !search || `${a.firstName} ${a.lastName}`.includes(search));
  }, [advisors, search]);

  const getAdvisorStats = (advisorId: string) => {
    const myStudents = students.filter(s => s.advisorId === advisorId);
    const totalSessions = myStudents.reduce((sum, s) => sum + s.totalSessions, 0);
    const avgGpa = myStudents.length > 0 ? myStudents.reduce((sum, s) => sum + s.gpa, 0) / myStudents.length : 0;
    return { studentCount: myStudents.length, totalSessions, avgGpa };
  };

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (a: typeof advisors[0]) => {
    setForm({ firstName: a.firstName, lastName: a.lastName, username: a.username, password: a.password, specialty: a.specialty || '' });
    setEditingId(a.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.username) {
      showToast('لطفاً فیلدهای ضروری را پر کنید', 'warning'); return;
    }
    if (editingId) {
      updateAdvisor(editingId, form);
      showToast('اطلاعات مشاور بروزرسانی شد', 'success');
    } else {
      addAdvisor(form);
      showToast('مشاور با موفقیت اضافه شد', 'success');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      const stats = getAdvisorStats(deleteTarget);
      if (stats.studentCount > 0) {
        showToast(`این مشاور ${stats.studentCount} دانشجو دارد. ابتدا دانشجویان را منتقل کنید`, 'warning');
      }
      deleteAdvisor(deleteTarget);
      showToast('مشاور حذف شد', 'success');
      setDeleteTarget(null);
    }
  };

  const deleteTargetStats = deleteTarget ? getAdvisorStats(deleteTarget) : null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
            <UserCog className="w-6 h-6" />
            مدیریت مشاوران
          </h2>
          <p className="text-sm text-navy-500 mt-0.5">{advisors.length} مشاور ثبت شده</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-xs font-bold shadow-lg shadow-navy-900/20">
          <Plus className="w-4 h-4" /> افزودن مشاور
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="جستجوی مشاور..."
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400 transition-all"
          />
        </div>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((advisor) => {
          const stats = getAdvisorStats(advisor.id);
          return (
            <motion.div
              key={advisor.id}
              variants={item}
              whileHover={{ y: -3 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white font-bold shadow-lg">
                    {advisor.firstName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-800">دکتر {advisor.firstName} {advisor.lastName}</h3>
                    <p className="text-[11px] text-navy-500">{advisor.specialty || 'مشاوره'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(advisor)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(advisor.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2.5 rounded-xl bg-blue-50">
                  <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-navy-800">{stats.studentCount.toLocaleString('fa-IR')}</p>
                  <p className="text-[10px] text-navy-500">دانشجو</p>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-emerald-50">
                  <BookOpen className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-navy-800">{stats.totalSessions.toLocaleString('fa-IR')}</p>
                  <p className="text-[10px] text-navy-500">جلسه</p>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-amber-50">
                  <p className="text-lg font-extrabold text-navy-800 mt-4">{stats.avgGpa > 0 ? stats.avgGpa.toFixed(1) : '-'}</p>
                  <p className="text-[10px] text-navy-500">میانگین معدل</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-navy-100">
                <p className="text-[11px] text-navy-400">نام کاربری: <span className="font-mono text-navy-600">{advisor.username}</span></p>
              </div>
            </motion.div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 text-navy-400 text-sm">مشاوری یافت نشد</div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'ویرایش مشاور' : 'افزودن مشاور'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">نام *</label>
            <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">نام خانوادگی *</label>
            <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">نام کاربری *</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">رمز عبور</label>
            <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">تخصص</label>
            <input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20" />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-navy-100">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-navy-600 hover:bg-navy-100">انصراف</button>
            <button type="submit" className="px-6 py-2 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-sm font-bold shadow-lg">
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
        title="حذف مشاور"
        message={`آیا از حذف این مشاور اطمینان دارید؟${deleteTargetStats && deleteTargetStats.studentCount > 0 ? ` این مشاور ${deleteTargetStats.studentCount} دانشجو دارد.` : ''}`}
        confirmText="حذف"
      />
    </motion.div>
  );
}
