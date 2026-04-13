'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import UserCreateForm from '@/components/admin/UserCreateForm';
import { LMS_ADMIN_USERS_CHANGED } from '@/lib/adminEvents';

/** Modal opened from admin top bar on Team page. */
export default function AdminCreateUserModal({ open, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm({ name: '', email: '', password: '' });
    }
  }, [open]);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      setSubmitting(true);
      try {
        await api.createUser({ ...form, role: 'user' });
        toast.success('User created');
        setForm({ name: '', email: '', password: '' });
        window.dispatchEvent(new CustomEvent(LMS_ADMIN_USERS_CHANGED));
        onClose();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not create user');
      } finally {
        setSubmitting(false);
      }
    },
    [form, onClose]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="modal-backdrop fade show lms-admin-modal-backdrop lms-admin-modal-backdrop--enter"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="modal fade show d-block lms-admin-modal lms-admin-modal--create"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lms-admin-create-user-title"
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable lms-admin-create-modal__dialog">
          <div className="modal-content lms-admin-modal__content lms-admin-create-modal__content border-0 shadow-lg">
            <div className="lms-admin-create-modal__accent" aria-hidden />
            <div className="modal-header border-0 align-items-start lms-admin-create-modal__header">
              <div className="flex-grow-1 min-w-0 pe-2">
                <p className="lms-admin-create-modal__eyebrow mb-1">Invite</p>
                <h2 className="modal-title h5 mb-2 fw-bold" id="lms-admin-create-user-title">
                  Create user
                </h2>
                <p className="text-muted small mb-0 lh-base">
                  New accounts use the <strong className="text-body">User</strong> role — sign in, then create
                  and manage leads.
                </p>
              </div>
              <button
                type="button"
                className="btn-close lms-admin-create-modal__close"
                aria-label="Close"
                onClick={onClose}
              />
            </div>
            <div className="modal-body pt-0 pb-4 px-4">
              <UserCreateForm
                form={form}
                setForm={setForm}
                submitting={submitting}
                onSubmit={onSubmit}
                onCancel={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
