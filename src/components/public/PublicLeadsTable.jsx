import { useNavigate } from 'react-router-dom';
import { interestBadgeClass } from '@/utils/status';
import { formatLeadDateTime } from '@/utils/dateFormat';
import { useAuth } from '@/components/Providers';
import { LeadsTableSkeletonRows } from '@/components/leads/LeadsTableSkeleton';

const COL_SPAN = 8;

/**
 * All-leads board: `/leads/[id]` if admin or lead created by current user; else `/public/[id]`.
 */
export default function PublicLeadsTable({ leads, initialLoading, loadingMore }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const openLead = (lead) => {
    const id = lead.id;
    if (user?.role === 'admin') {
      navigate(`/leads/${id}`);
      return;
    }
    if (
      user?.role === 'user' &&
      lead.createdById != null &&
      String(user.id) === String(lead.createdById)
    ) {
      navigate(`/leads/${id}`);
      return;
    }
    navigate(`/public/${id}`);
  };

  const showSkeletonInitial = initialLoading && leads.length === 0;
  const showEmpty = !initialLoading && leads.length === 0;

  return (
    <div className="lms-leads-table-root lms-public-board">
      <div className="table-responsive lms-card lms-data-table">
        <table className="table table-hover align-middle mb-0 lms-table-leads">
          <thead className="lms-table-head">
            <tr>
              <th className="text-center lms-public-th-sr">Sr. No.</th>
              <th>Lead name</th>
              <th>Source</th>
              <th>Email</th>
              <th>Interest status</th>
              <th>Proposal</th>
              <th>Added by</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {showSkeletonInitial && <LeadsTableSkeletonRows rows={10} cols={COL_SPAN} />}
            {showEmpty && (
              <tr>
                <td colSpan={COL_SPAN} className="text-center py-4 text-muted">
                  No leads yet.
                </td>
              </tr>
            )}
            {!showSkeletonInitial &&
              leads.map((lead, idx) => {
                const serial = idx + 1;
                const id = lead.id;
                return (
                  <tr
                    key={id}
                    className="lms-leads-row--clickable"
                    tabIndex={0}
                    role="button"
                    onClick={() => openLead(lead)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openLead(lead);
                      }
                    }}
                  >
                    <td className="small text-muted text-center lms-public-td-sr">{serial}</td>
                    <td className="fw-medium">
                      <span className="lms-public-ellipsis" title={lead.name}>
                        {lead.name}
                      </span>
                    </td>
                    <td className="small">
                      <span
                        className="lms-public-ellipsis"
                        title={lead.sourceName?.trim() || ''}
                      >
                        {lead.sourceName?.trim() ? lead.sourceName.trim() : '—'}
                      </span>
                    </td>
                    <td className="small">
                      <span className="lms-public-ellipsis" title={lead.email || ''}>
                        {lead.email || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${interestBadgeClass(lead.interest || 'Interested')} lms-public-pill`}
                      >
                        {lead.interest || 'Interested'}
                      </span>
                    </td>
                    <td className="small text-nowrap">
                      {lead.hasProposal ? (
                        <span className="text-success">Proposal created</span>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td className="small">
                      <span className="lms-public-ellipsis" title={lead.createdByName || ''}>
                        {lead.createdByName || '—'}
                      </span>
                    </td>
                    <td className="small text-muted text-nowrap">
                      {lead.createdAt ? formatLeadDateTime(lead.createdAt) : '—'}
                    </td>
                  </tr>
                );
              })}
            {loadingMore && !showSkeletonInitial && (
              <LeadsTableSkeletonRows rows={3} cols={COL_SPAN} />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
