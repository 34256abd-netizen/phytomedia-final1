import { createClient } from '@supabase/supabase-js';
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  safeSetItem,
  pruneStorageForQuota,
  compressImageFile
} from '../backup-localStorage.js';

// Environment variables or runtime window config
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '';

export let supabase = null;
export let isSupabaseConnected = false;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    isSupabaseConnected = true;
    console.log('⚡ Supabase Client initialized successfully.');
  } catch (err) {
    console.warn('⚠️ Supabase init failed, falling back to backup localStorage engine:', err);
    supabase = null;
    isSupabaseConnected = false;
  }
} else {
  console.log('ℹ️ Supabase credentials not provided. Using fallback localStorage engine (backup-localStorage.js).');
}

/**
 * Loads data from Supabase DB with automatic fallback to backup-localStorage
 */
export async function loadFromStorageEngine(state, INITIAL_DATA, checkAndApplyAutoBlock, loadCVAndPortfolio, syncCVWithTimaCard) {
  // Always load local backup first for instant UI response
  loadFromLocalStorage(state, INITIAL_DATA, checkAndApplyAutoBlock, loadCVAndPortfolio, syncCVWithTimaCard);

  if (!supabase || !isSupabaseConnected) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from('phi_app_data')
      .select('key, value');

    if (error || !data) {
      console.warn('⚠️ Supabase query failed or table missing. Using backup localStorage state.', error);
      return;
    }

    const dataMap = {};
    data.forEach(item => {
      try {
        dataMap[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
      } catch (e) {
        dataMap[item.key] = item.value;
      }
    });

    if (dataMap.currentUser) state.currentUser = dataMap.currentUser;
    if (dataMap.mentors && Array.isArray(dataMap.mentors) && dataMap.mentors.length > 0) state.mentors = dataMap.mentors;
    if (dataMap.students && Array.isArray(dataMap.students) && dataMap.students.length > 0) state.students = dataMap.students;
    if (dataMap.jobs && Array.isArray(dataMap.jobs) && dataMap.jobs.length > 0) state.jobs = dataMap.jobs;
    if (dataMap.applications && Array.isArray(dataMap.applications)) state.applications = dataMap.applications;
    if (dataMap.challenges && Array.isArray(dataMap.challenges)) state.challenges = dataMap.challenges;
    if (dataMap.submissions && Array.isArray(dataMap.submissions)) state.submissions = dataMap.submissions;
    if (dataMap.bookings && Array.isArray(dataMap.bookings)) state.bookings = dataMap.bookings;
    if (dataMap.reports && Array.isArray(dataMap.reports)) state.reports = dataMap.reports;
    if (dataMap.verifications && Array.isArray(dataMap.verifications)) state.verifications = dataMap.verifications;
    if (dataMap.blacklistIps && Array.isArray(dataMap.blacklistIps)) state.blacklistIps = dataMap.blacklistIps;
    if (dataMap.timaCard) state.timaCard = dataMap.timaCard;
    if (dataMap.totalPoints !== undefined) state.totalPoints = Number(dataMap.totalPoints) || state.totalPoints;
    if (dataMap.prestigeCount !== undefined) state.prestigeCount = Number(dataMap.prestigeCount) || state.prestigeCount;
    if (dataMap.customTheme) state.customTheme = dataMap.customTheme;

    // Save synced data to backup localStorage
    saveToLocalStorage(state);
    console.log('✅ Synchronized state from Supabase to app state and backup localStorage.');
  } catch (err) {
    console.warn('⚠️ Error during Supabase state load. Falling back to backup localStorage.', err);
  }
}

/**
 * Saves state to both backup localStorage and Supabase (if connected)
 */
export async function saveToStorageEngine(state) {
  // Always update backup localStorage
  saveToLocalStorage(state);

  if (!supabase || !isSupabaseConnected) {
    return;
  }

  const payload = [
    { key: 'currentUser', value: state.currentUser },
    { key: 'mentors', value: state.mentors },
    { key: 'students', value: state.students },
    { key: 'jobs', value: state.jobs },
    { key: 'applications', value: state.applications },
    { key: 'challenges', value: state.challenges },
    { key: 'submissions', value: state.submissions },
    { key: 'bookings', value: state.bookings },
    { key: 'timaCard', value: state.timaCard },
    { key: 'totalPoints', value: state.totalPoints },
    { key: 'prestigeCount', value: state.prestigeCount },
    { key: 'customTheme', value: state.customTheme },
    { key: 'reports', value: state.reports },
    { key: 'verifications', value: state.verifications },
    { key: 'blacklistIps', value: state.blacklistIps }
  ];

  try {
    const { error } = await supabase
      .from('phi_app_data')
      .upsert(payload, { onConflict: 'key' });

    if (error) {
      console.warn('⚠️ Supabase upsert error, saved to backup localStorage successfully.', error);
    }
  } catch (err) {
    console.warn('⚠️ Network or Supabase error during save. Data preserved in backup localStorage.', err);
  }
}
