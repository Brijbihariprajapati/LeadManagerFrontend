'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import { LMS_ADMIN_USERS_CHANGED } from '@/lib/adminEvents';

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

export default function TeamUserSettingsForm({ user, userId, onSaved }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user.name || '');
    setEmail(user.email || '');
    setPassword('');
  }, [user.name, user.email, user.updatedAt]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    if (name.trim() !== user.name) payload.name = name.trim();
    if (email.trim().toLowerCase() !== String(user.email).toLowerCase()) payload.email = email.trim();
    const pw = password.trim();
    if (pw.length > 0) {
      if (pw.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      payload.password = pw;
    }
    if (Object.keys(payload).length === 0) {
      toast.error('Change something before saving');
      return;
    }
    setSaving(true);
    try {
      const data = await api.updateUser(userId, payload);
      toast.success('User updated');
      setPassword('');
      onSaved(data.user);
      window.dispatchEvent(new CustomEvent(LMS_ADMIN_USERS_CHANGED));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="lms-create-user-form" onSubmit={onSubmit} noValidate>
      <p className="text-muted small mb-4">
        Update this team member&apos;s login details. Leave <strong>password</strong> blank to keep the current
        one.
      </p>
      <div className="lms-create-field">
        <label className="lms-create-field__label" htmlFor="lms-settings-name">
          Full name
        </label>
        <input
          id="lms-settings-name"
          className="form-control lms-create-field__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div className="lms-create-field">
        <label className="lms-create-field__label" htmlFor="lms-settings-email">
          Email
        </label>
        <input
          id="lms-settings-email"
          type="email"
          className="form-control lms-create-field__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="lms-create-field lms-create-field--password">
        <label className="lms-create-field__label" htmlFor="lms-settings-password">
          New password
        </label>
        <div className="position-relative lms-input-password">
          <input
            id="lms-settings-password"
            type={showPw ? 'text' : 'password'}
            className="form-control lms-create-field__input pe-5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Leave blank to keep current password"
            maxLength={128}
          />
          <button
            type="button"
            className="lms-input-password__toggle"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPw ? <IconEyeOff /> : <IconEyeOpen />}
          </button>
        </div>
        <p className="text-muted small mt-2 mb-0">Minimum 6 characters when setting a new password.</p>
      </div>
      <div className="lms-create-form__actions">
        <button type="submit" className="btn btn-primary lms-create-form__submit" disabled={saving}>
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2 text-light" role="status" aria-hidden />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </form>
  );
}
