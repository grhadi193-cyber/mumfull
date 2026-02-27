import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  initialStudents, initialAdvisors, initialAppointments, initialMessages,
  type Student, type Advisor, type Appointment, type Session, type Message, type MessageReply,
} from '@/utils/mockData';

interface DataContextType {
  students: Student[];
  advisors: Advisor[];
  appointments: Appointment[];
  messages: Message[];
  addStudent: (s: Omit<Student, 'id' | 'role' | 'sessions' | 'totalSessions'>) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  importStudents: (list: Omit<Student, 'id' | 'role' | 'sessions' | 'totalSessions'>[]) => void;
  addAdvisor: (a: Omit<Advisor, 'id' | 'role' | 'availability'>) => void;
  updateAdvisor: (id: string, data: Partial<Advisor>) => void;
  deleteAdvisor: (id: string) => void;
  updateAvailability: (advisorId: string, availability: Advisor['availability']) => void;
  addAppointment: (a: Omit<Appointment, 'id' | 'createdAt'>) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status'], rejectionReason?: string) => void;
  deleteAppointment: (id: string) => void;
  addSession: (studentId: string, session: Omit<Session, 'id'>) => void;
  getStudentsByAdvisor: (advisorId: string) => Student[];
  getAppointmentsByAdvisor: (advisorId: string) => Appointment[];
  getAppointmentsByStudent: (studentId: string) => Appointment[];
  // Message functions
  sendMessage: (msg: Omit<Message, 'id' | 'createdAt' | 'isRead' | 'replies'>) => void;
  replyToMessage: (messageId: string, reply: Omit<MessageReply, 'id' | 'createdAt'>) => void;
  getMessagesByUser: (userId: string) => Message[];
  getMessagesByDepartment: (department: string) => Message[];
  markMessageAsRead: (messageId: string) => void;
  getUnreadCount: (userId: string) => number;
}

const DataContext = createContext<DataContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
}

