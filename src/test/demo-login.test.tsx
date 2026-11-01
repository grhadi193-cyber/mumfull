// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider, useData } from '@/contexts/DataContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Login from '@/components/Login';

function AppForTest() {
  const { user, isDemo, logout } = useAuth();
  const { students, appointments, addAppointment } = useData();
  return user ? <>
    <div data-testid="role">{user.role}</div>
    <div data-testid="demo">{String(isDemo)}</div>
    <div data-testid="students">{students.length}</div>
    <div data-testid="appointments">{appointments.length}</div>
    <button onClick={() => addAppointment({ studentId: 'student1', advisorId: 'advisor1', date: '1404/01/01', time: '10:00', appointmentType: { label: 'test', value: 'test' }, status: 'pending', description: '' })}>add</button>
    <button onClick={logout}>logout</button>
  </> : <Login />;
}

function mount() {
  return render(<ToastProvider><AuthProvider><DataProvider><AppForTest /></DataProvider></AuthProvider></ToastProvider>);
}

beforeEach(() => { localStorage.clear(); vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network error'))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('demo logins', () => {
  it.each([
    ['مدیر سیستم', 'admin'], ['استاد مشاور', 'advisor'], ['دانشجو', 'student'],
    ['مرکز مشاوره', 'counseling_center'], ['مسئول آموزش', 'education_admin'],
    ['مسئول اساتید مشاور', 'advisor_supervisor'], ['مدیر گروه', 'department_head'],
  ])('opens %s without a backend', (label, role) => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.getByTestId('role').textContent).toBe(role);
    expect(screen.getByTestId('demo').textContent).toBe('true');
    expect(Number(screen.getByTestId('students').textContent)).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('persists demo data and session across reload and clears the session on logout', async () => {
    const view = mount();
    fireEvent.click(screen.getByRole('button', { name: 'دانشجو' }));
    const count = Number(screen.getByTestId('appointments').textContent);
    fireEvent.click(screen.getByText('add'));
    await waitFor(() => expect(Number(screen.getByTestId('appointments').textContent)).toBe(count + 1));
    view.unmount();
    mount();
    expect(screen.getByTestId('role').textContent).toBe('student');
    expect(Number(screen.getByTestId('appointments').textContent)).toBe(count + 1);
    fireEvent.click(screen.getByText('logout'));
    expect(localStorage.getItem('authMode')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
  });

  it('does not report a network error as a wrong password for real login', async () => {
    mount();
    fireEvent.change(screen.getByPlaceholderText('نام کاربری خود را وارد کنید'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('رمز عبور خود را وارد کنید'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'ورود به سامانه' }));
    expect(await screen.findByText('اتصال به سرور برقرار نشد. لطفاً اتصال و تنظیمات سرور را بررسی کنید.')).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
  });
});
