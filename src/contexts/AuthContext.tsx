import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { initialAdmins, initialAdvisors, initialStudents, initialSpecialRoles, type Admin, type Advisor, type Student, type SpecialRole } from '@/utils/mockData';

type User = Admin | Advisor | Student | SpecialRole;

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((username: string, password: string) => {
    // Check admin
    const admin = initialAdmins.find(a => a.username === username && a.password === password);
    if (admin) {
      setUser(admin);
      localStorage.setItem('currentUser', JSON.stringify(admin));
      return { success: true, message: 'ورود موفق' };
    }

    // Check special roles
    const specialUser = initialSpecialRoles.find(s => s.username === username && s.password === password);
    if (specialUser) {
      setUser(specialUser);
      localStorage.setItem('currentUser', JSON.stringify(specialUser));
      return { success: true, message: 'ورود موفق' };
    }

    // Check advisors
    const storedAdvisors = localStorage.getItem('advisors');
    const advisors: Advisor[] = storedAdvisors ? JSON.parse(storedAdvisors) : initialAdvisors;
    const advisor = advisors.find(a => a.username === username && a.password === password);
    if (advisor) {
      setUser(advisor);
      localStorage.setItem('currentUser', JSON.stringify(advisor));
      return { success: true, message: 'ورود موفق' };
    }

    // Check students
    const storedStudents = localStorage.getItem('students');
    const students: Student[] = storedStudents ? JSON.parse(storedStudents) : initialStudents;
    const student = students.find(s => (s.username === username || s.studentNumber === username) && s.password === password);
    if (student) {
      setUser(student);
      localStorage.setItem('currentUser', JSON.stringify(student));
      return { success: true, message: 'ورود موفق' };
    }

    return { success: false, message: 'نام کاربری یا رمز عبور اشتباه است' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUser');
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
