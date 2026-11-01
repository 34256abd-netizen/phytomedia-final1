/**
 * Backup copy of localStorage engine for Phi Ecosystem App
 * Created prior to Supabase data migration step.
 * Serves as full fallback mechanism if Supabase connection fails or is offline.
 */

export const STORAGE_KEY_USER = 'phi_user_account_ecosystem_v1';
export const STORAGE_KEY_MENTORS = 'phi_mentors_ecosystem_v1';
export const STORAGE_KEY_JOBS = 'phi_jobs_ecosystem_v1';
export const STORAGE_KEY_APPLICATIONS = 'phi_applications_ecosystem_v1';
export const STORAGE_KEY_STUDENTS = 'phi_students_ecosystem_v1';
export const STORAGE_KEY_BOOKINGS = 'phi_bookings_ecosystem_v1';
export const STORAGE_KEY_CHALLENGES = 'phi_challenges_ecosystem_v1';
export const STORAGE_KEY_SUBMISSIONS = 'phi_submissions_ecosystem_v1';
export const STORAGE_KEY_TIMA = 'phi_tima_card_v1';
export const STORAGE_KEY_POINTS = 'phi_tima_points_infinite_v1';
export const STORAGE_KEY_PRESTIGE = 'phi_tima_prestige_v1';
export const STORAGE_KEY_CUSTOM_THEME = 'phi_tima_custom_theme_v1';
export const STORAGE_KEY_REPORTS = 'tima_reports';
export const STORAGE_KEY_VERIFICATIONS = 'tima_verifications';
export const STORAGE_KEY_BLACKLIST_IPS = 'tima_blacklist_ips';

/**
 * Resizes and compresses an uploaded image file using an off-screen canvas.
 * Prevents QuotaExceededError in localStorage.
 */
export function compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.65) {
  return new Promise((resolve) => {
    if (!file) {
      resolve('');
      return;
    }

    if (!file.type || !file.type.startsWith('image/')) {
      if (file.size > 200 * 1024) {
        resolve(`[مستند مرفق: ${file.name || 'document'}]`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result || '');
        }
      };
      img.onerror = () => resolve(e.target?.result || '');
      img.src = e.target?.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Prunes oversized data blobs from localStorage if storage is bloated
 */
export function pruneStorageForQuota() {
  try {
    // 1. Prune oversized verifications
    const rawVerifs = localStorage.getItem(STORAGE_KEY_VERIFICATIONS);
    if (rawVerifs && rawVerifs.length > 250000) {
      try {
        const parsed = JSON.parse(rawVerifs);
        const cleaned = parsed.map(v => ({
          ...v,
          idProof: (v.idProof && v.idProof.length > 500) ? '[إثبات هوية معتمد ومحمي]' : (v.idProof || ''),
          syndicateCard: (v.syndicateCard && v.syndicateCard.length > 500) ? '[كارنيه نقابة مرفق]' : (v.syndicateCard || ''),
          commercialRegister: (v.commercialRegister && v.commercialRegister.length > 500) ? '[سجل تجاري معتمد]' : (v.commercialRegister || '')
        }));
        localStorage.setItem(STORAGE_KEY_VERIFICATIONS, JSON.stringify(cleaned));
      } catch (e) {}
    }

    // 2. Prune oversized reports
    const rawReports = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (rawReports && rawReports.length > 250000) {
      try {
        const parsed = JSON.parse(rawReports);
        const cleaned = parsed.map(r => ({
          ...r,
          screenshot: (r.screenshot && r.screenshot.length > 500) ? '[صورة إثبات محفوظة]' : (r.screenshot || '')
        }));
        localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(cleaned));
      } catch (e) {}
    }

    // 3. Prune oversized lab submissions
    const rawSubs = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    if (rawSubs && rawSubs.length > 250000) {
      try {
        const parsed = JSON.parse(rawSubs);
        const cleaned = parsed.map(s => ({
          ...s,
          fileData: (s.fileData && s.fileData.length > 500) ? '[ملف تدريب سابق]' : (s.fileData || '')
        }));
        localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(cleaned));
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Backup storage quota pruning notice:', err);
  }
}

/**
 * Safely writes to localStorage with automatic QuotaExceededError recovery
 */
export function safeSetItem(key, value) {
  if (value.length > 50000 && (key === STORAGE_KEY_VERIFICATIONS || key === STORAGE_KEY_REPORTS || key === STORAGE_KEY_SUBMISSIONS)) {
    pruneStorageForQuota();
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22)) {
      console.warn(`[QuotaExceededError] on "${key}". Attempting full quota cleanup...`);
      pruneStorageForQuota();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        if (key === STORAGE_KEY_VERIFICATIONS || key === STORAGE_KEY_REPORTS || key === STORAGE_KEY_SUBMISSIONS) {
          try {
            localStorage.setItem(key, JSON.stringify([]));
            return true;
          } catch (e2) {}
        }
        console.error(`Could not save "${key}" even after full pruning.`);
        return false;
      }
    }
    console.error(`Error saving "${key}":`, e);
    return false;
  }
}

