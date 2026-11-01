import { storage } from '@/utils/storage';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { apiFetch } from '@/utils/api';
import { initialAdmins, initialAdvisors, initialStudents, initialSpecialRoles } from '@/utils/mockData';
import type { Admin, Advisor, Student, SpecialRole } from '@/utils/mockData';

type User = Admin | Advisor | Student | SpecialRole;

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginDemo: (username: string) => void;
  isDemo: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = storage.getItem('currentUser');
      const parsed = saved ? JSON.parse(saved) : null;
      const roles = ['admin', 'advisor', 'student', 'counseling_center', 'education_admin', 'advisor_supervisor', 'department_head'];
      if (parsed && typeof parsed.id === 'string' && roles.includes(parsed.role) &&
          (storage.getItem('authMode') === 'demo' || storage.getItem('token'))) return parsed as User;
    } catch { /* Ignore invalid or outdated stored sessions. */ }
    return null;
  });

  const [isDemo, setIsDemo] = useState(() => storage.getItem('authMode') === 'demo');

  const login = useCallback(async (username: string, password: string) => {
    try {
      const data = await apiFetch<{ access_token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      storage.setItem('token', data.access_token);
      storage.removeItem('authMode');
      setIsDemo(false);

      const mappedUser = {
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        advisorId: data.user.advisor_id,
        studentNumber: data.user.student_number,
        title: data.user.title,
        password: '',
      } as unknown as User;

      setUser(mappedUser);
      storage.setItem('currentUser', JSON.stringify(mappedUser));
      return { success: true, message: 'ورود موفق' };
    } catch (e: any) {
      return { success: false, message: typeof e?.detail === 'string' ? e.detail : 'اتصال به سرور برقرار نشد. لطفاً اتصال و تنظیمات سرور را بررسی کنید.' };
    }
  }, []);

  const loginDemo = useCallback((username: string) => {
    const demoUser = [...initialAdmins, ...initialAdvisors, ...initialStudents, ...initialSpecialRoles]
      .find(account => account.username === username);
    if (!demoUser) return;
    const userWithoutPassword = { ...demoUser, password: '' };
    storage.removeItem('token');
    storage.setItem('authMode', 'demo');
    storage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    setIsDemo(true);
    setUser(userWithoutPassword);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    storage.removeItem('currentUser');
    storage.removeItem('token');
    storage.removeItem('authMode');
    setIsDemo(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginDemo, isDemo, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