function saveToStorage(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(() => loadFromStorage('students', initialStudents));
  const [advisors, setAdvisors] = useState<Advisor[]>(() => loadFromStorage('advisors', initialAdvisors));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadFromStorage('appointments', initialAppointments));
  const [messages, setMessages] = useState<Message[]>(() => loadFromStorage('messages', initialMessages));

  const persist = useCallback((key: string, data: unknown) => saveToStorage(key, data), []);

  const addStudent = useCallback((s: Omit<Student, 'id' | 'role' | 'sessions' | 'totalSessions'>) => {
    setStudents(prev => {
      const newStudent: Student = {
        ...s,
        id: `student_${Date.now()}`,
        role: 'student',
        sessions: [],
        totalSessions: 0,
      };
      const next = [...prev, newStudent];
      persist('students', next);
      return next;
    });
  }, [persist]);

  const updateStudent = useCallback((id: string, data: Partial<Student>) => {
    setStudents(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...data } : s);
      persist('students', next);
      return next;
    });
  }, [persist]);

  const deleteStudent = useCallback((id: string) => {
    setStudents(prev => {
      const next = prev.filter(s => s.id !== id);
      persist('students', next);
      return next;
    });
    setAppointments(prev => {
      const next = prev.filter(a => a.studentId !== id);
      persist('appointments', next);
      return next;
    });
  }, [persist]);

  const importStudents = useCallback((list: Omit<Student, 'id' | 'role' | 'sessions' | 'totalSessions'>[]) => {
    setStudents(prev => {
      const newStudents = list.map((s, i) => ({
        ...s,
        id: `student_import_${Date.now()}_${i}`,
        role: 'student' as const,
        sessions: [],
        totalSessions: 0,
      }));
      const next = [...prev, ...newStudents];
      persist('students', next);
      return next;
    });
  }, [persist]);

  const addAdvisor = useCallback((a: Omit<Advisor, 'id' | 'role' | 'availability'>) => {
    const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"];
    const defaultSlots = [
      { time: "08:00-09:00", available: true },
      { time: "09:00-10:00", available: true },
      { time: "10:00-11:00", available: true },
      { time: "11:00-12:00", available: true },
      { time: "13:00-14:00", available: true },
      { time: "14:00-15:00", available: true },
      { time: "15:00-16:00", available: false },
      { time: "16:00-17:00", available: false },
    ];
    setAdvisors(prev => {
      const newAdvisor: Advisor = {
        ...a,
        id: `advisor_${Date.now()}`,
        role: 'advisor',
        availability: days.map(day => ({ day, slots: defaultSlots.map(s => ({ ...s })) })),
      };
      const next = [...prev, newAdvisor];
      persist('advisors', next);
      return next;
    });
  }, [persist]);

  const updateAdvisor = useCallback((id: string, data: Partial<Advisor>) => {
    setAdvisors(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...data } : a);
      persist('advisors', next);
      return next;
    });
  }, [persist]);

  const deleteAdvisor = useCallback((id: string) => {
    setAdvisors(prev => {
      const next = prev.filter(a => a.id !== id);
      persist('advisors', next);
      return next;
    });
  }, [persist]);

  const updateAvailability = useCallback((advisorId: string, availability: Advisor['availability']) => {
    setAdvisors(prev => {
      const next = prev.map(a => a.id === advisorId ? { ...a, availability } : a);
      persist('advisors', next);
      return next;
    });
  }, [persist]);

  const addAppointment = useCallback((a: Omit<Appointment, 'id' | 'createdAt'>) => {
    setAppointments(prev => {
      const newApt: Appointment = {
        ...a,
        id: `apt_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const next = [...prev, newApt];
      persist('appointments', next);
      return next;
    });
  }, [persist]);

  const updateAppointmentStatus = useCallback((id: string, status: Appointment['status'], rejectionReason?: string) => {
    setAppointments(prev => {
      const next = prev.map(a => a.id === id ? { ...a, status, ...(rejectionReason ? { rejectionReason } : {}) } : a);
      persist('appointments', next);
      return next;
    });
  }, [persist]);

  const deleteAppointment = useCallback((id: string) => {
    setAppointments(prev => {
      const next = prev.filter(a => a.id !== id);
      persist('appointments', next);
      return next;
    });
  }, [persist]);

  const addSession = useCallback((studentId: string, session: Omit<Session, 'id'>) => {
    setStudents(prev => {
      const next = prev.map(s => {
        if (s.id === studentId) {
          const newSession: Session = { ...session, id: `session_${Date.now()}` };
          return { ...s, sessions: [...s.sessions, newSession], totalSessions: s.totalSessions + 1 };
        }
        return s;
      });
      persist('students', next);
      return next;
    });
  }, [persist]);

  const getStudentsByAdvisor = useCallback((advisorId: string) => {
    return students.filter(s => s.advisorId === advisorId);
  }, [students]);

  const getAppointmentsByAdvisor = useCallback((advisorId: string) => {
    return appointments.filter(a => a.advisorId === advisorId);
  }, [appointments]);

  const getAppointmentsByStudent = useCallback((studentId: string) => {
    return appointments.filter(a => a.studentId === studentId);
  }, [appointments]);

  // === Message Functions ===
  const sendMessage = useCallback((msg: Omit<Message, 'id' | 'createdAt' | 'isRead' | 'replies'>) => {
    setMessages(prev => {
      const newMsg: Message = {
        ...msg,
        id: `msg_${Date.now()}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        replies: [],
      };
      const next = [...prev, newMsg];
      persist('messages', next);
      return next;
    });
  }, [persist]);

  const replyToMessage = useCallback((messageId: string, reply: Omit<MessageReply, 'id' | 'createdAt'>) => {
    setMessages(prev => {
      const next = prev.map(m => {
        if (m.id === messageId) {
          const newReply: MessageReply = {
            ...reply,
            id: `reply_${Date.now()}`,
            createdAt: new Date().toISOString(),
          };
          return { ...m, replies: [...m.replies, newReply] };
        }
        return m;
      });
      persist('messages', next);
      return next;
    });
  }, [persist]);

  const getMessagesByUser = useCallback((userId: string) => {
    return messages.filter(m => m.senderId === userId || m.receiverId === userId);
  }, [messages]);

  const getMessagesByDepartment = useCallback((department: string) => {
    return messages.filter(m => m.department === department);
  }, [messages]);

  const markMessageAsRead = useCallback((messageId: string) => {
    setMessages(prev => {
      const next = prev.map(m => m.id === messageId ? { ...m, isRead: true } : m);
      persist('messages', next);
      return next;
    });
  }, [persist]);

  const getUnreadCount = useCallback((userId: string) => {
    return messages.filter(m => (m.receiverId === userId || m.senderId === userId) && !m.isRead).length;
  }, [messages]);

  return (
    <DataContext.Provider value={{
      students, advisors, appointments, messages,
      addStudent, updateStudent, deleteStudent, importStudents,
      addAdvisor, updateAdvisor, deleteAdvisor, updateAvailability,
      addAppointment, updateAppointmentStatus, deleteAppointment,
      addSession, getStudentsByAdvisor, getAppointmentsByAdvisor, getAppointmentsByStudent,
      sendMessage, replyToMessage, getMessagesByUser, getMessagesByDepartment, markMessageAsRead, getUnreadCount,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
