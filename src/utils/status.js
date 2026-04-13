/** Primary: is the lead worth pursuing? (Pending = not decided yet) */
export const INTEREST_OPTIONS = ['Interested', 'Pending', 'Not Interested'];

/**
 * Deal / next-step stages (real pipeline). "Not pursuing" is used only when not interested.
 */
export const PIPELINE_OPTIONS = [
  'Pending',
  'Follow-up',
  'Meeting scheduled',
  'Confirmed',
  'Proposal sent',
  'Negotiation',
  'Closed won',
  'Closed lost',
  'Not pursuing',
];

/** Pipeline choices when interest is Interested */
export const PIPELINE_OPTIONS_ACTIVE = PIPELINE_OPTIONS.filter((p) => p !== 'Not pursuing');

/** @deprecated Legacy single-field status */
export const LEGACY_STATUS_OPTIONS = ['Interested', 'Not Interested', 'Follow-up', 'Pending'];

export function statusBadgeClass(status) {
  return interestBadgeClass(
    status === 'Not Interested' ? 'Not Interested' : 'Interested'
  );
}

export function interestBadgeClass(interest) {
  switch (interest) {
    case 'Interested':
      return 'lms-pill lms-pill--interested';
    case 'Pending':
      return 'lms-pill lms-pill--interest-pending';
    case 'Not Interested':
      return 'lms-pill lms-pill--not-interested';
    default:
      return 'lms-pill lms-pill--pending';
  }
}

export function pipelineBadgeClass(pipeline) {
  switch (pipeline) {
    case 'Follow-up':
      return 'lms-pill lms-pill--followup';
    case 'Meeting scheduled':
    case 'Confirmed':
    case 'Proposal sent':
    case 'Negotiation':
      return 'lms-pill lms-pill--pipeline-hot';
    case 'Closed won':
      return 'lms-pill lms-pill--interested';
    case 'Closed lost':
    case 'Not pursuing':
      return 'lms-pill lms-pill--not-interested';
    case 'Pending':
    default:
      return 'lms-pill lms-pill--pending';
  }
}

export function interestSelectModifier(interest) {
  if (interest === 'Not Interested') return 'not-interested';
  if (interest === 'Pending') return 'interest-pending';
  return 'interested';
}

export function pipelineSelectModifier(pipeline) {
  const map = {
    Pending: 'pending',
    'Follow-up': 'followup',
    'Meeting scheduled': 'meeting',
    Confirmed: 'confirmed',
    'Proposal sent': 'proposal',
    Negotiation: 'negotiation',
    'Closed won': 'won',
    'Closed lost': 'lost',
    'Not pursuing': 'none',
  };
  return map[pipeline] || 'pending';
}

export function interestSelectClass(interest) {
  return `lms-status-select lms-status-select--${interestSelectModifier(interest)}`;
}

export function pipelineSelectClass(pipeline) {
  return `lms-pipeline-select lms-pipeline-select--${pipelineSelectModifier(pipeline)}`;
}
