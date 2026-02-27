import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { apiFetch } from '@/utils/api';
import type { Student, Advisor, Appointment, Session, Message, MessageReply } from '@/utils/mockData';

interface DataContextType {
  students: Student[];
  advisors: Advisor[];
  appointments: Appointment[];
  messages: Message[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  addStudent: (s: Omit<Student, 'id' | 'role' | 'sessions' | 'totalSessions'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  importStudents: (list: Omit<Student, 'id' | 'role' | 'sessions' | 'totalSessions'>[]) => Promise<void>;
  addAdvisor: (a: Omit<Advisor, 'id' | 'role' | 'availability'>) => Promise<void>;
  updateAdvisor: (id: string, data: Partial<Advisor>) => Promise<void>;
  deleteAdvisor: (id: string) => Promise<void>;
  updateAvailability: (advisorId: string, availability: Advisor['availability']) => Promise<void>;
  addAppointment: (a: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status'], rejectionReason?: string) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  addSession: (studentId: string, session: Omit<Session, 'id'>) => Promise<void>;
  getStudentsByAdvisor: (advisorId: string) => Student[];
  getAppointmentsByAdvisor: (advisorId: string) => Appointment[];
  getAppointmentsByStudent: (studentId: string) => Appointment[];
  sendMessage: (msg: Omit<Message, 'id' | 'createdAt' | 'isRead' | 'replies'>) => Promise<void>;
  replyToMessage: (messageId: string, reply: Omit<MessageReply, 'id' | 'createdAt'>) => Promise<void>;
  getMessagesByUser: (userId: string) => Message[];
  getMessagesByDepartment: (department: string) => Message[];
  markMessageAsRead: (messageId: string) => Promise<void>;
  getUnreadCount: (userId: string) => number;
}

const DataContext = createContext<DataContextType | null>(null);

function mapStudent(s: any): Student {
  return {
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    username: s.username,
    password: '',
    studentNumber: s.studentNumber,
    gpa: s.gpa,
    phoneNumber: s.phoneNumber,
    advisorId: s.advisorId,
    advisorName: s.advisorName,
    semester: s.semester,
    totalSessions: s.totalSessions,
    role: 'student',
    studentType: s.studentType,
    sessions: s.sessions || [],
  };
}

function mapAdvisor(a: any): Advisor {
  return {
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    username: a.username,
    password: '',
    role: 'advisor',
    specialty: a.specialty,
    faculty: a.faculty,
    availability: a.availability || [],
  };
}

function mapAppointment(a: any): Appointment {
  return {
    id: a.id,
    studentId: a.studentId,
    advisorId: a.advisorId,
    date: a.date,
    time: a.time,
    appointmentType: a.appointmentType,
    status: a.status,
    description: a.description,
    rejectionReason: a.rejectionReason,
    createdAt: a.createdAt,
  };
}

function mapMessage(m: any): Message {
  return {
    id: m.id,
    senderId: m.senderId,
    senderName: m.senderName,
    senderRole: m.senderRole,
    receiverId: m.receiverId,
    receiverName: m.receiverName,
    receiverRole: m.receiverRole,
    department: m.department,
    subject: m.subject,
    body: m.body,
    isRead: m.isRead,
    createdAt: m.createdAt,
    replies: m.replies || [],
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents]           = useState<Student[]>([]);
  const [advisors, setAdvisors]           = useState<Advisor[]>([]);
  const [appointments, setAppointments]   = useState<Appointment[]>([]);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [loading, setLoading]             = useState(true);

  const refreshAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }
      const [s, a, ap] = await Promise.all([
        apiFetch<any[]>('/students'),
        apiFetch<any[]>('/advisors'),
        apiFetch<any[]>('/appointments'),
      ]);
      setStudents(s.map(mapStudent));
      setAdvisors(a.map(mapAdvisor));
      setAppointments(ap.map(mapAppointment));
    } catch (e) {
      console.error('refreshAll error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // ─── Students ────────────────────────────────────────
  const addStudent = useCallback(async (s: any) => {
    const res = await apiFetch<any>('/students', {
      method: 'POST',
      body: JSON.stringify({
        first_name: s.firstName, last_name: s.lastName,
        username: s.username, password: s.password,
        student_number: s.studentNumber, gpa: s.gpa,
        phone_number: s.phoneNumber, advisor_id: s.advisorId,
        semester: s.semester, student_type: s.studentType || 'normal',
      }),
    });
    setStudents(prev => [...prev, mapStudent(res)]);
  }, []);

  const updateStudent = useCallback(async (id: string, data: Partial<Student>) => {
    const res = await apiFetch<any>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        first_name: data.firstName, last_name: data.lastName,
        gpa: data.gpa, phone_number: data.phoneNumber,
        advisor_id: data.advisorId, semester: data.semester,
        student_type: data.studentType, password: (data as any).password,
      }),
    });
    setStudents(prev => prev.map(s => s.id === id ? mapStudent(res) : s));
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    await apiFetch(`/students/${id}`, { method: 'DELETE' });
    setStudents(prev => prev.filter(s => s.id !== id));
    setAppointments(prev => prev.filter(a => a.studentId !== id));
  }, []);

  const importStudents = useCallback(async (list: any[]) => {
    await apiFetch('/students/import', {
      method: 'POST',
      body: JSON.stringify(list.map(s => ({
        first_name: s.firstName, last_name: s.lastName,
        username: s.username, password: s.password,
        student_number: s.studentNumber, gpa: s.gpa,
        phone_number: s.phoneNumber, advisor_id: s.advisorId,
        semester: s.semester, student_type: s.studentType || 'normal',
      }))),
    });
    await refreshAll();
  }, [refreshAll]);

  // ─── Advisors ────────────────────────────────────────
  const addAdvisor = useCallback(async (a: any) => {
    const res = await apiFetch<any>('/advisors', {
      method: 'POST',
      body: JSON.stringify({
        first_name: a.firstName, last_name: a.lastName,
        username: a.username, password: a.password,
        specialty: a.specialty, faculty: a.faculty,
      }),
    });
    setAdvisors(prev => [...prev, mapAdvisor(res)]);
  }, []);

  const updateAdvisor = useCallback(async (id: string, data: Partial<Advisor>) => {
    const res = await apiFetch<any>(`/advisors/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        first_name: data.firstName, last_name: data.lastName,
        specialty: data.specialty, faculty: data.faculty,
      }),
    });
    setAdvisors(prev => prev.map(a => a.id === id ? mapAdvisor(res) : a));
  }, []);

  const deleteAdvisor = useCallback(async (id: string) => {
    await apiFetch(`/advisors/${id}`, { method: 'DELETE' });
    setAdvisors(prev => prev.filter(a => a.id !== id));
  }, []);

  const updateAvailability = useCallback(async (advisorId: string, availability: Advisor['availability']) => {
    const res = await apiFetch<any>(`/advisors/${advisorId}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ availability }),
    });
    setAdvisors(prev => prev.map(a => a.id === advisorId ? mapAdvisor(res) : a));
  }, []);

  // ─── Appointments ─────────────────────────────────────
  const addAppointment = useCallback(async (a: any) => {
    const res = await apiFetch<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        student_id: a.studentId, advisor_id: a.advisorId,
        date: a.date, time: a.time,
        appointment_type: a.appointmentType, description: a.description,
      }),
    });
    setAppointments(prev => [...prev, mapAppointment(res)]);
  }, []);

  const updateAppointmentStatus = useCallback(async (id: string, status: Appointment['status'], rejectionReason?: string) => {
    const res = await apiFetch<any>(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejection_reason: rejectionReason }),
    });
    setAppointments(prev => prev.map(a => a.id === id ? mapAppointment(res) : a));
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    await apiFetch(`/appointments/${id}`, { method: 'DELETE' });
    setAppointments(prev => prev.filter(a => a.id !== id));
  }, []);

  // ─── Sessions ─────────────────────────────────────────
  const addSession = useCallback(async (studentId: string, session: Omit<Session, 'id'>) => {
    const res = await apiFetch<any>(`/students/${studentId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(session),
    });
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      return { ...s, sessions: [...s.sessions, res], totalSessions: s.totalSessions + 1 };
    }));
  }, []);

  // ─── Messages ─────────────────────────────────────────
  const sendMessage = useCallback(async (msg: any) => {
    const res = await apiFetch<any>('/messages', {
      method: 'POST',
      body: JSON.stringify({
        sender_id: msg.senderId, sender_name: msg.senderName,
        sender_role: msg.senderRole, receiver_id: msg.receiverId,
        receiver_name: msg.receiverName, receiver_role: msg.receiverRole,
        department: msg.department, subject: msg.subject, body: msg.body,
      }),
    });
    setMessages(prev => [...prev, mapMessage(res)]);
  }, []);

  const replyToMessage = useCallback(async (messageId: string, reply: any) => {
    const res = await apiFetch<any>(`/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({
        sender_id: reply.senderId, sender_name: reply.senderName,
        sender_role: reply.senderRole, body: reply.body,
      }),
    });
    setMessages(prev => prev.map(m => m.id === messageId ? mapMessage(res) : m));
  }, []);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    await apiFetch(`/messages/${messageId}/read`, { method: 'PUT' });
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
  }, []);

  // ─── Local Getters ────────────────────────────────────
  const getStudentsByAdvisor     = useCallback((id: string) => students.filter(s => s.advisorId === id), [students]);
  const getAppointmentsByAdvisor = useCallback((id: string) => appointments.filter(a => a.advisorId === id), [appointments]);
  const getAppointmentsByStudent = useCallback((id: string) => appointments.filter(a => a.studentId === id), [appointments]);
  const getMessagesByUser        = useCallback((id: string) => messages.filter(m => m.senderId === id || m.receiverId === id), [messages]);
  const getMessagesByDepartment  = useCallback((dept: string) => messages.filter(m => m.department === dept), [messages]);
  const getUnreadCount           = useCallback((id: string) => messages.filter(m => (m.receiverId === id || m.senderId === id) && !m.isRead).length, [messages]);

  return (
    <DataContext.Provider value={{
      students, advisors, appointments, messages, loading, refreshAll,
      addStudent, updateStudent, deleteStudent, importStudents,
      addAdvisor, updateAdvisor, deleteAdvisor, updateAvailability,
      addAppointment, updateAppointmentStatus, deleteAppointment,
      addSession,
      getStudentsByAdvisor, getAppointmentsByAdvisor, getAppointmentsByStudent,
      sendMessage, replyToMessage, getMessagesByUser, getMessagesByDepartment,
      markMessageAsRead, getUnreadCount,
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
