// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from '@/App';

beforeEach(() => { window.history.replaceState({}, '', '/'); localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('renders the actual login page and opens a demo dashboard', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'دانشجو' }));
  expect(await screen.findByText('حالت آزمایشی · داده‌ها فقط در این مرورگر ذخیره می‌شوند')).toBeTruthy();
  expect(window.location.pathname).toBe('/student');
});

it.each(['{invalid', '{"id":"old","role":"unknown"}', '{"id":"old","role":"admin"}'])('ignores invalid or stale stored session %s', saved => {
  localStorage.setItem('currentUser', saved);
  render(<App />);
  expect(screen.getByRole('button', { name: 'مدیر سیستم' })).toBeTruthy();
});

it('renders and allows demo login when localStorage is blocked', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'دانشجو' }));
  expect(await screen.findByText('حالت آزمایشی · داده‌ها فقط در این مرورگر ذخیره می‌شوند')).toBeTruthy();
});