/**
 * Loads full application state from localStorage into state object
 */
export function loadFromLocalStorage(state, INITIAL_DATA, checkAndApplyAutoBlock, loadCVAndPortfolio, syncCVWithTimaCard) {
  pruneStorageForQuota();

  // Current User
  const storedUser = localStorage.getItem(STORAGE_KEY_USER);
  if (storedUser) {
    try { state.currentUser = JSON.parse(storedUser); } catch (e) { state.currentUser = null; }
  }

  const isMockId = (id) => typeof id === 'string' && /^(mentor-[1-4]|stud-[1-8]|job-[1-3]|app-[1-2]|ch-[1-5]|sub-1|book-[1-2]|rep-seed-[1-2]|verif-[1-2]|ip-[1-2])$/.test(id);

  // Mentors
  const storedMentors = localStorage.getItem(STORAGE_KEY_MENTORS);
  if (storedMentors) {
    try {
      const parsed = JSON.parse(storedMentors);
      state.mentors = Array.isArray(parsed) ? parsed.filter(m => !isMockId(m.id)) : [];
    } catch (e) { state.mentors = []; }
  } else {
    state.mentors = [];
  }

  // Students
  const storedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
  if (storedStudents) {
    try {
      const parsed = JSON.parse(storedStudents);
      state.students = Array.isArray(parsed) ? parsed.filter(s => !isMockId(s.id)) : [];
    } catch (e) {
      state.students = [];
    }
  } else {
    state.students = [];
  }

  // Jobs
  const storedJobs = localStorage.getItem(STORAGE_KEY_JOBS);
  if (storedJobs) {
    try {
      const parsed = JSON.parse(storedJobs);
      state.jobs = Array.isArray(parsed) ? parsed.filter(j => !isMockId(j.id)) : [];
    } catch (e) { state.jobs = []; }
  } else {
    state.jobs = [];
  }

  // Applications
  const storedApps = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
  if (storedApps) {
    try {
      const parsed = JSON.parse(storedApps);
      state.applications = Array.isArray(parsed) ? parsed.filter(a => !isMockId(a.id)) : [];
    } catch (e) { state.applications = []; }
  } else {
    state.applications = [];
  }

  // Challenges
  const storedCh = localStorage.getItem(STORAGE_KEY_CHALLENGES);
  if (storedCh) {
    try {
      const parsed = JSON.parse(storedCh);
      state.challenges = Array.isArray(parsed) ? parsed.filter(c => !isMockId(c.id)) : [];
    } catch (e) { state.challenges = []; }
  } else {
    state.challenges = [];
  }

  // Lab Submissions
  const storedSubs = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
  if (storedSubs) {
    try {
      const parsed = JSON.parse(storedSubs);
      state.submissions = Array.isArray(parsed) ? parsed.filter(s => !isMockId(s.id)) : [];
    } catch (e) { state.submissions = []; }
  } else {
    state.submissions = [];
  }

  // Bookings
  const storedBookings = localStorage.getItem(STORAGE_KEY_BOOKINGS);
  if (storedBookings) {
    try {
      const parsed = JSON.parse(storedBookings);
      state.bookings = Array.isArray(parsed) ? parsed.filter(b => !isMockId(b.id)) : [];
    } catch (e) { state.bookings = []; }
  } else {
    state.bookings = [];
  }

  // Tima Reports
  const storedReports = localStorage.getItem(STORAGE_KEY_REPORTS);
  if (storedReports) {
    try {
      const parsed = JSON.parse(storedReports);
      state.reports = Array.isArray(parsed) ? parsed.filter(r => !isMockId(r.id)) : [];
    } catch (e) { state.reports = []; }
  } else {
    state.reports = [];
  }

  // Tima Verifications
  const storedVerifications = localStorage.getItem(STORAGE_KEY_VERIFICATIONS);
  if (storedVerifications) {
    try {
      const parsed = JSON.parse(storedVerifications);
      state.verifications = Array.isArray(parsed) ? parsed.filter(v => !isMockId(v.id)) : [];
    } catch (e) { state.verifications = []; }
  } else {
    state.verifications = [];
  }

  // Blacklist IPs
  const storedBlacklist = localStorage.getItem(STORAGE_KEY_BLACKLIST_IPS);
  if (storedBlacklist) {
    try {
      const parsed = JSON.parse(storedBlacklist);
      state.blacklistIps = Array.isArray(parsed) ? parsed.filter(ip => !isMockId(ip.id)) : [];
    } catch (e) { state.blacklistIps = []; }
  } else {
    state.blacklistIps = [];
  }

  if (typeof checkAndApplyAutoBlock === 'function') {
    state.mentors.forEach(m => {
      checkAndApplyAutoBlock(m.id);
    });
    if (state.currentUser) {
      checkAndApplyAutoBlock(state.currentUser.id || state.currentUser.name);
    }
  }

  // Tima Card
  const storedTima = localStorage.getItem(STORAGE_KEY_TIMA);
  if (storedTima) {
    try { state.timaCard = JSON.parse(storedTima); } catch (e) {}
  }

  // Infinite Tima Points & Prestige
  const storedPoints = localStorage.getItem(STORAGE_KEY_POINTS);
  if (storedPoints !== null) {
    state.totalPoints = Math.max(0, parseInt(storedPoints) || 0);
  } else {
    state.totalPoints = 0;
  }

  const storedPrestige = localStorage.getItem(STORAGE_KEY_PRESTIGE);
  if (storedPrestige !== null) {
    state.prestigeCount = Math.max(0, parseInt(storedPrestige) || 0);
  }

  const storedTheme = localStorage.getItem(STORAGE_KEY_CUSTOM_THEME);
  if (storedTheme) {
    state.customTheme = storedTheme;
  }

  if (typeof loadCVAndPortfolio === 'function') loadCVAndPortfolio();
  if (typeof syncCVWithTimaCard === 'function') syncCVWithTimaCard();

  console.log('✅ Loaded data from backup localStorage successfully.');
}

