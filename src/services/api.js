import axios from 'axios';

/** @type {string} */
export const AUTH_TOKEN_KEY = 'lms_auth_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Local dev: VITE_USE_API_PROXY=1 → same-origin `/api` (Vite proxies to backend).
 * Production: set VITE_API_URL to your API origin, or serve the SPA behind a reverse proxy
 * that forwards `/api` to the API (then use VITE_USE_API_PROXY=1 with empty base).
 */
const useProxy =
  import.meta.env.VITE_USE_API_PROXY === '1' ||
  import.meta.env.VITE_USE_API_PROXY === 'true';
const raw = import.meta.env.VITE_API_URL?.trim();

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
if (useProxy) {
  baseURL = '';
} else if (raw) {
  baseURL = raw;
}

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const t = getStoredToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

export async function login(payload) {
  const { data } = await client.post('/api/auth/login', payload);
  if (data?.token) setStoredToken(data.token);
  return data;
}

export async function logout() {
  try {
    await client.post('/api/auth/logout');
  } catch {
    /* still clear client session */
  } finally {
    setStoredToken(null);
  }
  return { success: true };
}

export async function getMe() {
  const { data } = await client.get('/api/auth/me');
  return data;
}

export async function createUser(payload) {
  const { data } = await client.post('/api/users', payload);
  return data;
}

export async function getUsers() {
  const { data } = await client.get('/api/users');
  return data;
}

export async function getUser(id) {
  const { data } = await client.get(`/api/users/${id}`);
  return data;
}

/** Admin or self: leads created by that user */
export async function getLeadsByUser(userId, params = {}) {
  const { data } = await client.get(`/api/leads/user/${userId}`, { params });
  return data;
}

/** Admin: funnel counts for one user’s leads */
export async function getUserLeadSummary(userId) {
  const { data } = await client.get(`/api/leads/user/${userId}/summary`);
  return data;
}

export async function deleteUser(id) {
  const { data } = await client.delete(`/api/users/${id}`);
  return data;
}

export async function deactivateUser(id) {
  const { data } = await client.patch(`/api/users/${id}/deactivate`);
  return data;
}

export async function activateUser(id) {
  const { data } = await client.patch(`/api/users/${id}/activate`);
  return data;
}

/** Admin: update user name, email, and/or password (omit password to leave unchanged) */
export async function updateUser(id, payload) {
  const { data } = await client.patch(`/api/users/${id}`, payload);
  return data;
}

export async function getLeads(params = {}) {
  const { data } = await client.get('/api/leads', { params });
  return data;
}

export async function getLead(id) {
  const { data } = await client.get(`/api/leads/${id}`);
  return data;
}

export async function createLead(payload) {
  const { data } = await client.post('/api/leads', payload);
  return data;
}

export async function updateLeadStatus(id, status) {
  const { data } = await client.patch(`/api/leads/${id}/status`, { status });
  return data;
}

export async function updateLeadOutcome(id, { interest, pipeline }) {
  const { data } = await client.patch(`/api/leads/${id}/outcome`, { interest, pipeline });
  return data;
}

export async function updateLeadNotes(id, notes) {
  const { data } = await client.patch(`/api/leads/${id}/notes`, { notes });
  return data;
}

export async function updateLead(id, payload) {
  const { data } = await client.patch(`/api/leads/${id}`, payload);
  return data;
}

export async function deleteLead(id) {
  const { data } = await client.delete(`/api/leads/${id}`);
  return data;
}

export async function getDashboardSummary() {
  const { data } = await client.get('/api/leads/dashboard/summary');
  return data;
}

/**
 * @param {{ period?: string, from?: string, to?: string }} params
 * Preset: `period`. Custom range: both `from` and `to` (YYYY-MM-DD, UTC).
 */
export async function getLeadAnalytics(params = {}) {
  const { period, from, to } = params;
  const query = {};
  if (from && to) {
    query.from = from;
    query.to = to;
  } else if (period) {
    query.period = period;
  } else {
    query.period = 'monthly';
  }
  const { data } = await client.get('/api/leads/analytics', { params: query });
  return data;
}

export async function getPublicLeads(params = {}) {
  const { data } = await client.get('/api/leads/public', { params });
  return data;
}

/** Admin: full DB export as CSV (blob). Use `response.headers['content-disposition']` for filename. */
export async function getLeadsFullExport() {
  return client.get('/api/leads/export/full', { responseType: 'blob' });
}

/** Auth required — same fields as list row, for shared-board detail view */
export async function getPublicLead(id) {
  const { data } = await client.get(`/api/leads/public/${id}`);
  return data;
}

/** Saved proposal JSON for a lead (or `proposal: null`) */
export async function getLeadProposal(leadId) {
  const { data } = await client.get(`/api/leads/${leadId}/proposal`);
  return data;
}

/** Upsert proposal `data` object for a lead */
export async function saveLeadProposal(leadId, proposalData) {
  const { data } = await client.post(`/api/leads/${leadId}/proposal`, {
    data: proposalData,
  });
  return data;
}

export default client;
