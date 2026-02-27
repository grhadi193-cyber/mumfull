import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Login from '@/components/Login';
import Layout from '@/components/Shared/Layout';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import StudentManagement from '@/components/Admin/StudentManagement';
import AdvisorManagement from '@/components/Admin/AdvisorManagement';
import AdminSupportMessages from '@/components/Admin/AdminSupportMessages';
import AdminDownloadTemplates from '@/components/Admin/AdminDownloadTemplates';
import AdminMessages from '@/components/Admin/AdminMessages';
import AdvisorDashboard from '@/components/Advisor/AdvisorDashboard';
import AvailabilitySettings from '@/components/Advisor/AvailabilitySettings';
import AppointmentManagement from '@/components/Advisor/AppointmentManagement';
import AdvisorPerformanceReport from '@/components/Advisor/AdvisorPerformanceReport';
import AdvisorMessages from '@/components/Advisor/AdvisorMessages';
import StudentDashboard from '@/components/Student/StudentDashboard';
import AppointmentRequest from '@/components/Student/AppointmentRequest';
import StudentEvaluation from '@/components/Student/StudentEvaluation';
import SharedSession from '@/components/Student/SharedSession';
import StudentSupport from '@/components/Student/StudentSupport';
import StudentMessages from '@/components/Student/Messages';
import ReferralDashboard from '@/components/SpecialRoles/ReferralDashboard';
import type { ReactNode } from 'react';

function PrivateRoute({ children, roles }: { children: ReactNode; roles: string[] }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  const userRole = (user as any).role;
  if (!roles.includes(userRole)) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AuthRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Login />;
  const role = (user as any).role;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'advisor') return <Navigate to="/advisor" replace />;
  if (role === 'student') return <Navigate to="/student" replace />;
  // Special roles
  if (['counseling_center', 'education_admin', 'advisor_supervisor', 'department_head'].includes(role)) {
    return <Navigate to="/special" replace />;
  }
  return <Navigate to="/login" replace />;
}

const specialRoles = ['counseling_center', 'education_admin', 'advisor_supervisor', 'department_head'];

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRedirect />} />
      <Route path="/" element={<AuthRedirect />} />

      {/* Admin */}
      <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/students" element={<PrivateRoute roles={['admin']}><StudentManagement /></PrivateRoute>} />
      <Route path="/admin/advisors" element={<PrivateRoute roles={['admin']}><AdvisorManagement /></PrivateRoute>} />
      <Route path="/admin/support-messages" element={<PrivateRoute roles={['admin']}><AdminSupportMessages /></PrivateRoute>} />
      <Route path="/admin/download-templates" element={<PrivateRoute roles={['admin']}><AdminDownloadTemplates /></PrivateRoute>} />
      <Route path="/admin/messages" element={<PrivateRoute roles={['admin']}><AdminMessages /></PrivateRoute>} />

      {/* Advisor */}
      <Route path="/advisor" element={<PrivateRoute roles={['advisor']}><AdvisorDashboard /></PrivateRoute>} />
      <Route path="/advisor/availability" element={<PrivateRoute roles={['advisor']}><AvailabilitySettings /></PrivateRoute>} />
      <Route path="/advisor/appointments" element={<PrivateRoute roles={['advisor']}><AppointmentManagement /></PrivateRoute>} />
      <Route path="/advisor/performance" element={<PrivateRoute roles={['advisor']}><AdvisorPerformanceReport /></PrivateRoute>} />
      <Route path="/advisor/messages" element={<PrivateRoute roles={['advisor']}><AdvisorMessages /></PrivateRoute>} />

      {/* Student */}
      <Route path="/student" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
      <Route path="/student/request" element={<PrivateRoute roles={['student']}><AppointmentRequest /></PrivateRoute>} />
      <Route path="/student/evaluation" element={<PrivateRoute roles={['student']}><StudentEvaluation /></PrivateRoute>} />
      <Route path="/student/shared-session" element={<PrivateRoute roles={['student']}><SharedSession /></PrivateRoute>} />
      <Route path="/student/support" element={<PrivateRoute roles={['student']}><StudentSupport /></PrivateRoute>} />
      <Route path="/student/messages" element={<PrivateRoute roles={['student']}><StudentMessages /></PrivateRoute>} />

      {/* Special Roles */}
      <Route path="/special" element={<PrivateRoute roles={specialRoles}><ReferralDashboard /></PrivateRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