/**
 * Saves full application state to localStorage
 */
export function saveToLocalStorage(state) {
  if (state.currentUser) safeSetItem(STORAGE_KEY_USER, JSON.stringify(state.currentUser));
  safeSetItem(STORAGE_KEY_MENTORS, JSON.stringify(state.mentors));
  safeSetItem(STORAGE_KEY_STUDENTS, JSON.stringify(state.students));
  safeSetItem(STORAGE_KEY_JOBS, JSON.stringify(state.jobs));
  safeSetItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(state.applications));
  safeSetItem(STORAGE_KEY_CHALLENGES, JSON.stringify(state.challenges));
  safeSetItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(state.submissions));
  safeSetItem(STORAGE_KEY_BOOKINGS, JSON.stringify(state.bookings));
  safeSetItem(STORAGE_KEY_TIMA, JSON.stringify(state.timaCard));
  safeSetItem(STORAGE_KEY_POINTS, (state.totalPoints || 0).toString());
  safeSetItem(STORAGE_KEY_PRESTIGE, (state.prestigeCount || 0).toString());
  safeSetItem(STORAGE_KEY_CUSTOM_THEME, state.customTheme || 'cosmic');
  safeSetItem(STORAGE_KEY_REPORTS, JSON.stringify(state.reports || []));
  safeSetItem(STORAGE_KEY_VERIFICATIONS, JSON.stringify(state.verifications || []));
  safeSetItem(STORAGE_KEY_BLACKLIST_IPS, JSON.stringify(state.blacklistIps || []));
}
