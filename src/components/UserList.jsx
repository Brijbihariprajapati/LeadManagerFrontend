'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import AdminUsersTable from '@/components/admin/AdminUsersTable';
import { LMS_ADMIN_USERS_CHANGED } from '@/lib/adminEvents';
import { safeUsersArray } from '@/lib/apiSafe';

export default function UserList({ onChanged }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(safeUsersArray(data));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load users');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    const onRefresh = () => {
      void load(true);
      onChangedRef.current?.();
    };
    window.addEventListener(LMS_ADMIN_USERS_CHANGED, onRefresh);
    return () => window.removeEventListener(LMS_ADMIN_USERS_CHANGED, onRefresh);
  }, [load]);

  const deactivate = async (id) => {
    try {
      await api.deactivateUser(id);
      toast.success('User deactivated');
      await load(true);
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    }
  };

  const activate = async (id) => {
    try {
      await api.activateUser(id);
      toast.success('User activated');
      await load(true);
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await api.deleteUser(id);
      toast.success('User deleted');
      await load(true);
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <section className="lms-team-panel">
      <header className="lms-team-panel__header">
        <div>
          <h2 className="lms-team-panel__title">Workspace members</h2>
          <p className="lms-team-panel__subtitle">Click a card for profile · Settings opens account and access</p>
        </div>
        <span className="lms-team-panel__badge" aria-label={`${users.length} members`}>
          {loading ? '…' : users.length}
        </span>
      </header>
      <div className="lms-team-panel__body">
        <AdminUsersTable
          users={users}
          loading={loading}
          onDeactivate={deactivate}
          onActivate={activate}
          onDelete={remove}
        />
      </div>
    </section>
  );
}
