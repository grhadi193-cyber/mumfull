import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import {
  MessageSquare, Users, UserCog, Search, Send, ChevronDown, ChevronUp,
  Clock, CheckCircle, AlertCircle
} from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'advisor';
  subject: string;
  message: string;
  date: string;
  status: 'pending' | 'in_progress' | 'resolved';
  reply?: string;
}

export default function AdminSupportMessages() {
  const { students: _students, advisors: _advisors } = useData();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'advisors' | 'students'>('students');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Mock support messages
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 'sm1', senderId: 'student1', senderName: 'علی احمدی', senderRole: 'student',
      subject: '۲۴ ساعت از درخواست نوبت گذشته', message: 'با سلام، بیش از ۲۴ ساعت است که درخواست نوبت ملاقات ارسال کرده‌ام ولی هنوز تأیید یا رد نشده است. لطفاً پیگیری فرمایید.',
      date: '1404/11/15', status: 'pending',
    },
    {
      id: 'sm2', senderId: 'student2', senderName: 'زهرا محمدی', senderRole: 'student',
      subject: 'مشکل در ثبت اطلاعات', message: 'در ثبت جلسه اشتراکی به مشکل خورده‌ام و صفحه ارور می‌دهد.',
      date: '1404/11/14', status: 'in_progress', reply: 'در حال بررسی هستیم.',
    },
    {
      id: 'sm3', senderId: 'student3', senderName: 'محمد حسینی', senderRole: 'student',
      subject: '۲۴ ساعت از درخواست نوبت گذشته', message: 'درخواست نوبت من هنوز بررسی نشده است.',
      date: '1404/11/13', status: 'resolved', reply: 'مشکل بررسی و نوبت شما تأیید شد.',
    },
    {
      id: 'sm4', senderId: 'advisor1', senderName: 'دکتر محمد رضایی', senderRole: 'advisor',
      subject: 'مشکل در سیستم زمان‌بندی', message: 'سیستم زمان‌بندی ساعات حضور دچار مشکل شده و تغییرات ذخیره نمی‌شود.',
      date: '1404/11/12', status: 'pending',
    },
    {
      id: 'sm5', senderId: 'advisor2', senderName: 'دکتر فاطمه کریمی', senderRole: 'advisor',
      subject: 'درخواست اضافه شدن دانشجو', message: 'لطفاً دانشجوی جدیدی با شماره دانشجویی ۹۹۱۲۳۵۰ به لیست من اضافه شود.',
      date: '1404/11/11', status: 'in_progress', reply: 'بررسی می‌شود.',
    },
  ]);

  const filteredMessages = messages.filter(m => {
    const roleMatch = activeTab === 'students' ? m.senderRole === 'student' : m.senderRole === 'advisor';
    const searchMatch = !search || m.senderName.includes(search) || m.subject.includes(search) || m.message.includes(search);
    return roleMatch && searchMatch;
  });

  const handleReply = (msgId: string) => {
    if (!replyText.trim()) {
      showToast('لطفاً متن پاسخ را وارد کنید', 'warning');
      return;
    }
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, reply: replyText, status: 'resolved' as const } : m
    ));
    setReplyText('');
    setExpandedId(null);
    showToast('پاسخ با موفقیت ارسال شد', 'success');
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'در انتظار بررسی', icon: Clock },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'در حال بررسی', icon: AlertCircle },
      resolved: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'پاسخ داده شده', icon: CheckCircle },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${s.bg} ${s.text}`}>
        <s.icon className="w-3 h-3" />
        {s.label}
      </span>
    );
  };

  const studentCount = messages.filter(m => m.senderRole === 'student').length;
  const advisorCount = messages.filter(m => m.senderRole === 'advisor').length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="text-xl font-extrabold text-navy-800">پیام‌های پشتیبانی</h2>
        <p className="text-sm text-navy-500 mt-1">مدیریت پیام‌های دریافتی از دانشجویان و اساتید مشاور</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'students'
              ? 'bg-gradient-to-l from-navy-700 to-navy-800 text-white shadow-lg'
              : 'bg-white text-navy-600 border border-navy-200 hover:bg-navy-50'
          }`}
        >
          <Users className="w-4 h-4" />
          پیام‌های دانشجویان
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'students' ? 'bg-white/20' : 'bg-navy-100'
          }`}>
            {studentCount.toLocaleString('fa-IR')}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('advisors')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'advisors'
              ? 'bg-gradient-to-l from-navy-700 to-navy-800 text-white shadow-lg'
              : 'bg-white text-navy-600 border border-navy-200 hover:bg-navy-50'
          }`}
        >
          <UserCog className="w-4 h-4" />
          پیام‌های استادان مشاور
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'advisors' ? 'bg-white/20' : 'bg-navy-100'
          }`}>
            {advisorCount.toLocaleString('fa-IR')}
          </span>
        </button>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="جستجو در پیام‌ها..."
          className="w-full pr-10 pl-4 py-3 rounded-xl border border-navy-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        />
      </motion.div>

      {/* Messages List */}
      <motion.div variants={item} className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-navy-100">
            <MessageSquare className="w-12 h-12 text-navy-300 mx-auto mb-3" />
            <p className="text-navy-500 text-sm">پیامی یافت نشد</p>
          </div>
        ) : (
          filteredMessages.map(msg => {
            const isExpanded = expandedId === msg.id;
            return (
              <motion.div
                key={msg.id}
                layout
                className={`bg-white rounded-2xl border transition-all ${
                  msg.status === 'pending' ? 'border-amber-200' : 'border-navy-100'
                } ${isExpanded ? 'shadow-md' : 'shadow-sm hover:shadow-md'}`}
              >
                {/* Message Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                        msg.senderRole === 'student'
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        {msg.senderName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-navy-800 text-sm">{msg.senderName}</span>
                          {getStatusBadge(msg.status)}
                        </div>
                        <p className="text-xs text-navy-600 font-medium mt-1">{msg.subject}</p>
                        <p className="text-[11px] text-navy-400 mt-0.5">{msg.date}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-navy-400" /> : <ChevronDown className="w-4 h-4 text-navy-400" />}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t border-navy-100 pt-3">
                        {/* Original Message */}
                        <div className="bg-navy-50 rounded-xl p-3">
                          <p className="text-xs font-bold text-navy-600 mb-1">متن پیام:</p>
                          <p className="text-sm text-navy-700 leading-relaxed">{msg.message}</p>
                        </div>

                        {/* Previous Reply */}
                        {msg.reply && (
                          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-700 mb-1">✅ پاسخ ارسال شده:</p>
                            <p className="text-sm text-emerald-800 leading-relaxed">{msg.reply}</p>
                          </div>
                        )}

                        {/* Reply Form */}
                        {msg.status !== 'resolved' && (
                          <div className="space-y-2">
                            <textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="پاسخ خود را بنویسید..."
                              rows={3}
                              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 resize-none"
                            />
                            <div className="flex justify-end">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleReply(msg.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-xs font-bold shadow-lg"
                              >
                                <Send className="w-3.5 h-3.5" />
                                ارسال پاسخ
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}
