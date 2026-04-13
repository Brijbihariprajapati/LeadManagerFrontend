'use client';

import { useState } from 'react';

function IconUser({ className = '' }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMail({ className = '' }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconLock({ className = '' }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

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

/**
 * Shared create-user fields (role: user). Used inside the team modal.
 */
export default function UserCreateForm({
  form,
  setForm,
  submitting,
  onSubmit,
  submitLabel = 'Create user',
  onCancel,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const pwdLen = form.password?.length ?? 0;
  const pwdOk = pwdLen >= 6;

  return (
    <form onSubmit={onSubmit} noValidate className="lms-create-user-form">
      <div className="lms-create-field">
        <label className="lms-create-field__label" htmlFor="lms-create-user-name">
          <span className="lms-create-field__icon" aria-hidden>
            <IconUser />
          </span>
          Full name
        </label>
        <input
          id="lms-create-user-name"
          className="form-control lms-create-field__input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          autoComplete="name"
          placeholder="e.g. Priya Sharma"
        />
      </div>

      <div className="lms-create-field">
        <label className="lms-create-field__label" htmlFor="lms-create-user-email">
          <span className="lms-create-field__icon" aria-hidden>
            <IconMail />
          </span>
          Email
        </label>
        <input
          id="lms-create-user-email"
          type="email"
          className="form-control lms-create-field__input"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
          autoComplete="email"
          placeholder="name@company.com"
        />
      </div>

      <div className="lms-create-field lms-create-field--password">
        <label className="lms-create-field__label" htmlFor="lms-create-user-password">
          <span className="lms-create-field__icon" aria-hidden>
            <IconLock />
          </span>
          Password
        </label>
        <div className="position-relative lms-input-password">
          <input
            id="lms-create-user-password"
            type={showPassword ? 'text' : 'password'}
            className="form-control lms-create-field__input pe-5"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={6}
            maxLength={128}
            autoComplete="new-password"
            placeholder="At least 6 characters"
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
        <div className="lms-create-password-hint" aria-live="polite">
          <span className={`lms-create-password-hint__msg ${pwdOk ? 'is-valid' : ''}`}>
            {pwdOk ? '✓ Ready to use' : 'Minimum 6 characters'}
          </span>
          <span className="lms-create-password-hint__count">{pwdLen}/128</span>
        </div>
      </div>

      <div className="lms-create-form__actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-outline-secondary lms-create-form__cancel"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary lms-create-form__submit" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2 text-light" role="status" aria-hidden />
              Creating…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
