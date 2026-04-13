'use client';

const STAT_CONFIG = [
  {
    key: 'total',
    label: 'Total leads',
    getValue: (s) => s.total,
    cardClass: 'lms-stat-card--total',
    Icon: IconStack,
  },
  {
    key: 'interested',
    label: 'Interested',
    getValue: (s) => s.interested,
    cardClass: 'lms-stat-card--interested',
    Icon: IconCheck,
  },
  {
    key: 'interestPending',
    label: 'Interest pending',
    getValue: (s) => s.interestPending ?? 0,
    cardClass: 'lms-stat-card--interest-pending',
    Icon: IconHelp,
  },
  {
    key: 'not',
    label: 'Not interested',
    getValue: (s) => s.notInterested,
    cardClass: 'lms-stat-card--not',
    Icon: IconX,
  },
  {
    key: 'follow',
    label: 'Follow-up',
    getValue: (s) => s.followUp,
    cardClass: 'lms-stat-card--follow',
    Icon: IconClock,
  },
  {
    key: 'pending',
    label: 'Pipeline: pending',
    getValue: (s) => s.pending,
    cardClass: 'lms-stat-card--pending',
    Icon: IconHourglass,
  },
  {
    key: 'proposalCreated',
    label: 'Proposal created',
    getValue: (s) => s.proposalCreated ?? 0,
    cardClass: 'lms-stat-card--proposal',
    Icon: IconDocument,
  },
];

export default function SummaryCards({ summary, loading }) {
  if (loading) {
    return (
      <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3 g-lg-4 mb-4 lms-stat-grid align-items-stretch">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="col">
            <div className="lms-stat-card lms-stat-card--kpi placeholder-glow h-100" aria-hidden>
              <div className="lms-stat-card__inner">
                <div className="lms-stat-card__head">
                  <span className="placeholder rounded-3" style={{ width: 40, height: 40 }} />
                </div>
                <span className="placeholder rounded-2" style={{ height: 34, width: '3.5rem' }} />
                <span className="placeholder rounded-2 w-100" style={{ height: 12 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3 g-lg-4 mb-4 lms-stat-grid align-items-stretch">
      {STAT_CONFIG.map(({ label, getValue, cardClass, Icon }, idx) => {
        const n = getValue(summary);
        return (
          <div
            key={label}
            className="col"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <article
              className={`lms-stat-card lms-stat-card--kpi ${cardClass} h-100`}
              aria-label={`${label}: ${n}`}
              tabIndex={0}
            >
              <div className="lms-stat-card__glow" aria-hidden />
              <div className="lms-stat-card__inner">
                <div className="lms-stat-card__head">
                  <span className="lms-stat-card__icon" aria-hidden>
                    <Icon />
                  </span>
                </div>
                <div className="lms-stat-card__figure tabular-nums">{n}</div>
                <p className="lms-stat-card__caption" title={label}>
                  {label}
                </p>
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}

function IconStack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconHourglass() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
