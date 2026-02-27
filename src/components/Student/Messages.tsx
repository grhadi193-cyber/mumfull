import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/Shared/Modal';
import {
  MessageSquare, Send, Plus, Mail, MailOpen, ChevronDown, ChevronUp,
  Clock, CheckCircle, ArrowRight,
} from 'lucide-react';
import { messageDepartments } from '@/utils/mockData';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function StudentMessages() {
  const { user } = useAuth();
  const { messages, sendMessage, replyToMessage, markMessageAsRead, students, advisors } = useData();
  const { showToast } = useToast();

  const [showNewModal, setShowNewModal] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const currentStudent = useMemo(() => students.find(s => s.id === user?.id), [students, user]);
  const myAdvisor = useMemo(() => advisors.find(a => a.id === currentStudent?.advisorId), [advisors, currentStudent]);

  const myMessages = useMemo(() => {
    const all = messages.filter(m => m.senderId === user?.id || m.receiverId === user?.id);
    if (filter === 'all') return all;
    if (filter === 'sent') return all.filter(m => m.senderId === user?.id);
    if (filter === 'received') return all.filter(m => m.receiverId === user?.id);
    if (filter === 'unread') return all.filter(m => !m.isRead && m.receiverId === user?.id);
    return all;
  }, [messages, user, filter]);

  const sortedMessages = useMemo(() =>
    [...myMessages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [myMessages]
  );

  const unreadCount = useMemo(() =>
    messages.filter(m => m.receiverId === user?.id && !m.isRead).length,
    [messages, user]
  );

  // New message form
  const [newMessage, setNewMessage] = useState({
    receiverType: '',
    department: '',
    subject: '',
    body: '',
  });

  const handleSendNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.subject.trim() || !newMessage.body.trim()) {
      showToast('لطفاً موضوع و متن پیام را وارد کنید', 'warning');
      return;
    }
    if (!newMessage.receiverType) {
      showToast('لطفاً گیرنده پیام را انتخاب کنید', 'warning');
      return;
    }

    let receiverId = '';
    let receiverName = '';
    let receiverRole: 'advisor' | 'admin' | 'department' = 'department';
    let department: string | undefined;

    if (newMessage.receiverType === 'advisor') {
      if (!myAdvisor) {
        showToast('مشاوری تعریف نشده', 'error');
        return;
      }
      receiverId = myAdvisor.id;
      receiverName = `دکتر ${myAdvisor.firstName} ${myAdvisor.lastName}`;
      receiverRole = 'advisor';
    } else if (newMessage.receiverType === 'admin') {
      receiverId = 'admin1';
      receiverName = 'مدیر سیستم';
      receiverRole = 'admin';
    } else {
      receiverId = `dept_${newMessage.receiverType.replace(/\s/g, '_')}`;
      receiverName = `بخش ${newMessage.receiverType}`;
      receiverRole = 'department';
      department = newMessage.receiverType;
    }

    sendMessage({
      senderId: user!.id,
      senderName: `${currentStudent?.firstName} ${currentStudent?.lastName}`,
      senderRole: 'student',
      receiverId,
      receiverName,
      receiverRole,
      department,
      subject: newMessage.subject,
      body: newMessage.body,
    });

    showToast('پیام با موفقیت ارسال شد', 'success');
    setShowNewModal(false);
    setNewMessage({ receiverType: '', department: '', subject: '', body: '' });
  };

  const handleReply = (messageId: string) => {
    const text = replyText[messageId];
    if (!text || !text.trim()) {
      showToast('لطفاً متن پاسخ را وارد کنید', 'warning');
      return;
    }

    replyToMessage(messageId, {
      senderId: user!.id,
      senderName: `${currentStudent?.firstName} ${currentStudent?.lastName}`,
      senderRole: 'student',
      body: text,
    });

    showToast('پاسخ ارسال شد', 'success');
    setReplyText(prev => ({ ...prev, [messageId]: '' }));
  };

  const handleExpandMessage = (msgId: string) => {
    if (expandedMessage === msgId) {
      setExpandedMessage(null);
    } else {
      setExpandedMessage(msgId);
      const msg = messages.find(m => m.id === msgId);
      if (msg && !msg.isRead && msg.receiverId === user?.id) {
        markMessageAsRead(msgId);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filters = [
    { label: 'همه', value: 'all', count: myMessages.length },
    { label: 'دریافتی', value: 'received' },
    { label: 'ارسالی', value: 'sent' },
    { label: 'خوانده نشده', value: 'unread', count: unreadCount },
  ];

  const getDeptInfo = (receiverType: string) => {
    return messageDepartments.find(d => d.value === receiverType);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            پیام‌ها
          </h2>
          <p className="text-sm text-navy-500 mt-0.5">
            ارسال و دریافت پیام با بخش‌های مختلف دانشگاه
            {unreadCount > 0 && (
              <span className="mr-2 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                {unreadCount} خوانده نشده
              </span>
            )}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-xs font-bold shadow-lg"
        >
          <Plus className="w-4 h-4" />
          پیام جدید
        </motion.button>
      </motion.div>

      {/* Quick Contacts */}
      <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100">
        <p className="text-xs font-bold text-navy-600 mb-3">ارسال سریع پیام به:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {messageDepartments.map(dept => (
            <motion.button
              key={dept.value}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setNewMessage(prev => ({ ...prev, receiverType: dept.value }));
                setShowNewModal(true);
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-navy-50 hover:bg-navy-100 transition-all border border-transparent hover:border-navy-200"
            >
              <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${dept.color} flex items-center justify-center text-lg shadow-md`}>
                {dept.icon}
              </span>
              <span className="text-[10px] font-bold text-navy-700 text-center leading-tight">{dept.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-wrap gap-2 bg-white rounded-2xl p-3 shadow-sm border border-navy-100">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              filter === f.value ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-100'
            }`}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                filter === f.value ? 'bg-white/20 text-white' : 'bg-navy-200 text-navy-600'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Messages List */}
      <div className="space-y-3">
        {sortedMessages.map(msg => {
          const isSent = msg.senderId === user?.id;
          const isExpanded = expandedMessage === msg.id;
          const deptInfo = getDeptInfo(msg.department || (isSent ? '' : msg.senderRole === 'advisor' ? 'advisor' : 'admin'));

          return (
            <motion.div
              key={msg.id}
              variants={item}
              className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${
                !msg.isRead && !isSent ? 'border-blue-200 bg-blue-50/30' : 'border-navy-100'
              }`}
            >
              {/* Message Header */}
              <div
                className="p-4 cursor-pointer hover:bg-navy-50/30 transition-colors"
                onClick={() => handleExpandMessage(msg.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                    deptInfo?.color || 'from-navy-500 to-navy-700'
                  } flex items-center justify-center text-lg shadow-md flex-shrink-0 mt-0.5`}>
                    {deptInfo?.icon || (isSent ? '📤' : '📥')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {!msg.isRead && !isSent && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                      <p className="text-sm font-bold text-navy-800 truncate">{msg.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-navy-500">
                      <span>{isSent ? `به: ${msg.receiverName}` : `از: ${msg.senderName}`}</span>
                      <span>•</span>
                      <span>{formatDate(msg.createdAt)}</span>
                    </div>
                    <p className="text-xs text-navy-500 mt-1 line-clamp-1">{msg.body}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSent ? (
                      <span className="px-2 py-0.5 rounded-lg bg-navy-100 text-navy-600 text-[10px] font-bold">ارسالی</span>
                    ) : (
                      msg.isRead ? (
                        <MailOpen className="w-4 h-4 text-navy-400" />
                      ) : (
                        <Mail className="w-4 h-4 text-blue-500" />
                      )
                    )}
                    {msg.replies.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[9px] font-bold">
                        {msg.replies.length} پاسخ
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-navy-400" /> : <ChevronDown className="w-4 h-4 text-navy-400" />}
                  </div>
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
                    <div className="px-4 pb-4 border-t border-navy-100">
                      {/* Full Message Body */}
                      <div className="p-3 my-3 rounded-xl bg-navy-50">
                        <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                        <p className="text-[10px] text-navy-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>

                      {/* Replies */}
                      {msg.replies.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <p className="text-[10px] font-bold text-navy-500 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            پاسخ‌ها ({msg.replies.length}):
                          </p>
                          {msg.replies.map(reply => (
                            <div key={reply.id} className={`p-3 rounded-xl ${
                              reply.senderId === user?.id ? 'bg-navy-100 mr-4' : 'bg-emerald-50 ml-4'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white ${
                                  reply.senderId === user?.id ? 'bg-navy-600' : 'bg-emerald-600'
                                }`}>
                                  {reply.senderName[0]}
                                </span>
                                <span className="text-[11px] font-bold text-navy-700">{reply.senderName}</span>
                                <span className="text-[10px] text-navy-400">{formatDate(reply.createdAt)}</span>
                              </div>
                              <p className="text-xs text-navy-600 mr-7 whitespace-pre-wrap">{reply.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input */}
                      <div className="flex gap-2">
                        <input
                          value={replyText[msg.id] || ''}
                          onChange={e => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                          placeholder="پاسخ بنویسید..."
                          className="flex-1 px-3 py-2 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReply(msg.id);
                            }
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReply(msg.id)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-xs font-bold shadow-md flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          ارسال
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {sortedMessages.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-navy-100">
            <MessageSquare className="w-12 h-12 text-navy-300 mx-auto mb-3" />
            <p className="text-navy-500 font-bold">پیامی یافت نشد</p>
            <p className="text-navy-400 text-xs mt-1">از دکمه «پیام جدید» برای ارسال پیام استفاده کنید</p>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="ارسال پیام جدید">
        <form onSubmit={handleSendNew} className="space-y-4">
          {/* Receiver Selection */}
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-2">گیرنده پیام *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {messageDepartments.map(dept => (
                <button
                  key={dept.value}
                  type="button"
                  onClick={() => setNewMessage(prev => ({ ...prev, receiverType: dept.value }))}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-right ${
                    newMessage.receiverType === dept.value
                      ? 'border-navy-500 bg-navy-50 shadow-sm'
                      : 'border-navy-100 hover:border-navy-300 bg-white'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${dept.color} flex items-center justify-center text-sm flex-shrink-0`}>
                    {dept.icon}
                  </span>
                  <span className={`text-[11px] font-bold leading-tight ${
                    newMessage.receiverType === dept.value ? 'text-navy-800' : 'text-navy-600'
                  }`}>
                    {dept.label}
                  </span>
                </button>
              ))}
            </div>
            {newMessage.receiverType === 'advisor' && myAdvisor && (
              <p className="text-[11px] text-navy-500 mt-2 bg-navy-50 p-2 rounded-lg">
                پیام به: دکتر {myAdvisor.firstName} {myAdvisor.lastName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">موضوع *</label>
            <input
              value={newMessage.subject}
              onChange={e => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="موضوع پیام را وارد کنید..."
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">متن پیام *</label>
            <textarea
              value={newMessage.body}
              onChange={e => setNewMessage(prev => ({ ...prev, body: e.target.value }))}
              rows={5}
              placeholder="متن پیام خود را بنویسید..."
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 resize-none"
            />
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
            <p className="text-[11px] text-amber-700 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              پیام شما به بخش مربوطه ارسال و در اسرع وقت پاسخ داده خواهد شد.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-navy-100">
            <button type="button" onClick={() => setShowNewModal(false)}
              className="px-4 py-2 rounded-xl text-sm text-navy-600 hover:bg-navy-100">انصراف</button>
            <button type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-sm font-bold shadow-lg flex items-center gap-1.5">
              <Send className="w-4 h-4" />
              ارسال پیام
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
