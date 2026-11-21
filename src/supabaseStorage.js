import { loadFromLocalStorage, saveToLocalStorage } from '../backup-localStorage.js';

// Worker بتاعك مربوط بـ D1
const WORKER_URL = 'https://phytomedia-final2.phytomedia10.workers.dev';

export let supabase = null;
export let isSupabaseConnected = true;

export async function loadFromStorageEngine(state, INITIAL_DATA, checkAndApplyAutoBlock, loadCVAndPortfolio, syncCVWithTimaCard) {
  loadFromLocalStorage(state, INITIAL_DATA, checkAndApplyAutoBlock, loadCVAndPortfolio, syncCVWithTimaCard);
  try {
    const res = await fetch(WORKER_URL + '/api/load');
    const dataMap = await res.json();
    if (dataMap.currentUser) state.currentUser = dataMap.currentUser;
    if (dataMap.mentors?.length) state.mentors = dataMap.mentors;
    if (dataMap.students?.length) state.students = dataMap.students;
    if (dataMap.jobs?.length) state.jobs = dataMap.jobs;
    if (dataMap.applications) state.applications = dataMap.applications;
    if (dataMap.bookings) state.bookings = dataMap.bookings;
    if (dataMap.verifications) state.verifications = dataMap.verifications;
    if (dataMap.reports) state.reports = dataMap.reports;
    if (dataMap.blacklistIps) state.blacklistIps = dataMap.blacklistIps;
    if (dataMap.timaCard) state.timaCard = dataMap.timaCard;
    if (dataMap.totalPoints !== undefined) state.totalPoints = Number(dataMap.totalPoints) || state.totalPoints;
    saveToLocalStorage(state);
    console.log('✅ Loaded from D1');
  } catch(e){ console.warn('D1 load failed, using localStorage', e); }
}

export async function saveToStorageEngine(state) {
  saveToLocalStorage(state);
  try {
    await fetch(WORKER_URL + '/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentUser: state.currentUser,
        mentors: state.mentors,
        students: state.students,
        jobs: state.jobs,
        applications: state.applications,
        bookings: state.bookings,
        verifications: state.verifications,
        reports: state.reports,
        blacklistIps: state.blacklistIps,
        timaCard: state.timaCard,
        totalPoints: state.totalPoints,
        prestigeCount: state.prestigeCount,
        customTheme: state.customTheme
      })
    });
    console.log('✅ Saved to D1');
  } catch(e){ console.warn('D1 save failed', e); }
      }
