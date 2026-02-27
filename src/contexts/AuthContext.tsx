import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { apiFetch } from '@/utils/api';
import type { Admin, Advisor, Student, SpecialRole } from '@/utils/mockData';

type User = Admin | Advisor | Student | SpecialRole;

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (username: string, password: string) => {
    try {
      const data = await apiFetch<{ access_token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem('token', data.access_token);

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
      localStorage.setItem('currentUser', JSON.stringify(mappedUser));
      return { success: true, message: 'ورود موفق' };
    } catch (e: any) {
      return { success: false, message: e?.detail || 'نام کاربری یا رمز عبور اشتباه است' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
