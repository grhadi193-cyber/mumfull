// Some embedded browsers block localStorage. Keep the app usable for the
// current page session in that case instead of failing during rendering.
const memory = new Map<string, string>();

export const storage = {
  getItem(key: string): string | null {
    try { return window.localStorage.getItem(key); }
    catch { return memory.get(key) ?? null; }
  },
  setItem(key: string, value: string): void {
    try { window.localStorage.setItem(key, value); }
    catch { memory.set(key, value); }
  },
  removeItem(key: string): void {
    memory.delete(key);
    try { window.localStorage.removeItem(key); }
    catch { /* Storage is unavailable; the in-memory copy was removed. */ }
  },
};
