import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import { useAuth } from '@/components/Providers';

function IconEyeOpen({ className = '' }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ className = '' }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      const u = data?.user;
      if (!u || typeof u !== 'object' || u.role == null) {
        toast.error('Invalid response from server');
        return;
      }
      setUser(u);
      toast.success('Welcome back');
      navigate(u.role === 'admin' ? '/admin' : '/user', { replace: true });
    } catch (err) {
      const d = err.response?.data;
      const first =
        Array.isArray(d?.errors) && d.errors.length > 0 ? d.errors[0].msg : null;
      toast.error(first || d?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell px-3">
      <div className="card login-card shadow">
        <div className="card-body p-4">
          <div className="text-center mb-3">
            <img
              src="/logo.png"
              alt=""
              width={56}
              height={56}
              className="login-brand-mark"
              decoding="async"
            />
          </div>
          <h1 className="h4 mb-1 text-center">Lead Management System</h1>
          <p className="text-muted small text-center mb-4">Sign in with your email and password.</p>
          <form onSubmit={submit} noValidate>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <div className="position-relative lms-input-password">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control pe-5"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="lms-input-password__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                >
                  {showPassword ? <IconEyeOff /> : <IconEyeOpen />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
