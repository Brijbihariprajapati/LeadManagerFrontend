/** Persisted per workspace: user shell vs admin shell. */

export const LMS_THEME_STORAGE = {
  user: 'lms-theme-user',
  admin: 'lms-theme-admin',
};

/** Remember which shell was active so /leads and /public pick the right key before React loads. */
export const LMS_THEME_LAST_SCOPE_KEY = 'lms-theme-last-scope';

/** @param {'user' | 'admin'} scope */
export function getStoredTheme(scope) {
  if (typeof window === 'undefined') return 'dark';
  try {
    const v = window.localStorage.getItem(LMS_THEME_STORAGE[scope]);
    return v === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** @param {'user' | 'admin'} scope @param {'light' | 'dark'} mode */
export function setStoredTheme(scope, mode) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LMS_THEME_STORAGE[scope], mode);
  } catch {
    /* ignore */
  }
}

/** @param {'light' | 'dark'} mode */
export function applyThemeToDocument(mode) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.setAttribute('data-lms-theme', mode);
  html.setAttribute('data-bs-theme', mode === 'light' ? 'light' : 'dark');
}

/** @param {'user' | 'admin'} scope */
export function setLastActiveShell(scope) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LMS_THEME_LAST_SCOPE_KEY, scope);
  } catch {
    /* ignore */
  }
}

