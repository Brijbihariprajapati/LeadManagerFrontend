import { Link, useNavigate } from 'react-router-dom';

function initials(name) {
  const t = String(name || '').trim();
  if (!t) return '?';
  return t.charAt(0).toUpperCase();
}

/**
 * Team roster — card rows (no plain table). Role column omitted (list is workspace users only).
 */
export default function AdminUsersTable({
  users,
  loading,
  onDeactivate,
  onActivate,
  onDelete,
}) {
  const navigate = useNavigate();

  const goDetail = (id) => {
    navigate(`/admin/team/${id}`);
  };

  return (
    <div className="lms-team-roster">
      {loading && users.length === 0 && (
        <div className="lms-team-roster__empty">
          <div className="lms-team-roster__skeleton rounded-3 mb-2" style={{ height: 12, width: '40%' }} />
          <div className="lms-team-roster__skeleton rounded-3" style={{ height: 72 }} />
          <div className="lms-team-roster__skeleton rounded-3 mt-2" style={{ height: 72 }} />
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="lms-team-roster__empty lms-team-roster__empty--message">
          <p className="text-muted mb-0">No team members yet. Use Create user in the header.</p>
        </div>
      )}

      {!loading &&
        users.map((u) => (
          <article
            key={u._id}
            className="lms-team-roster__card"
            tabIndex={0}
            role="button"
            onClick={() => goDetail(u._id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goDetail(u._id);
              }
            }}
            aria-label={`Open profile for ${u.name}`}
          >
            <div className="lms-team-roster__avatar" aria-hidden>
              {initials(u.name)}
            </div>
            <div className="lms-team-roster__body">
              <div className="lms-team-roster__name text-break">{u.name}</div>
              <div className="lms-team-roster__email text-break" title={u.email}>
                {u.email}
              </div>
            </div>
            <div className="lms-team-roster__status">
              {u.isActive ? (
                <span className="lms-team-roster__pill lms-team-roster__pill--on">Active</span>
              ) : (
                <span className="lms-team-roster__pill lms-team-roster__pill--off">Inactive</span>
              )}
            </div>
            <div
              className="lms-team-roster__actions"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Link
                to={`/admin/team/${u._id}?tab=settings`}
                className="btn btn-sm lms-team-roster__link"
                onClick={(e) => e.stopPropagation()}
              >
                Settings
              </Link>
              {u.role === 'user' ? (
                <>
                  {u.isActive ? (
                    <button
                      type="button"
                      className="btn btn-sm lms-team-roster__btn lms-team-roster__btn--warn"
                      onClick={() => onDeactivate(u._id)}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm lms-team-roster__btn lms-team-roster__btn--ok"
                      onClick={() => onActivate(u._id)}
                    >
                      Activate
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm lms-team-roster__btn lms-team-roster__btn--danger"
                    onClick={() => onDelete(u._id)}
                  >
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ))}
    </div>
  );
}
