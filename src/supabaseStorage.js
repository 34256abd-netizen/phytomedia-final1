import { loadFromLocalStorage, saveToLocalStorage } from '../backup-localStorage.js';

// Shared catalog (mentors and jobs) lives behind same-origin /api/load and /api/save.
// Everything else (students, bookings, accounts) stays in the visitor's own browser.
// The server is optional: if it is not configured, the app just uses localStorage.
const API_BASE = '';

export let supabase = null;
export let isSupabaseConnected = true;

export async function loadFromStorageEngine(state, INITIAL_DATA, checkAndApplyAutoBlock, loadCVAndPortfolio, syncCVWithTimaCard) {
  loadFromLocalStorage(state, INITIAL_DATA, checkAndApplyAutoBlock, loadCVAndPortfolio, syncCVWithTimaCard);
  try {
    const res = await fetch(API_BASE + '/api/load');
    if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) return;
    const dataMap = await res.json();
    if (Array.isArray(dataMap.mentors) && dataMap.mentors.length) state.mentors = dataMap.mentors;
    if (Array.isArray(dataMap.jobs) && dataMap.jobs.length) state.jobs = dataMap.jobs;
    saveToLocalStorage(state);
  } catch (e) { /* offline or server not configured: keep local data */ }
}

let lastCatalog = '';
export async function saveToStorageEngine(state) {
  saveToLocalStorage(state);
  let token = null;
  try { token = sessionStorage.getItem('phi_admin_token'); } catch (e) { token = null; }
  if (!token) return; // only the admin publishes the shared catalog
  const body = JSON.stringify({ mentors: state.mentors || [], jobs: state.jobs || [] });
  if (body === lastCatalog) return;
  try {
    const r = await fetch(API_BASE + '/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body
    });
    if (r.ok) lastCatalog = body;
  } catch (e) { /* will retry on the next save */ }
}
