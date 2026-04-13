/**
 * Safe parsing for API JSON so missing fields never crash the UI.
 * Use after a successful axios response (2xx). Errors still belong in catch().
 */

export function safeLeadsArray(data) {
  const list = data?.leads;
  return Array.isArray(list) ? list : [];
}

export function safeUsersArray(data) {
  const list = data?.users;
  return Array.isArray(list) ? list : [];
}

/** Dashboard / user summary KPI object, or null if absent. */
export function safeSummary(data) {
  const s = data?.summary;
  if (!s || typeof s !== 'object') return null;
  return s;
}

/**
 * Pagination from list endpoints — always returns a full object.
 * @param {object} data - API response body
 * @param {number} defaultLimit - fallback limit when missing
 */
export function safePagination(data, defaultLimit = 20) {
  const p = data?.pagination;
  if (!p || typeof p !== 'object') {
    return { page: 1, limit: defaultLimit, total: 0, pages: 1 };
  }
  const page = Math.max(1, parseInt(p.page, 10) || 1);
  const limit = Math.max(1, parseInt(p.limit, 10) || defaultLimit);
  const total = Math.max(0, parseInt(p.total, 10) || 0);
  const pages = Math.max(1, parseInt(p.pages, 10) || 1);
  return { page, limit, total, pages };
}

/** Single lead from GET /api/leads/:id or similar — null if missing. */
export function safeLeadRecord(data) {
  const lead = data?.lead;
  if (!lead || typeof lead !== 'object') return null;
  return lead;
}

/** Public lead detail body. */
export function safePublicLeadRecord(data) {
  return safeLeadRecord(data);
}

/** Single user from GET user — null if missing. */
export function safeUserRecord(data) {
  const u = data?.user;
  if (!u || typeof u !== 'object') return null;
  return u;
}
