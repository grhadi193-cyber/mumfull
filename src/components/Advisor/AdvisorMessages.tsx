import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/Shared/Modal';
import { MessageSquare, Send, Plus, Filter, ChevronDown, ChevronUp, Clock, Mail, MailOpen } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AdvisorMessages() {
  const { user } = useAuth();
  const { messages, sendMessage, replyToMessage, markMessageAsRead, getStudentsByAdvisor } = useData();
  const { showToast } = useToast();

  const myStudents = useMemo(() => user ? getStudentsByAdvisor(user.id) : [], [user, getStudentsByAdvisor]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [newMsg, setNewMsg] = useState({ receiverId: '', subject: '', body: '' });

  const myMessages = useMemo(() => {
    let all = messages.filter(m => m.senderId === user?.id || m.receiverId === user?.id);
    if (filter === 'sent') all = all.filter(m => m.senderId === user?.id);
    else if (filter === 'received') all = all.filter(m => m.receiverId === user?.id);
    else if (filter === 'unread') all = all.filter(m => !m.isRead && m.receiverId === user?.id);
    if (search) all = all.filter(m => m.subject.includes(search) || m.body.includes(search) || m.senderName.includes(search));
    return [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages, user, filter, search]);

  const handleSendNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.subject || !newMsg.body || !newMsg.receiverId) {
      showToast('لطفاً همه فیلدها را پر کنید', 'warning'); return;
    }
    const student = myStudents.find(s => s.id === newMsg.receiverId);
    const isAdmin = newMsg.receiverId === 'admin1';
    sendMessage({
      senderId: user!.id,
      senderName: `دکتر ${user!.firstName} ${user!.lastName}`,
      senderRole: 'advisor',
      receiverId: newMsg.receiverId,
      receiverName: isAdmin ? 'مدیر سیستم' : student ? `${student.firstName} ${student.lastName}` : '',
      receiverRole: isAdmin ? 'admin' : 'student',
      subject: newMsg.subject,
      body: newMsg.body,
    });
    showToast('پیام ارسال شد', 'success');
    setShowNewModal(false);
    setNewMsg({ receiverId: '', subject: '', body: '' });
  };

  const handleReply = (messageId: string) => {
    const text = replyText[messageId];
    if (!text?.trim()) { showToast('متن پاسخ را وارد کنید', 'warning'); return; }
    replyToMessage(messageId, { senderId: user!.id, senderName: `دکتر ${user!.firstName} ${user!.lastName}`, senderRole: 'advisor', body: text });
    showToast('پاسخ ارسال شد', 'success');
    setReplyText(prev => ({ ...prev, [messageId]: '' }));
  };

  const handleExpand = (msgId: string) => {
    setExpandedMessage(expandedMessage === msgId ? null : msgId);
    const msg = messages.find(m => m.id === msgId);
    if (msg && !msg.isRead && msg.receiverId === user?.id) markMessageAsRead(msgId);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-navy-800 flex items-center gap-2"><MessageSquare className="w-6 h-6" />پیام‌ها</h2>
          <p className="text-sm text-navy-500">ارتباط با دانشجویان و مدیر سیستم</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-l from-navy-700 to-navy-800 text-white text-xs font-bold shadow-lg">
          <Plus className="w-4 h-4" /> پیام جدید
        </motion.button>
      </motion.div>

      <motion.div variants={item} className="bg-white rounded-2xl p-3 shadow-sm border border-navy-100 flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-navy-400" />
        {['all', 'received', 'sent', 'unread'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-100'}`}>
            {f === 'all' ? 'همه' : f === 'received' ? 'دریافتی' : f === 'sent' ? 'ارسالی' : 'خوانده نشده'}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="flex-1 min-w-[150px] px-3 py-1.5 rounded-lg border border-navy-200 text-xs focus:outline-none" />
      </motion.div>

      <div className="space-y-3">
        {myMessages.map(msg => {
          const isSent = msg.senderId === user?.id;
          const isExp = expandedMessage === msg.id;
          return (
            <motion.div key={msg.id} variants={item} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${!msg.isRead && !isSent ? 'border-blue-200' : 'border-navy-100'}`}>
              <div className="p-4 cursor-pointer hover:bg-navy-50/30 transition-colors" onClick={() => handleExpand(msg.id)}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {isSent ? '📤' : msg.senderName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!msg.isRead && !isSent && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      <p className="text-sm font-bold text-navy-800 truncate">{msg.subject}</p>
                    </div>
                    <p className="text-[11px] text-navy-500">{isSent ? `به: ${msg.receiverName}` : `از: ${msg.senderName}`} • {formatDate(msg.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!isSent && (msg.isRead ? <MailOpen className="w-4 h-4 text-navy-400" /> : <Mail className="w-4 h-4 text-blue-500" />)}
                    {msg.replies.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[9px] font-bold">{msg.replies.length}</span>}
                    {isExp ? <ChevronUp className="w-4 h-4 text-navy-400" /> : <ChevronDown className="w-4 h-4 text-navy-400" />}
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {isExp && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-navy-100">
                      <div className="p-3 my-3 rounded-xl bg-navy-50">
                        <p className="text-sm text-navy-700 whitespace-pre-wrap">{msg.body}</p>
                        <p className="text-[10px] text-navy-400 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(msg.createdAt)}</p>
                      </div>
                      {msg.replies.map(r => (
                        <div key={r.id} className={`p-3 rounded-xl mb-2 ${r.senderId === user?.id ? 'bg-navy-100 mr-4' : 'bg-emerald-50 ml-4'}`}>
                          <p className="text-[11px] font-bold text-navy-700 mb-1">{r.senderName} • {formatDate(r.createdAt)}</p>
                          <p className="text-xs text-navy-600">{r.body}</p>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input value={replyText[msg.id] || ''} onChange={e => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                          placeholder="پاسخ..." className="flex-1 px-3 py-2 rounded-xl border border-navy-200 text-sm focus:outline-none"
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleReply(msg.id); } }} />
                        <button onClick={() => handleReply(msg.id)} className="px-4 py-2 rounded-xl bg-navy-800 text-white text-xs font-bold flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" />ارسال
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {myMessages.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-navy-100">
            <MessageSquare className="w-12 h-12 text-navy-300 mx-auto mb-3" /><p className="text-navy-400">پیامی یافت نشد</p>
          </div>
        )}
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="ارسال پیام جدید">
        <form onSubmit={handleSendNew} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-700 mb-1">گیرنده *</label>
            <select value={newMsg.receiverId} onChange={e => setNewMsg(p => ({ ...p, receiverId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm bg-white focus:outline-none">
              <option value="">انتخاب کنید</option>
              <option value="admin1">⚙️ مدیر سیستم</option>
              <optgroup label="دانشجویان من">
                {myStudents.map(s => <option key={s.id} value={s.id}>🎓 {s.firstName} {s.lastName} ({s.studentNumber})</option>)}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-navy-700 mb-1">موضوع *</label>
            <input value={newMsg.subject} onChange={e => setNewMsg(p => ({ ...p, subject: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-navy-700 mb-1">متن *</label>
            <textarea value={newMsg.body} onChange={e => setNewMsg(p => ({ ...p, body: e.target.value }))} rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 rounded-xl text-sm text-navy-600 hover:bg-navy-100">انصراف</button>
            <button type="submit" className="px-6 py-2 rounded-xl bg-navy-800 text-white text-sm font-bold shadow-lg flex items-center gap-1"><Send className="w-4 h-4" />ارسال</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
