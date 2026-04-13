'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  applyThemeToDocument,
  getStoredTheme,
  setLastActiveShell,
  setStoredTheme,
} from '@/lib/lmsTheme';

function IconSun({ className = '' }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconMoon({ className = '' }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * @param {{ scope: 'user' | 'admin' }} props
 */
export default function ThemeToggle({ scope }) {
  const [mode, setMode] = useState('dark');

  useEffect(() => {
    const next = getStoredTheme(scope);
    setMode(next);
    applyThemeToDocument(next);
    setLastActiveShell(scope);
  }, [scope]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== `lms-theme-${scope}` || e.newValue == null) return;
      const next = e.newValue === 'light' ? 'light' : 'dark';
      setMode(next);
      applyThemeToDocument(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [scope]);

  const toggle = useCallback(() => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    setStoredTheme(scope, next);
    setLastActiveShell(scope);
    applyThemeToDocument(next);
  }, [mode, scope]);

  const isLight = mode === 'light';
  const label = isLight ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <button
      type="button"
      className="btn lms-theme-toggle"
      onClick={toggle}
      title={label}
      aria-label={label}
    >
      {isLight ? <IconMoon /> : <IconSun />}
    </button>
  );
}
