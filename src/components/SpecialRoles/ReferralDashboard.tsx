import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import PersianDatePicker from '@/components/Shared/PersianDatePicker';
import {
  ClipboardList, Search, CheckCircle, Clock, XCircle,
  Filter, Calendar, User, FileText
} from 'lucide-react';

const roleToTarget: Record<string, string> = {
  'counseling_center': 'کلینیک مشاوره',
  'education_admin': 'مسئول آموزش',
  'advisor_supervisor': 'مسئول اساتید مشاور',
  'department_head': 'مدیرگروه',
};

const roleTitles: Record<string, string> = {
  'counseling_center': 'مرکز مشاوره',
  'education_admin': 'مسئول آموزش',
  'advisor_supervisor': 'مسئول اساتید مشاور',
  'department_head': 'مدیر گروه',
};

const roleIcons: Record<string, string> = {
  'counseling_center': '🧠',
  'education_admin': '📚',
  'advisor_supervisor': '👨‍💼',
  'department_head': '🏛️',
};

interface ReferralItem {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  advisorName: string;
  sessionId: string;
  sessionDate: string;
  reason: string;
  referralDate: string;
  status: string;
  confirmedDate?: string;
  topics: string;
}

export default function ReferralDashboard() {
  const { user } = useAuth();
  const { students } = useData();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmRef, setConfirmRef] = useState<ReferralItem | null>(null);
  const [confirmDate, setConfirmDate] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectRef, setRejectRef] = useState<ReferralItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const userRole = (user as any)?.role || '';
  const targetValue = roleToTarget[userRole] || '';
  const title = roleTitles[userRole] || 'داشبورد';
  const icon = roleIcons[userRole] || '📋';

  // Collect referrals
  const allReferrals = useMemo(() => {
    const refs: ReferralItem[] = [];
    students.forEach(student => {
      student.sessions.forEach(session => {
        session.referrals.forEach(referral => {
          if (referral.target === targetValue) {
            refs.push({
              id: referral.id,
              studentId: student.id,
              studentName: `${student.firstName} ${student.lastName}`,
              studentNumber: student.studentNumber,
              advisorName: student.advisorName,
              sessionId: session.id,
              sessionDate: session.date,
              reason: referral.reason,
              referralDate: referral.date,
              status: referral.status,
              confirmedDate: referral.confirmedDate,
              topics: session.type,
            });
          }
        });
      });
    });
    return refs.sort((a, b) => (a.referralDate > b.referralDate ? -1 : 1));
  }, [students, targetValue]);

  const filteredReferrals = useMemo(() => {
    let result = allReferrals;
    if (statusFilter === 'pending') result = result.filter(r => r.status !== 'completed' && r.status !== 'rejected');
    else if (statusFilter === 'completed') result = result.filter(r => r.status === 'completed');
    else if (statusFilter === 'rejected') result = result.filter(r => r.status === 'rejected');
    if (search) {
      result = result.filter(r =>
        r.studentName.includes(search) || r.studentNumber.includes(search)
      );
    }
    return result;
  }, [allReferrals, statusFilter, search]);

  const stats = {
    total: allReferrals.length,
    pending: allReferrals.filter(r => r.status !== 'completed' && r.status !== 'rejected').length,
    completed: allReferrals.filter(r => r.status === 'completed').length,
  };

  const openConfirm = (ref: ReferralItem) => {
    setConfirmRef(ref);
    setConfirmDate('');
    setConfirmNotes('');
    setConfirmModal(true);
  };

  const openReject = (ref: ReferralItem) => {
    setRejectRef(ref);
    setRejectReason('');
    setRejectModal(true);
  };

  const handleConfirm = () => {
    if (!confirmDate) {
      showToast('لطفاً تاریخ تأیید را وارد کنید', 'warning');
      return;
    }
    showToast('ارجاع با موفقیت تأیید شد', 'success');
    setConfirmModal(false);
    setConfirmRef(null);
  };

  const handleReject = () => {
    if (!rejectReason || rejectReason.length < 5) {
      showToast('لطفاً دلیل رد را وارد کنید (حداقل ۵ حرف)', 'warning');
      return;
    }
    showToast('ارجاع رد شد', 'success');
    setRejectModal(false);
    setRejectRef(null);
  };

  return (
    <div className="space-y-5 p-2 sm:p-0">
      {/* Welcome */}
      <div className="bg-gradient-to-l from-slate-700 to-slate-900 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl sm:text-3xl">{icon}</span>
          <h2 className="text-lg sm:text-xl font-extrabold">داشبورد {title}</h2>
        </div>
        <p className="text-slate-300 text-xs sm:text-sm">مدیریت ارجاعات دریافتی از اساتید مشاور</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'کل ارجاعات', value: stats.total, Icon: ClipboardList, bg: 'bg-slate-100', color: 'text-slate-700' },
          { label: 'در انتظار تأیید', value: stats.pending, Icon: Clock, bg: 'bg-amber-50', color: 'text-amber-700' },
          { label: 'تأیید شده', value: stats.completed, Icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-700' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-extrabold text-slate-800">{s.value}</p>
                <p className="text-[9px] sm:text-[11px] text-slate-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="جستجو نام یا شماره دانشجویی..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          {[
            { label: 'همه', value: 'all' },
            { label: 'در انتظار', value: 'pending' },
            { label: 'تأیید شده', value: 'completed' },
          ].map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === f.value ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100 bg-slate-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '800px' }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-right font-bold text-slate-700 text-xs">#</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700 text-xs">دانشجو</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700 text-xs">شماره دانشجویی</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700 text-xs">استاد ارجاع‌دهنده</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700 text-xs">دلیل ارجاع</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700 text-xs">تاریخ ارجاع</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700 text-xs">تاریخ تأیید</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700 text-xs">وضعیت</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-700 text-xs">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredReferrals.map((ref, index) => (
                <tr key={ref.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 text-slate-500 text-xs">{index + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800 text-xs">{ref.studentName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs font-mono">{ref.studentNumber}</td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">{ref.advisorName}</td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs max-w-[150px] truncate">{ref.reason}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Calendar className="w-3 h-3" /> {ref.referralDate}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {ref.confirmedDate ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle className="w-3 h-3" /> {ref.confirmedDate}
                      </div>
                    ) : <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${ref.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : ref.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {ref.status === 'completed' ? '✅ تأیید شده' : ref.status === 'rejected' ? '❌ رد شده' : '⏳ در انتظار'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {ref.status !== 'completed' && ref.status !== 'rejected' ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openConfirm(ref)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700">
                          <CheckCircle className="w-3 h-3" /> تأیید
                        </button>
                        <button onClick={() => openReject(ref)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-700">
                          <XCircle className="w-3 h-3" /> رد
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredReferrals.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">ارجاعی یافت نشد</p>
          </div>
        )}
      </div>

      {/* Cards - Mobile */}
      <div className="sm:hidden space-y-3">
        {filteredReferrals.length === 0 && (
          <div className="text-center py-8 bg-white rounded-xl">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">ارجاعی یافت نشد</p>
          </div>
        )}
        {filteredReferrals.map((ref, index) => (
          <div key={ref.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                  {index + 1}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{ref.studentName}</p>
                  <p className="text-[10px] text-slate-500">{ref.studentNumber}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${ref.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : ref.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {ref.status === 'completed' ? '✅ تأیید شده' : ref.status === 'rejected' ? '❌ رد شده' : '⏳ در انتظار'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[10px] text-slate-400">استاد ارجاع‌دهنده</p>
                <p className="font-medium text-slate-700">{ref.advisorName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">تاریخ ارجاع</p>
                <p className="font-medium text-slate-700">{ref.referralDate}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-400">دلیل ارجاع</p>
                <p className="font-medium text-slate-700">{ref.reason}</p>
              </div>
              {ref.confirmedDate && (
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400">تاریخ تأیید</p>
                  <p className="font-medium text-emerald-600">{ref.confirmedDate}</p>
                </div>
              )}
            </div>

            {ref.status !== 'completed' && ref.status !== 'rejected' && (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => openConfirm(ref)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" /> تأیید
                </button>
                <button onClick={() => openReject(ref)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700">
                  <XCircle className="w-3.5 h-3.5" /> رد
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===== CONFIRM MODAL ===== */}
      {confirmModal && confirmRef && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-emerald-600 px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-bold text-base">تأیید ارجاع</h3>
              </div>
              <p className="text-emerald-100 text-xs mt-1">تأیید ارجاع دانشجو {confirmRef.studentName}</p>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">دانشجو:</span>
                  <span className="font-bold text-slate-800">{confirmRef.studentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">تاریخ ارجاع:</span>
                  <span className="font-bold text-slate-800">{confirmRef.referralDate}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500">دلیل: </span>
                  <span className="text-slate-700">{confirmRef.reason}</span>
                </div>
              </div>

              {/* Date picker */}
              <div>
                <PersianDatePicker value={confirmDate} onChange={setConfirmDate} label="تاریخ تأیید *" required />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">توضیحات (اختیاری)</label>
                <textarea value={confirmNotes} onChange={e => setConfirmNotes(e.target.value)}
                  rows={2} placeholder="توضیحات اضافی..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-200 transition-colors">
                انصراف
              </button>
              <button onClick={handleConfirm}
                className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors">
                ✅ ثبت تأیید
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REJECT MODAL ===== */}
      {rejectModal && rejectRef && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-base">رد ارجاع</h3>
              </div>
              <p className="text-red-100 text-xs mt-1">رد ارجاع دانشجو {rejectRef.studentName}</p>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">دانشجو:</span>
                  <span className="font-bold text-slate-800">{rejectRef.studentName}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500">دلیل ارجاع: </span>
                  <span className="text-slate-700">{rejectRef.reason}</span>
                </div>
              </div>

              {/* Reject reason */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">دلیل رد *</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  rows={3} placeholder="دلیل رد ارجاع را بنویسید..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
                {rejectReason.length > 0 && rejectReason.length < 5 && (
                  <p className="text-red-500 text-xs mt-1">حداقل ۵ حرف وارد کنید</p>
                )}
              </div>

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">این عملیات قابل بازگشت نیست و دلیل رد به استاد ارجاع‌دهنده اطلاع داده خواهد شد.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setRejectModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-200 transition-colors">
                انصراف
              </button>
              <button onClick={handleReject}
                className="px-6 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">
                ❌ ثبت رد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
