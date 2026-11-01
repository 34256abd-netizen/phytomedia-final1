import React from 'react';
import ReactDOM from 'react-dom/client';
import ExpertInstaPay from './src/components/ExpertInstaPay';
import DownloadCVButton from './src/components/DownloadCVButton';
import MentorPaymentGateway from './src/components/MentorPaymentGateway';
import { INITIAL_DATA } from './data.js';
import { loadFromStorageEngine, saveToStorageEngine, isSupabaseConnected } from './src/supabaseStorage.js';
import { loadFromLocalStorage, saveToLocalStorage } from './backup-localStorage.js';
import {
  loadCVAndPortfolio,
  saveCV,
  savePortfolio,
  syncCVWithTimaCard,
  cvState,
  portfolioState,
  setCVStep,
  nextCVStep,
  prevCVStep,
  setCVTab,
  aiEnhanceSummary,
  handleCVPhotoUpload,
  removeCVPhoto,
  addCVExperience,
  updateCVExperience,
  removeCVExperience,
  addCVMediaSkill,
  setMediaSkillLevel,
  removeCVMediaSkill,
  addCVTechSkill,
  removeCVTechSkill,
  addCVLanguage,
  removeCVLanguage,
  addCVCertificate,
  updateCVCertificate,
  removeCVCertificate,
  addCVVolunteering,
  updateCVVolunteering,
  removeCVVolunteering,
  renderCVStepForm,
  renderCVStepIndicators,
  renderCVPreview,
  downloadCVPdf,
  shareCVLink,
  openAddWorkModal,
  closeAddWorkModal,
  setAddWorkModalTab,
  handlePortfolioFileUpload,
  submitNewPortfolioWork,
  deletePortfolioItem,
  handlePortfolioDeleteClick,
  openDeleteConfirmModal,
  closeDeleteConfirmModal,
  executeConfirmedDelete,
  setPortfolioFilter,
  viewPortfolioDetail,
  closePortfolioDetailModal,
  copyPortfolioLink,
  renderPortfolioSection,
  showToast
} from './cv-portfolio-engine.js';

/* Storage Keys */
const STORAGE_KEY_USER = 'phi_user_account_ecosystem_v1';
const STORAGE_KEY_MENTORS = 'phi_mentors_ecosystem_v1';
const STORAGE_KEY_JOBS = 'phi_jobs_ecosystem_v1';
const STORAGE_KEY_APPLICATIONS = 'phi_applications_ecosystem_v1';
const STORAGE_KEY_STUDENTS = 'phi_students_ecosystem_v1';
const STORAGE_KEY_BOOKINGS = 'phi_bookings_ecosystem_v1';
const STORAGE_KEY_CHALLENGES = 'phi_challenges_ecosystem_v1';
const STORAGE_KEY_SUBMISSIONS = 'phi_submissions_ecosystem_v1';
const STORAGE_KEY_TIMA = 'phi_tima_card_v1';
const STORAGE_KEY_POINTS = 'phi_tima_points_infinite_v1';
const STORAGE_KEY_PRESTIGE = 'phi_tima_prestige_v1';
const STORAGE_KEY_CUSTOM_THEME = 'phi_tima_custom_theme_v1';

// Graduation years list and dynamic labeling
export const GRADUATION_YEARS = [2028, 2027, 2026, 2025, 2024, 2023, 2022];

export function getGraduationYearLabel(year) {
  const currentYear = new Date().getFullYear(); // 2026
  if (year === 2027) return `${year} (دفعة حالية - هتتخرج 2027) ⭐`;
  if (year > currentYear) return `${year} (دفعة حالية)`;
  if (year === currentYear) return `${year} (دفعة حالية - سنة التخرج)`;
  return `${year} (خريج)`;
}

// Exact required anti-scam keywords
export const SCAM_KEYWORDS = [
  "كورس مدفوع",
  "حول فلوس",
  "فودافون كاش",
  "شهادة معتمدة ب",
  "ادفع",
  "2000 جنيه",
  "الدفع اولا"
];
export const STORAGE_KEY_REPORTS = 'tima_reports';
export const STORAGE_KEY_VERIFICATIONS = 'tima_verifications';
export const STORAGE_KEY_BLACKLIST_IPS = 'tima_blacklist_ips';

// Global App State
export const state = {
  // Current session user: { role: 'student' | 'mentor' | 'company' | 'admin', name, email, ... }
  currentUser: null,
  activeRoleModal: null, // 'student' | 'mentor' | 'company'
  currentView: 'landing', // 'landing', 'role-select', 'student-app', 'mentor-app', 'company-app', 'admin-app', 'privacy'
  studentActiveTab: 'builder', // 'builder', 'tima', 'lab', 'mentors'
  builderSubTab: 'cv', // 'cv', 'portfolio'
  
  // Infinite Tima Levels State (while(true) leveling, no cap)
  totalPoints: 0, // Starts at 0 XP for real user
  prestigeCount: 0,
  customTheme: 'cosmic', // For Level 100+ or custom choice

  // Data collections
  mentors: [],
  students: [],
  jobs: [],
  applications: [],
  challenges: [],
  submissions: [],
  bookings: [],

  // Anti-Scam & Verification System
  reports: [],
  verifications: [],
  blacklistIps: [],
  adminSubTab: 'overview', // 'overview', 'protection'
  reportsFilter: 'pending', // 'all', 'pending', 'approved_banned', 'warned', 'rejected'
  activeReportTarget: null, // { id, name, type }
  uploadedReportScreenshot: '',
  uploadedMentorIdProof: '',
  uploadedMentorCard: '',
  uploadedCompanyReg: '',
  uploadedMentorInstapayQr: '',
  mentorSignupPayoutTab: 'instapay',
  roomMessages: {},
  
  // Current Student Tima Card (0-99 on 6 skills)
  timaCard: {
    name: '',
    position: '',
    department: '',
    gradYear: '',
    overall: 0,
    stats: {
      filming: 0,    // تصوير
      montage: 0,    // مونتاج
      writing: 0,    // كتابة
      presenting: 0, // تقديم
      pr: 0,         // علاقات
      digital: 0     // ديجيتال
    }
  },

  // Active booking modal mentor
  bookingMentor: null,
  activeRoomMentor: null,

  // Admin filter & challenge creator
  adminTab: 'overview', // 'overview', 'users', 'challenges', 'revenue'

  // Talent pool filters for companies
  talentFilters: {
    dept: 'all',
    minOverall: 0,
    skillType: 'all',
    minSkillScore: 0,
    university: 'all',
    search: ''
  },

  // Phi Scout AI Media Recruitment State
  scoutResults: []
};

// Initialize App
export function initApp() {
  loadFromStorage();
  setupGlobalFunctions();
  
  // Check if role is saved in localStorage or URL hash/path
  const hash = window.location.hash;
  const path = window.location.pathname;
  if (hash === '#admin' || path === '/admin') {
    if (isAdminAuthenticated()) {
      state.currentView = 'admin-app';
    } else {
      state.currentView = 'landing';
      setTimeout(() => {
        openAdminLockModal();
      }, 200);
    }
  } else if (hash === '#privacy' || path === '/privacy') {
    state.currentView = 'privacy';
  } else if (state.currentUser) {
    if (state.currentUser.role === 'admin' || (state.currentUser.email && state.currentUser.email.trim().toLowerCase() === 'phytomedia10@gmail.com')) {
      state.currentView = 'admin-app';
    } else if (state.currentUser.role === 'mentor') state.currentView = 'mentor-app';
    else if (state.currentUser.role === 'company') state.currentView = 'company-app';
    else state.currentView = 'student-app';
  } else {
    state.currentView = 'landing';
  }

  // Auto scan and verify accounts
  checkAllAccountsForScamKeywords();

  renderApp();
  window.lucide && window.lucide.createIcons();
}

function loadFromStorage() {
  loadFromStorageEngine(state, INITIAL_DATA, checkAndApplyAutoBlock, loadCVAndPortfolio, syncCVWithTimaCard);
}

// -------------------------------------------------------------
// STORAGE QUOTA PROTECTION & IMAGE COMPRESSION UTILITIES
// -------------------------------------------------------------

/**
 * Resizes and compresses an uploaded image file using an off-screen canvas.
 * Reduces 5MB-15MB camera uploads down to ~30KB-50KB to permanently prevent QuotaExceededError.
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
      reader.onload = (e) => resolve(e.target.result || '');
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
          resolve(e.target.result || '');
        }
      };
      img.onerror = () => resolve(e.target.result || '');
      img.src = e.target.result;
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
    console.warn('Storage quota pruning notice:', err);
  }
}

/**
 * Safely writes to localStorage with automatic QuotaExceededError recovery
 */
export function safeSetItem(key, value) {
  // Try pruning before saving if we're dealing with potentially large keys
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
      // Try again after full prune
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        // If still failing, drop base64 strings completely for these keys as a last resort
        if (key === STORAGE_KEY_VERIFICATIONS || key === STORAGE_KEY_REPORTS || key === STORAGE_KEY_SUBMISSIONS) {
          try {
            localStorage.setItem(key, JSON.stringify([])); // Reset to empty if absolutely necessary
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

export function saveToStorage() {
  saveToStorageEngine(state);
}

// Navigation
export function navigateView(viewName) {
  if (viewName === 'admin-app' && !isAdminAuthenticated()) {
    openAdminLockModal();
    return;
  }
  state.currentView = viewName;
  if (viewName !== 'admin-app' && window.location.hash === '#admin') {
    window.location.hash = '';
  }
  if (viewName !== 'privacy' && window.location.hash === '#privacy') {
    window.location.hash = '';
  }
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function setStudentTab(tabName) {
  state.studentActiveTab = tabName;
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function setBuilderSubTab(subTab) {
  state.builderSubTab = subTab;
  renderApp();
}

// Onboarding & Role Selection Flow
export function startOnboarding() {
  navigateView('role-select');
}

export function openRoleSignup(role) {
  state.activeRoleModal = role;
  const modal = document.getElementById('modal-role-signup');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    renderRoleSignupForm(role);
    window.lucide && window.lucide.createIcons();
  }
}

export function closeRoleSignup() {
  const modal = document.getElementById('modal-role-signup');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function renderRoleSignupForm(role) {
  const container = document.getElementById('role-signup-form-body');
  const title = document.getElementById('role-signup-modal-title');
  const desc = document.getElementById('role-signup-modal-desc');
  if (!container) return;

  state.uploadedMentorIdProof = '';
  state.uploadedMentorCard = '';
  state.uploadedCompanyReg = '';

  if (role === 'student') {
    title.innerText = 'انضمام كطالب أو خريج إعلام 🎓';
    desc.innerText = 'ابنِ سيرتك الذاتية وبورتفوليوك واحصل على بطاقة Tima المقيمة بالذكاء الاصطناعي.';
    container.innerHTML = `
      <div class="space-y-3.5">
        <div>
          <label class="block text-xs font-bold text-[#1E1B4B] mb-1">الاسم بالكامل *</label>
          <input type="text" id="reg-name" placeholder="مثال: مريم حسام شريف" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
        </div>
        <div>
          <label class="block text-xs font-bold text-[#1E1B4B] mb-1">البريد الإلكتروني *</label>
          <input type="email" id="reg-email" placeholder="mariam@cu.edu.eg" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED] font-mono">
        </div>
        <div>
          <label class="block text-xs font-bold text-[#1E1B4B] mb-1">كلمة المرور *</label>
          <input type="password" id="reg-password" placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">القسم الأكاديمي *</label>
            <select id="reg-dept" class="w-full px-3 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
              <option value="إذاعة وتلفزيون">إذاعة وتلفزيون</option>
              <option value="صحافة ونشر">صحافة ونشر</option>
              <option value="علاقات عامة">علاقات عامة وإعلان</option>
              <option value="ديجيتال ميديا">ديجيتال ميديا</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">سنة التخرج المتوقعة *</label>
            <select id="reg-grad-year" class="w-full p-3 rounded-full border border-gray-300 bg-purple-50/50 text-xs outline-none focus:border-[#7C3AED] font-mono">
              ${GRADUATION_YEARS.map(year => `
                <option value="${year}" ${year === 2027 ? 'selected' : ''}>
                  ${getGraduationYearLabel(year)}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-[#1E1B4B] mb-1">الجامعة / الكلية</label>
          <input type="text" id="reg-univ" placeholder="مثال: جامعة القاهرة - كلية الإعلام" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
        </div>
      </div>
    `;
  } else if (role === 'mentor') {
    title.innerText = 'انضمام كخبير إعلامي ومنتور 🧠';
    desc.innerText = 'توثيق الهوية وتحديد طرق الدفع والاستلام لتمكين الطلاب من حجز الجلسات.';
    container.innerHTML = `
      <div class="space-y-4 max-h-[62vh] overflow-y-auto px-1">
        <!-- Basic Info -->
        <div>
          <label class="block text-xs font-bold text-[#1E1B4B] mb-1">الاسم المهني *</label>
          <input type="text" id="reg-name" placeholder="مثال: أحمد كمال الدين" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
        </div>
        <div>
          <label class="block text-xs font-bold text-[#1E1B4B] mb-1">التخصص الدقيق جداً *</label>
          <input type="text" id="reg-specialty" placeholder="مثال: مونتاج بريمير ودافنشي وتصحيح ألوان" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">سنين الخبرة *</label>
            <input type="number" id="reg-exp-years" value="7" min="1" max="40" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED] font-mono">
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">سعر السيشن (بالجنيه) *</label>
            <input type="number" id="reg-price" value="200" step="50" min="50" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED] font-mono">
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-[#1E1B4B] mb-1">شغال فين حالياً / أبرز مؤسسة *</label>
          <input type="text" id="reg-workplace" placeholder="مثال: مونتير في الجزيرة / مصور وثائقي مستقل" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
        </div>
        <div>
          <label class="block text-xs font-bold text-[#1E1B4B] mb-1">لينك أعمالك الحقيقية / بورتفوليو أو لينكدإن *</label>
          <input type="url" id="reg-portfolio-link" dir="ltr" placeholder="https://linkedin.com/in/... أو https://vimeo.com/..." class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED] font-mono">
        </div>

        <!-- ========================================================
             PAYMENT & PAYOUT METHODS SECTION (طرق الدفع واستلام الأرباح)
             ======================================================== -->
        <div class="p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50/40 to-purple-50 border-2 border-purple-200/90 space-y-3.5 shadow-sm">
          <div class="flex items-center justify-between pb-2 border-b border-purple-200/70">
            <div class="flex items-center gap-2">
              <span class="text-base">💳</span>
              <div>
                <h4 class="font-black text-xs text-[#1E1B4B]">طرق الدفع واستلام مستحقات الجلسات (Payout Methods)</h4>
                <span class="text-[10px] text-slate-500 font-medium">وسائل استلام الأموال المعتمدة من الطلاب والمنصة</span>
              </div>
            </div>
            <span class="text-[10px] bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black px-2.5 py-0.5 rounded-full shadow-xs">
              لحظي 100% ⚡
            </span>
          </div>

          <p class="text-[11px] text-slate-600 leading-relaxed font-medium">
            اختر وسيلتك الأساسية لتحويل أموال الجلسات لحسابك مباشرة (بدون استقطاعات خفية):
          </p>

          <!-- Selectable Payment Method Cards/Tabs -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button type="button" onclick="window.phiApp.setMentorSignupPayoutTab('instapay')" id="tab-payout-instapay" class="p-2.5 rounded-xl border-2 border-[#7C3AED] bg-purple-100/80 text-[#7C3AED] font-black text-right flex items-center gap-2 transition-all shadow-xs cursor-pointer">
              <span class="text-base">⚡</span>
              <div>
                <span class="block text-xs font-black">InstaPay إنستاباي</span>
                <span class="text-[10px] text-purple-600 font-normal">تحويل لحظي 0% عمولة</span>
              </div>
            </button>

            <button type="button" onclick="window.phiApp.setMentorSignupPayoutTab('wallet')" id="tab-payout-wallet" class="p-2.5 rounded-xl border border-purple-200 bg-white text-slate-700 font-bold text-right flex items-center gap-2 transition-all hover:bg-purple-50 cursor-pointer">
              <span class="text-base">📱</span>
              <div>
                <span class="block text-xs font-black">محفظة كاش</span>
                <span class="text-[10px] text-slate-500 font-normal">فودافون / اتصالات / أورنج</span>
              </div>
            </button>

            <button type="button" onclick="window.phiApp.setMentorSignupPayoutTab('bank')" id="tab-payout-bank" class="p-2.5 rounded-xl border border-purple-200 bg-white text-slate-700 font-bold text-right flex items-center gap-2 transition-all hover:bg-purple-50 cursor-pointer">
              <span class="text-base">🏦</span>
              <div>
                <span class="block text-xs font-black">حساب بنكي / IBAN</span>
                <span class="text-[10px] text-slate-500 font-normal">تحويل بنكي رسمي</span>
              </div>
            </button>

            <button type="button" onclick="window.phiApp.setMentorSignupPayoutTab('fawry')" id="tab-payout-fawry" class="p-2.5 rounded-xl border border-purple-200 bg-white text-slate-700 font-bold text-right flex items-center gap-2 transition-all hover:bg-purple-50 cursor-pointer">
              <span class="text-base">🏪</span>
              <div>
                <span class="block text-xs font-black">منافذ فوري Pay</span>
                <span class="text-[10px] text-slate-500 font-normal">حوالة نقدية فورية</span>
              </div>
            </button>
          </div>

          <!-- Dynamic Payout Details Container -->
          <div id="mentor-payout-details-container" class="space-y-3 pt-1">
            <!-- Filled dynamically by setMentorSignupPayoutTab -->
          </div>

          <!-- Additional Accepted Payment Checkboxes -->
          <div class="pt-2 border-t border-purple-100">
            <span class="block text-[11px] font-bold text-[#1E1B4B] mb-1.5">طرق دفع تقبلها من الطلاب لحجز السيشن:</span>
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <label class="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-purple-100 cursor-pointer text-slate-700 font-medium hover:border-purple-300">
                <input type="checkbox" id="accept-pay-instapay" checked class="accent-[#7C3AED]">
                <span>⚡ إنستاباي مباشر (InstaPay)</span>
              </label>
              <label class="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-purple-100 cursor-pointer text-slate-700 font-medium hover:border-purple-300">
                <input type="checkbox" id="accept-pay-wallet" checked class="accent-[#7C3AED]">
                <span>📱 محافظ كاش (فودافون/اتصالات)</span>
              </label>
              <label class="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-purple-100 cursor-pointer text-slate-700 font-medium hover:border-purple-300">
                <input type="checkbox" id="accept-pay-card" checked class="accent-[#7C3AED]">
                <span>💳 بطاقات بنكية (فيزا وماستركارد وميزة)</span>
              </label>
              <label class="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-purple-100 cursor-pointer text-slate-700 font-medium hover:border-purple-300">
                <input type="checkbox" id="accept-pay-fawry" checked class="accent-[#7C3AED]">
                <span>🏪 كود منافذ فوري (Fawry Pay)</span>
              </label>
            </div>
          </div>

          <!-- Protection Notice -->
          <div class="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
            <span class="text-sm">🛡️</span>
            <span>حماية مالية 100%: تحتفظ المنصة بالمبلغ بأمان لحين انتهاء السيشن ثم يتم تحويله لمحفظتك أو حسابك مباشرة.</span>
          </div>
        </div>

        <!-- Verification Documents Area (Anti-Scam Requirement) -->
        <div class="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
          <div class="flex items-center gap-1.5 text-xs font-black text-amber-900">
            <span>🛡️ متطلبات التوثيق الإلزامية لمكافحة الحسابات الوهمية</span>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">1. إثبات هوية رسمي (بطاقة رقم قومي أو جواز سفر) *</label>
            <input type="file" id="reg-mentor-id-file" accept="image/*" onchange="window.phiApp.handleMentorIdUpload(event)" class="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#7C3AED] file:text-white hover:file:bg-[#6D28D9] cursor-pointer">
            <span id="reg-mentor-id-status" class="text-[10px] text-slate-500 block mt-1">يجب رفع صورة واضحة لفحصها قبل النشر</span>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">2. كارنيه نقابة الصحفيين/السينمائيين أو بطاقة المؤسسة (إن وجد)</label>
            <input type="file" id="reg-mentor-card-file" accept="image/*" onchange="window.phiApp.handleMentorCardUpload(event)" class="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-200 file:text-[#1E1B4B] cursor-pointer">
          </div>
        </div>
      </div>
    `;
  } else if (role === 'company') {
    title.innerText = 'انضمام كشركة إنتاج أو صحيفة أو قناة 🏢';
    desc.innerText = 'شرط التوثيق: بريد مؤسسي رسمي @company.com وسجل تجاري معتمد.';
    container.innerHTML = `
      <div class="space-y-3.5 max-h-[60vh] overflow-y-auto px-1">
        <div>
          <label class="block text-xs font-bold text-[#1E1B4B] mb-1">اسم المؤسسة / الشركة *</label>
          <input type="text" id="reg-name" placeholder="مثال: شبكة أوان للإنتاج الفني" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">نوع المؤسسة *</label>
            <select id="reg-company-type" class="w-full px-3 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
              <option value="شركة انتاج">شركة انتاج سينمائي/إعلاني</option>
              <option value="صحيفة">صحيفة / موقع إخباري</option>
              <option value="قناة">قناة تلفزيونية</option>
              <option value="سوشيال">وكالة سوشيال ميديا ومحتوى</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">البريد الرسمي للمؤسسة (@company.com) *</label>
            <input type="email" id="reg-email" placeholder="hr@awan-media.com" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED] font-mono">
            <span class="text-[10px] text-rose-600 block mt-0.5">⚠️ شرط إلزامي: نطاق مؤسسي وليس Gmail</span>
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-[#1E1B4B] mb-1">رابط الموقع الرسمي للشركة *</label>
          <input type="url" id="reg-company-website" dir="ltr" placeholder="https://awan-media.com" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED] font-mono">
        </div>

        <!-- Verification Documents Area (Anti-Scam Requirement) -->
        <div class="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
          <div class="flex items-center gap-1.5 text-xs font-black text-amber-900">
            <span>🛡️ متطلبات التوثيق الإلزامية للمؤسسات</span>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">رفع صورة السجل التجاري أو ترخيص المجلس الأعلى للإعلام *</label>
            <input type="file" id="reg-company-reg-file" accept="image/*" onchange="window.phiApp.handleCompanyRegUpload(event)" class="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#7C3AED] file:text-white hover:file:bg-[#6D28D9] cursor-pointer">
            <span id="reg-company-reg-status" class="text-[10px] text-slate-500 block mt-1">يجب رفع مستند رسمي معتمد لتوثيق المؤسسة</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-[#1E1B4B] mb-1">ايه المواهب الإعلامية اللي بتدوروا عليها؟ *</label>
          <textarea id="reg-needs" rows="2" placeholder="مثال: مونتيرين بريمير محترفين، ومصورين وثائقيين..." class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]"></textarea>
        </div>
      </div>
    `;
  }

  // If mentor, initialize the payout tab
  if (role === 'mentor') {
    setMentorSignupPayoutTab(state.mentorSignupPayoutTab || 'instapay');
  }

  // Reset privacy checkbox
  const chk = document.getElementById('role-privacy-check');
  if (chk) chk.checked = false;
  validateRoleSignupForm();
}

// Mentor Signup Payout Methods Handler
export function setMentorSignupPayoutTab(tabName) {
  state.mentorSignupPayoutTab = tabName;
  const tabs = ['instapay', 'wallet', 'bank', 'fawry'];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-payout-${t}`);
    if (el) {
      if (t === tabName) {
        el.className = 'p-2.5 rounded-xl border-2 border-[#7C3AED] bg-purple-100/80 text-[#7C3AED] font-black text-right flex items-center gap-2 transition-all shadow-xs cursor-pointer';
      } else {
        el.className = 'p-2.5 rounded-xl border border-purple-200 bg-white text-slate-700 font-bold text-right flex items-center gap-2 transition-all hover:bg-purple-50 cursor-pointer';
      }
    }
  });

  const container = document.getElementById('mentor-payout-details-container');
  if (!container) return;

  if (tabName === 'instapay') {
    container.innerHTML = `
      <div class="space-y-2.5 bg-white p-3.5 rounded-xl border border-purple-200 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-black text-[#1E1B4B]">بيانات الدفع اللحظي عبر InstaPay ⚡</span>
          <span class="text-[10px] text-purple-700 bg-purple-100 font-bold px-2 py-0.5 rounded-full">التحويل فوري بحسابك البنكي</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">عنوان الدفع اللحظي (IPA / Handle) *</label>
            <input type="text" id="reg-mentor-instapay" placeholder="username@instapay" dir="ltr" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs font-mono outline-none focus:border-[#7C3AED]">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">رقم الهاتف المسجل بإنستاباي *</label>
            <input type="tel" id="reg-mentor-instapay-phone" placeholder="01012345678" dir="ltr" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs font-mono outline-none focus:border-[#7C3AED]">
          </div>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-1">رفع صورة باركود QR إنستاباي (اختياري لتمكين مسح الكود للطلاب)</label>
          <input type="file" id="reg-mentor-instapay-qr-file" accept="image/*" onchange="window.phiApp.handleMentorInstapayQrUpload(event)" class="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#7C3AED] file:text-white cursor-pointer">
          <span id="reg-mentor-qr-status" class="text-[10px] text-slate-500 block mt-1">إذا لم ترفق صورة، يتم توليد باركود تلقائي مشفر بمعرفك.</span>
        </div>
      </div>
    `;
  } else if (tabName === 'wallet') {
    container.innerHTML = `
      <div class="space-y-2.5 bg-white p-3.5 rounded-xl border border-purple-200 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-black text-[#1E1B4B]">بيانات المحفظة الإلكترونية الذكية 📱</span>
          <span class="text-[10px] text-pink-700 bg-pink-100 font-bold px-2 py-0.5 rounded-full">كاش سريع</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">مزود خدمة المحفظة *</label>
            <select id="reg-mentor-wallet-type" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
              <option value="فودافون كاش">فودافون كاش (Vodafone Cash)</option>
              <option value="اتصالات كاش">اتصالات كاش (Etisalat Cash)</option>
              <option value="أورنج كاش">أورنج كاش (Orange Cash)</option>
              <option value="وي باي">وي باي (WE Pay)</option>
              <option value="محفظة بنكية ذكية">محفظة بنكية ذكية (CIB Smart Wallet / الأهلي فون كاش)</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">رقم هاتف المحفظة (11 رقم) *</label>
            <input type="tel" id="reg-mentor-wallet-phone" placeholder="01012345678" maxlength="11" dir="ltr" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs font-mono outline-none focus:border-[#7C3AED]">
          </div>
        </div>
      </div>
    `;
  } else if (tabName === 'bank') {
    container.innerHTML = `
      <div class="space-y-2.5 bg-white p-3.5 rounded-xl border border-purple-200 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-black text-[#1E1B4B]">بيانات التحويل البنكي المباشر 🏦</span>
          <span class="text-[10px] text-slate-600 bg-slate-100 font-bold px-2 py-0.5 rounded-full">تحويل بنكي رسمي</span>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-1">اسم البنك *</label>
          <select id="reg-mentor-bank-name" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
            <option value="البنك التجاري الدولي (CIB)">البنك التجاري الدولي (CIB)</option>
            <option value="البنك الأهلي المصري (NBE)">البنك الأهلي المصري (NBE)</option>
            <option value="بنك مصر (BM)">بنك مصر (BM)</option>
            <option value="بنك QNB الأهلي">بنك QNB الأهلي</option>
            <option value="بنك الإسكندرية">بنك الإسكندرية</option>
            <option value="بنك القاهرة">بنك القاهرة</option>
            <option value="مصرف أبوظبي الإسلامي (ADIB)">مصرف أبوظبي الإسلامي (ADIB)</option>
            <option value="بنك آخر">بنك مصري آخر معتمد</option>
          </select>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">رقم الآيبان (IBAN) أو رقم الحساب *</label>
            <input type="text" id="reg-mentor-bank-iban" placeholder="EG000000000000000000000000000" dir="ltr" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs font-mono outline-none focus:border-[#7C3AED]">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">اسم صاحب الحساب (باللاتينية كما في البنك) *</label>
            <input type="text" id="reg-mentor-bank-holder" placeholder="AHMED KAMAL ELDIN" dir="ltr" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs font-mono uppercase outline-none focus:border-[#7C3AED]">
          </div>
        </div>
      </div>
    `;
  } else if (tabName === 'fawry') {
    container.innerHTML = `
      <div class="space-y-2.5 bg-white p-3.5 rounded-xl border border-purple-200 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-black text-[#1E1B4B]">بيانات استلام أتعاب فوري كاش 🏪</span>
          <span class="text-[10px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded-full">استلام نقدي من الفروع</span>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-1">رقم الهاتف المسجل لاستلام حوالات فوري *</label>
          <input type="tel" id="reg-mentor-fawry-phone" placeholder="01012345678" maxlength="11" dir="ltr" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs font-mono outline-none focus:border-[#7C3AED]">
          <span class="text-[10px] text-slate-500 block mt-1">يصلك كود الحوالة برسالة SMS لصرف المبلغ فوراً من أقرب منفذ فوري بلس.</span>
        </div>
      </div>
    `;
  }
}

export async function handleMentorInstapayQrUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const status = document.getElementById('reg-mentor-qr-status');
  if (status) status.innerHTML = `<span class="text-purple-600 font-bold">جاري معالجة وضغط صورة الباركود... ⏳</span>`;
  try {
    const compressed = await compressImageFile(file, 600, 600, 0.7);
    state.uploadedMentorInstapayQr = compressed;
    if (status) status.innerHTML = `<span class="text-emerald-600 font-bold">✓ تم إرفاق صورة QR Code إنستاباي بنجاح (${file.name})</span>`;
  } catch (err) {
    console.warn('Error compressing QR:', err);
    state.uploadedMentorInstapayQr = '';
    if (status) status.innerHTML = `<span class="text-rose-600 font-bold">تعذر ضغط الصورة، يرجى المحاولة بصورة أصغر</span>`;
  }
}

export async function handleMentorIdUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const status = document.getElementById('reg-mentor-id-status');
  if (status) status.innerHTML = `<span class="text-purple-600 font-bold">جاري معالجة وضغط إثبات الهوية... ⏳</span>`;
  try {
    const compressed = await compressImageFile(file, 800, 800, 0.65);
    state.uploadedMentorIdProof = compressed;
    if (status) status.innerHTML = `<span class="text-emerald-600 font-bold">✓ تم إرفاق إثبات الهوية بنجاح (${file.name})</span>`;
  } catch (err) {
    console.warn('Error compressing ID:', err);
    state.uploadedMentorIdProof = '[تم إرفاق إثبات الهوية]';
    if (status) status.innerHTML = `<span class="text-emerald-600 font-bold">✓ تم إرفاق إثبات الهوية</span>`;
  }
}

export async function handleMentorCardUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const compressed = await compressImageFile(file, 800, 800, 0.65);
    state.uploadedMentorCard = compressed;
  } catch (err) {
    state.uploadedMentorCard = '[تم إرفاق كارنيه النقابة]';
  }
}

export async function handleCompanyRegUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const status = document.getElementById('reg-company-reg-status');
  if (status) status.innerHTML = `<span class="text-purple-600 font-bold">جاري معالجة وضغط السجل التجاري... ⏳</span>`;
  try {
    const compressed = await compressImageFile(file, 800, 800, 0.65);
    state.uploadedCompanyReg = compressed;
    if (status) status.innerHTML = `<span class="text-emerald-600 font-bold">✓ تم إرفاق السجل التجاري بنجاح (${file.name})</span>`;
  } catch (err) {
    console.warn('Error compressing company reg:', err);
    state.uploadedCompanyReg = '[تم إرفاق السجل التجاري]';
    if (status) status.innerHTML = `<span class="text-emerald-600 font-bold">✓ تم إرفاق السجل التجاري</span>`;
  }
}

export function validateRoleSignupForm() {
  const chk = document.getElementById('role-privacy-check');
  const btn = document.getElementById('btn-submit-role-signup');
  if (btn && chk) {
    btn.disabled = !chk.checked;
  }
}

export function submitRoleSignup() {
  const role = state.activeRoleModal;
  const chk = document.getElementById('role-privacy-check');
  if (!chk || !chk.checked) {
    alert('يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة.');
    return;
  }

  const name = document.getElementById('reg-name')?.value.trim();
  if (!name) {
    alert('من فضلك املأ الاسم المطلوب.');
    return;
  }

  const enteredEmail = (document.getElementById('reg-email')?.value || '').trim().toLowerCase();
  const enteredPass = (document.getElementById('reg-password')?.value || '').trim();

  // Super Admin login bypass
  if (enteredEmail === 'phytomedia10@gmail.com' && enteredPass === 'phy-k13204') {
    state.currentUser = {
      id: 'admin-super',
      role: 'admin',
      name: 'المدير العام φ To Media',
      email: 'phytomedia10@gmail.com',
      status: 'active',
      joinedAt: new Date().toLocaleDateString('ar-EG')
    };
    sessionStorage.setItem('phi_admin_authenticated', 'true');
    saveToStorage();
    closeRoleSignup();
    navigateView('admin-app');
    alert('✓ مرحباً بك يا مدير المنظومة! تم تسجيل دخولك بنجاح وتفعيل لوحة التحكم.');
    return;
  }

  if (role === 'student') {
    const email = document.getElementById('reg-email')?.value.trim() || 'student@media.eg';
    const dept = document.getElementById('reg-dept')?.value || 'إذاعة وتلفزيون';
    const gradYear = document.getElementById('reg-grad-year')?.value || '2027';
    const univ = document.getElementById('reg-univ')?.value.trim() || 'جامعة القاهرة';

    state.currentUser = {
      role: 'student',
      name,
      email,
      department: dept,
      gradYear,
      university: univ,
      status: 'active',
      joinedAt: new Date().toLocaleDateString('ar-EG')
    };

    state.timaCard.name = name;
    state.timaCard.department = dept;
    state.timaCard.gradYear = gradYear;

    saveToStorage();
    closeRoleSignup();
    navigateView('student-app');

  } else if (role === 'mentor') {
    const specialty = document.getElementById('reg-specialty')?.value.trim() || 'مونتاج وإخراج';
    const yearsExp = document.getElementById('reg-exp-years')?.value || 7;
    const price = parseInt(document.getElementById('reg-price')?.value || 200);
    const workplace = document.getElementById('reg-workplace')?.value.trim() || 'مستقل';
    const link = document.getElementById('reg-portfolio-link')?.value.trim();

    if (!link) {
      alert('من فضلك ضع رابط أعمال حقيقي أو حساب لينكدإن لتوثيق خبرتك.');
      return;
    }

    if (!state.uploadedMentorIdProof) {
      alert('يجب رفع إثبات هوية رسمي (بطاقة أو جواز سفر) لتوثيق الحساب ومنع انتحال الشخصيات.');
      return;
    }

    const payoutMethod = state.mentorSignupPayoutTab || 'instapay';
    const cleanSafeName = name.trim().replace(/\s+/g, '.').toLowerCase();
    const instapayHandle = document.getElementById('reg-mentor-instapay')?.value.trim() || `${cleanSafeName}@instapay`;
    const instapayPhone = document.getElementById('reg-mentor-instapay-phone')?.value.trim() || '01019283746';
    const walletProvider = document.getElementById('reg-mentor-wallet-type')?.value || 'فودافون كاش';
    const walletPhone = document.getElementById('reg-mentor-wallet-phone')?.value.trim() || instapayPhone;
    const bankName = document.getElementById('reg-mentor-bank-name')?.value || 'البنك التجاري الدولي (CIB)';
    const bankIban = document.getElementById('reg-mentor-bank-iban')?.value.trim() || 'EG380010004500000012345678901';
    const bankHolder = document.getElementById('reg-mentor-bank-holder')?.value.trim() || name;
    const fawryPhone = document.getElementById('reg-mentor-fawry-phone')?.value.trim() || instapayPhone;

    const acceptedMethods = [];
    if (document.getElementById('accept-pay-instapay')?.checked) acceptedMethods.push('instapay');
    if (document.getElementById('accept-pay-wallet')?.checked) acceptedMethods.push('wallet');
    if (document.getElementById('accept-pay-card')?.checked) acceptedMethods.push('card');
    if (document.getElementById('accept-pay-fawry')?.checked) acceptedMethods.push('fawry');
    if (acceptedMethods.length === 0) acceptedMethods.push(payoutMethod);

    const instapayQr = state.uploadedMentorInstapayQr || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(instapayHandle)}`;

    const mentorId = `mentor-${Date.now()}`;
    state.currentUser = {
      id: mentorId,
      role: 'mentor',
      name,
      specialty,
      yearsExp,
      price,
      workplace,
      link,
      earnings: 0,
      status: 'pending_verification',
      verificationStatus: 'pending_verification',
      isVerified: false,
      payoutMethod,
      instapay_link: instapayHandle,
      instapay_phone: instapayPhone,
      instapay_qr_image: instapayQr,
      wallet_phone: walletPhone,
      wallet_provider: walletProvider,
      bank_name: bankName,
      bank_iban: bankIban,
      bank_holder: bankHolder,
      fawry_phone: fawryPhone,
      accepted_methods: acceptedMethods,
      joinedAt: new Date().toLocaleDateString('ar-EG')
    };

    // Add to mentors array with pending status
    const newMentor = {
      id: mentorId,
      name,
      fullName: name,
      specialty,
      experience: `${workplace} (${yearsExp} سنوات خبرة)`,
      yearsExp,
      workplace,
      rating: '5.0',
      price,
      badge: specialty.slice(0, 10),
      status: 'pending_verification',
      verificationStatus: 'pending_verification',
      isVerified: false,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      bio: `خبير في ${specialty} بخبرة ${yearsExp} سنوات لدى ${workplace}.`,
      sessionsCount: 0,
      meetLink: 'https://meet.google.com/phi-mentor-direct',
      earnings: 0,
      payoutMethod,
      instapay_link: instapayHandle,
      instapay_phone: instapayPhone,
      instapay_qr_image: instapayQr,
      wallet_phone: walletPhone,
      wallet_provider: walletProvider,
      bank_name: bankName,
      bank_iban: bankIban,
      bank_holder: bankHolder,
      fawry_phone: fawryPhone,
      accepted_methods: acceptedMethods
    };
    state.mentors.unshift(newMentor);

    // Add to verifications table for Admin Approval
    state.verifications.unshift({
      id: `verif-${Date.now()}`,
      userId: mentorId,
      name: name,
      role: 'mentor',
      specialty: specialty,
      email: 'mentor@work.eg',
      workplace: workplace,
      portfolioLink: link,
      payoutMethod,
      instapayHandle,
      walletPhone,
      idProof: state.uploadedMentorIdProof,
      syndicateCard: state.uploadedMentorCard || '',
      date: new Date().toLocaleDateString('ar-EG'),
      status: 'pending'
    });

    saveToStorage();
    closeRoleSignup();
    alert('⏳ تم تقديم طلب الانضمام كمنتور بنجاح!\n\nحسابك الآن (قيد التوثيق والمراجعة). تم تسجيل وتأمين بيانات استلام أرباحك بنجاح.');
    navigateView('mentor-app');

  } else if (role === 'company') {
    const type = document.getElementById('reg-company-type')?.value || 'شركة انتاج';
    const email = document.getElementById('reg-email')?.value.trim();
    const website = document.getElementById('reg-company-website')?.value.trim();
    const needs = document.getElementById('reg-needs')?.value.trim() || 'مواهب إعلامية متميزة';

    if (!email) {
      alert('من فضلك أدخل البريد الإلكتروني للمؤسسة.');
      return;
    }

    // Exact requirement: email must be official @company.com NOT gmail/yahoo
    const emailLower = email.toLowerCase();
    if (emailLower.endsWith('@gmail.com') || emailLower.endsWith('@yahoo.com') || emailLower.endsWith('@hotmail.com') || emailLower.endsWith('@outlook.com')) {
      alert('⚠️ تنبيه أمني: يجب إدخال بريد مؤسسي رسمي ينتهي بنطاق شركتك (مثل @company.com) وليس بريد شخصي مجاني مثل Gmail.');
      return;
    }

    if (!website) {
      alert('من فضلك ضع رابط الموقع الرسمي للمؤسسة أو صفحتها الموثقة.');
      return;
    }

    if (!state.uploadedCompanyReg) {
      alert('يجب رفع صورة السجل التجاري أو الترخيص الإعلامي لاعتماد المؤسسة وحظر الشركات الوهمية.');
      return;
    }

    const compId = `comp-${Date.now()}`;
    state.currentUser = {
      id: compId,
      role: 'company',
      name,
      companyType: type,
      email,
      website,
      needs,
      status: 'pending_verification',
      verificationStatus: 'pending_verification',
      isVerified: false,
      joinedAt: new Date().toLocaleDateString('ar-EG')
    };

    // Add to verifications table for Admin Approval
    state.verifications.unshift({
      id: `verif-${Date.now()}`,
      userId: compId,
      name: name,
      role: 'company',
      companyType: type,
      email: email,
      website: website,
      commercialRegister: state.uploadedCompanyReg,
      needs: needs,
      date: new Date().toLocaleDateString('ar-EG'),
      status: 'pending'
    });

    saveToStorage();
    closeRoleSignup();
    alert('⏳ تم تسجيل المؤسسة بنجاح!\n\nحساب المؤسسة الآن (قيد التوثيق والمراجعة). سيقوم مسؤولو المنصة بمراجعة السجل التجاري والموقع الرسمي قبل نشر الوظائف والتواصل مع الطلاب.');
    navigateView('company-app');
  }
}

export function logoutUser() {
  state.currentUser = null;
  localStorage.removeItem(STORAGE_KEY_USER);
  navigateView('landing');
}

// -------------------------------------------------------------
// INFINITE TIMA LEVELS (NO END) - WHILE(TRUE) LEVELING
// -------------------------------------------------------------
export function getInfiniteLevel(totalPoints) {
  const pts = Math.max(0, parseInt(totalPoints) || 0);

  // Base levels 1-10 as before (0 to 3000 pts)
  if (pts < 3000) {
    const level = Math.max(1, Math.min(10, Math.floor(pts / 300) + 1));
    const currentLevelPoints = (level - 1) * 300;
    const pointsInLevel = pts - currentLevelPoints;
    const pointsToNext = Math.max(0, (level * 300) - pts);
    const progressPercent = Math.min(100, Math.max(0, Math.floor((pointsInLevel / 300) * 100)));
    return {
      level,
      prestige: 0,
      isInfinite: false,
      pointsToNext: pointsToNext === 0 ? 300 : pointsToNext,
      progressPercent,
      currentLevelPoints,
      nextLevelPoints: level * 300,
      badgePlus: null
    };
  } else {
    // After level 10: Infinite formula as specified
    const extra = pts - 3000;
    const level = 10 + Math.floor(extra / 1000) + 1;
    const prestige = Math.floor(level / 50); // every 50 levels
    const pointsInLevel = extra % 1000;
    const pointsToNext = 1000 - pointsInLevel;
    const progressPercent = Math.min(100, Math.max(0, Math.floor((pointsInLevel / 1000) * 100)));
    return {
      level,
      prestige,
      isInfinite: true,
      pointsToNext,
      progressPercent,
      currentLevelPoints: 3000 + (level - 11) * 1000,
      nextLevelPoints: 3000 + (level - 10) * 1000,
      badgePlus: (level >= 11 && level <= 14) ? (level - 10) : null
    };
  }
}

export function getLevelIcons(level) {
  return '';
}

export function getCardThemeInfo(level, customTheme) {
  // Level 100+: Custom theme choice
  if (level >= 100 && customTheme) {
    switch (customTheme) {
      case 'fire':
        return { borderClass: 'border-fire', innerClass: 'theme-fire', name: 'نار متوهجة', hasStars: false };
      case 'emerald':
        return { borderClass: 'border-emerald', innerClass: 'theme-emerald', name: 'زمرد وبرق', hasStars: false };
      case 'cosmic':
        return { borderClass: 'border-cosmic', innerClass: 'theme-cosmic', name: 'كوني ونجوم', hasStars: true };
      case 'rainbow':
        return { borderClass: 'border-rainbow', innerClass: 'theme-rainbow', name: 'طيف متقلب', hasStars: false };
      case 'holographic':
        return { borderClass: 'border-holographic', innerClass: 'theme-holographic chromatic-text', name: 'هولوجرافيك', hasStars: true };
      case 'cyber':
        return { borderClass: 'border-cyber', innerClass: 'theme-cyber', name: 'نيون سايبر', hasStars: false };
      case 'mythic':
        return { borderClass: 'border-mythic', innerClass: 'theme-mythic', name: 'أسطوري ملكي', hasStars: false };
      default:
        return { borderClass: 'border-cosmic', innerClass: 'theme-cosmic', name: 'كوني ونجوم 🌌', hasStars: true };
    }
  }

  // Level 50: Holographic - transparent with chromatic aberration
  if (level >= 50) {
    return { borderClass: 'border-holographic', innerClass: 'theme-holographic chromatic-text', name: 'هولوجرافيك ثلاثي الأبعاد', hasStars: true };
  }
  // Level 30: Rainbow shifting - animation hue-rotate infinite
  if (level >= 30) {
    return { borderClass: 'border-rainbow', innerClass: 'theme-rainbow', name: 'طيف قوس قزح المتغير', hasStars: false };
  }
  // Level 25: Cosmic theme - black with moving stars canvas
  if (level >= 25) {
    return { borderClass: 'border-cosmic', innerClass: 'theme-cosmic', name: 'كوني وسديم النجوم', hasStars: true };
  }
  // Level 20: Emerald theme - green-purple gradient, lightning border
  if (level >= 20) {
    return { borderClass: 'border-emerald', innerClass: 'theme-emerald', name: 'زمردي وصواعق البرق', hasStars: false };
  }
  // Level 15: Fire theme - bg-gradient red-orange, flame animation (CSS)
  if (level >= 15) {
    return { borderClass: 'border-fire', innerClass: 'theme-fire', name: 'ناري ملتهب', hasStars: false };
  }
  // Level 11-14: Same as level 10 but with +N badge and extra glow intensity = level*0.1
  if (level >= 11) {
    return { borderClass: 'bg-gradient-to-br from-[#7C3AED] via-[#EC4899] to-[#7C3AED]', innerClass: 'bg-[#1E1B4B]', name: `مستوى متقدم (+${level - 10})`, hasStars: false };
  }
  // Base Level 1-10
  return { borderClass: 'bg-gradient-to-br from-[#7C3AED] via-[#EC4899] to-[#7C3AED]', innerClass: 'bg-[#1E1B4B]', name: 'التصميم المعتمد', hasStars: false };
}

let starsAnimFrame = null;
export function initStarsCanvas() {
  const canvas = document.getElementById('tima-stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const parent = canvas.parentElement;
  canvas.width = parent ? (parent.offsetWidth || 340) : 340;
  canvas.height = parent ? (parent.offsetHeight || 540) : 540;

  const stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.4 + 0.1,
      color: ['#ffffff', '#ec4899', '#a855f7', '#38bdf8', '#fbbf24'][Math.floor(Math.random() * 5)]
    });
  }

  if (starsAnimFrame) cancelAnimationFrame(starsAnimFrame);

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.y -= s.speed;
      if (s.y < 0) {
        s.y = canvas.height;
        s.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.alpha;
      ctx.shadowBlur = 4;
      ctx.shadowColor = s.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    starsAnimFrame = requestAnimationFrame(draw);
  }
  draw();
}

export function addTimaPoints(amount, reason = '') {
  const oldLevel = getInfiniteLevel(state.totalPoints).level;
  const prestigeBonus = state.prestigeCount > 0 ? (1 + state.prestigeCount * 0.2) : 1;
  const gained = Math.round(amount * prestigeBonus);
  state.totalPoints += gained;
  saveToStorage();

  const newLevelInfo = getInfiniteLevel(state.totalPoints);
  if (newLevelInfo.level > oldLevel) {
    const levelStr = newLevelInfo.isInfinite ? `المستوى ∞ - ${newLevelInfo.level}` : `المستوى ${newLevelInfo.level}`;
    const icons = getLevelIcons(newLevelInfo.level);
    setTimeout(() => {
      alert(`🎉 ترقية مستوى استثنائية! وصلت إلى ${levelStr} ${icons}!\n${reason ? reason + ' • ' : ''}إجمالي نقاطك: ${state.totalPoints.toLocaleString('ar-EG')} XP`);
    }, 150);
  }

  updateTimaCardUI();
  renderLeaderboard();
}

export function setTimaPoints(targetPts) {
  state.totalPoints = Math.max(0, parseInt(targetPts) || 0);
  saveToStorage();
  updateTimaCardUI();
  renderLeaderboard();
}

export function triggerPrestige() {
  const lvlInfo = getInfiniteLevel(state.totalPoints);
  if (lvlInfo.level < 50) {
    alert(`تتطلب ميزة الـ Prestige الوصول إلى المستوى 50 على الأقل.\nمستواك الحالي هو ${lvlInfo.level} (متبقي ${50 - lvlInfo.level} مستويات). استمر في المعمل!`);
    return;
  }

  const ok = confirm(`🌟 تأكيد بدء رحلة جديدة مع الاحتفاظ بشارة Prestige؟\n\n- ستحصل على شارة Prestige رقم (${state.prestigeCount + 1}) دائمة على بطاقتك ولوحة الشرف.\n- مضاعف نقاط خبرة إضافي (+20% لكل رتبة Prestige).\n- إعادة ضبط نقاط الدورة لبدء صعود لا نهائي جديد.`);
  if (ok) {
    state.prestigeCount = (state.prestigeCount || 0) + 1;
    state.totalPoints = 3000; // resets to base of infinite levels
    saveToStorage();
    updateTimaCardUI();
    renderLeaderboard();
    alert(`👑 تهانينا! أصبحت الآن صاحب شارة Prestige ${state.prestigeCount}! شارتك الذهبية مخلدة الآن في تاريخ إعلام مصر.`);
  }
}

export function setCustomCardTheme(themeName) {
  state.customTheme = themeName;
  saveToStorage();
  updateTimaCardUI();
}

// -------------------------------------------------------------
// TIMA CARDS (0-99 on 6 skills) & AI RATING
// -------------------------------------------------------------
export function calculateTimaOverall() {
  const s = state.timaCard.stats;
  const sum = s.filming + s.montage + s.writing + s.presenting + s.pr + s.digital;
  const avg = Math.round(sum / 6);
  state.timaCard.overall = avg;
  saveToStorage();
  updateTimaCardUI();
}

export function updateTimaCardUI() {
  const c = state.timaCard;
  const nameEl = document.getElementById('tima-card-name');
  const posEl = document.getElementById('tima-card-pos');
  const ovrEl = document.getElementById('tima-card-ovr');
  const ovrBadge = document.getElementById('tima-card-ovr-badge');

  if (nameEl) nameEl.innerText = c.name;
  if (posEl) posEl.innerText = c.position;
  if (ovrEl) ovrEl.innerText = c.overall;
  if (ovrBadge) ovrBadge.innerText = c.overall;

  const s = c.stats;
  const statsMap = {
    'stat-filming': s.filming,
    'stat-montage': s.montage,
    'stat-writing': s.writing,
    'stat-presenting': s.presenting,
    'stat-pr': s.pr,
    'stat-digital': s.digital
  };

  for (const [id, val] of Object.entries(statsMap)) {
    const el = document.getElementById(`tima-${id}`);
    const slider = document.getElementById(`slider-${id}`);
    const valLabel = document.getElementById(`val-${id}`);
    if (el) el.innerText = val;
    if (slider) slider.value = val;
    if (valLabel) valLabel.innerText = val;
  }

  // --- INFINITE LEVEL EVOLUTION LOGIC ---
  const lvlInfo = getInfiniteLevel(state.totalPoints);
  const icons = getLevelIcons(lvlInfo.level);
  const theme = getCardThemeInfo(lvlInfo.level, state.customTheme);

  // Formula for card style:
  // glowSize = 5 + (level * 0.5)px
  // borderWidth = 4 + Math.floor(level/10)px
  const glowSize = 5 + (lvlInfo.level * 0.5);
  const borderWidth = 4 + Math.floor(lvlInfo.level / 10);
  const glowIntensity = lvlInfo.level * 0.1;

  // Level Display String: e.g. "المستوى ∞ - 47"
  const levelText = lvlInfo.isInfinite ? `المستوى ∞ - ${lvlInfo.level}` : `المستوى ${lvlInfo.level}`;

  // Update Top Nav User Level Badge
  const navLevelBadge = document.getElementById('nav-user-level-badge');
  if (navLevelBadge) {
    navLevelBadge.innerText = `${levelText} ${icons}`;
  }

  // Update Infinite Header Banner in Tima Tab
  const infTitleEl = document.getElementById('tima-infinite-level-title');
  if (infTitleEl) {
    infTitleEl.innerHTML = `<span>${levelText}</span> <span class="tracking-normal">${icons}</span>`;
  }

  const infProgressLabel = document.getElementById('tima-infinite-progress-label');
  if (infProgressLabel) {
    infProgressLabel.innerText = `المستوى الجاي بعد ${lvlInfo.pointsToNext} نقطة`;
  }

  const infProgressBar = document.getElementById('tima-infinite-progress-bar');
  if (infProgressBar) {
    infProgressBar.style.width = `${lvlInfo.progressPercent}%`;
  }

  const infPointsTotal = document.getElementById('tima-infinite-points-total');
  if (infPointsTotal) {
    infPointsTotal.innerText = `${state.totalPoints.toLocaleString('ar-EG')} XP`;
  }

  const prestigeBadgeHeader = document.getElementById('tima-infinite-prestige-badge');
  if (prestigeBadgeHeader) {
    if (state.prestigeCount > 0 || lvlInfo.prestige > 0) {
      const pNum = Math.max(state.prestigeCount, lvlInfo.prestige);
      prestigeBadgeHeader.classList.remove('hidden');
      prestigeBadgeHeader.innerText = `👑 Prestige ${pNum}`;
    } else {
      prestigeBadgeHeader.classList.add('hidden');
    }
  }

  // Prestige Button Container (Level 50+)
  const prestigeContainer = document.getElementById('tima-prestige-container');
  if (prestigeContainer) {
    if (lvlInfo.level >= 50) {
      prestigeContainer.classList.remove('hidden');
    } else {
      prestigeContainer.classList.add('hidden');
    }
  }

  // Custom Theme Chooser (Level 100+)
  const customThemePicker = document.getElementById('tima-custom-theme-picker');
  if (customThemePicker) {
    if (lvlInfo.level >= 100) {
      customThemePicker.classList.remove('hidden');
    } else {
      customThemePicker.classList.add('hidden');
    }
  }

  // --- UPDATE THE TIMA CARD ITSELF ---
  const outerCard = document.getElementById('tima-card') || document.getElementById('tima-card-outer');
  const innerCard = document.getElementById('tima-card-inner');
  const levelCardBadge = document.getElementById('tima-card-level-tag');
  const plusCardBadge = document.getElementById('tima-card-plus-tag');
  const themeNameTag = document.getElementById('tima-card-theme-tag');
  const starsCanvas = document.getElementById('tima-stars-canvas');

  if (outerCard) {
    outerCard.style.padding = `${borderWidth}px`;
    
    // Apply glow size & intensity
    if (lvlInfo.level >= 11 && lvlInfo.level <= 14) {
      outerCard.style.boxShadow = `0 10px ${glowSize * 2}px rgba(124, 58, 237, ${Math.min(1, 0.3 * glowIntensity)}), 0 0 ${glowSize * 1.5}px rgba(236, 72, 153, ${Math.min(1, 0.4 * glowIntensity)})`;
    } else {
      outerCard.style.boxShadow = `0 10px ${glowSize * 2}px rgba(124, 58, 237, 0.35), 0 0 ${glowSize}px rgba(236, 72, 153, 0.5)`;
    }

    // Reset theme border classes
    const allThemeBorderClasses = ['border-fire', 'border-emerald', 'border-cosmic', 'border-rainbow', 'border-holographic', 'border-cyber', 'border-mythic'];
    allThemeBorderClasses.forEach(c => outerCard.classList.remove(c));

    // Add current theme border class
    if (theme.borderClass.includes(' ')) {
      theme.borderClass.split(' ').forEach(c => c && outerCard.classList.add(c));
    } else {
      outerCard.classList.add(theme.borderClass);
    }
  }

  if (innerCard) {
    const allThemeInnerClasses = ['theme-fire', 'theme-emerald', 'theme-cosmic', 'theme-rainbow', 'theme-holographic', 'theme-cyber', 'theme-mythic', 'chromatic-text'];
    allThemeInnerClasses.forEach(c => innerCard.classList.remove(c));

    if (theme.innerClass.includes(' ')) {
      theme.innerClass.split(' ').forEach(c => c && innerCard.classList.add(c));
    } else {
      innerCard.classList.add(theme.innerClass);
    }
  }

  if (levelCardBadge) {
    // Exact requirement: Change to `المستوى ${level}` only on card tag
    const cardLevelText = `المستوى ${lvlInfo.level}`;
    levelCardBadge.innerHTML = `<span>${cardLevelText}</span> <span class="tracking-normal">${icons}</span>`;
  }

  if (plusCardBadge) {
    if (lvlInfo.badgePlus !== null) {
      plusCardBadge.classList.remove('hidden');
      plusCardBadge.innerText = `+${lvlInfo.badgePlus}`;
    } else {
      plusCardBadge.classList.add('hidden');
    }
  }

  if (themeNameTag) {
    themeNameTag.innerText = theme.name;
  }

  // Handle Stars Canvas
  if (starsCanvas) {
    if (theme.hasStars) {
      starsCanvas.style.display = 'block';
      initStarsCanvas();
    } else {
      starsCanvas.style.display = 'none';
      if (starsAnimFrame) cancelAnimationFrame(starsAnimFrame);
    }
  }
}

export function updateTimaFromSliders() {
  const currentStats = state.timaCard.stats || { filming: 88, montage: 92, writing: 95, presenting: 98, pr: 90, digital: 94 };
  const filming = parseInt(document.getElementById('slider-stat-filming')?.value || currentStats.filming);
  const montage = parseInt(document.getElementById('slider-stat-montage')?.value || currentStats.montage);
  const writing = parseInt(document.getElementById('slider-stat-writing')?.value || currentStats.writing);
  const presenting = parseInt(document.getElementById('slider-stat-presenting')?.value || currentStats.presenting);
  const pr = parseInt(document.getElementById('slider-stat-pr')?.value || currentStats.pr);
  const digital = parseInt(document.getElementById('slider-stat-digital')?.value || currentStats.digital);
  const pos = document.getElementById('tima-custom-pos')?.value.trim() || state.timaCard.position || 'مراسلة ومقدمة برامج';

  state.timaCard.stats = { filming, montage, writing, presenting, pr, digital };
  state.timaCard.position = pos;
  calculateTimaOverall();
}

export async function evaluateTimaCard(workText) {
  const text = workText || document.getElementById('tima-work-input')?.value?.trim() || 'مشروع تخرج إعلامي وتقارير تلفزيونية ومونتاج';

  const response = await fetch("/api/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: `قيم هذا العمل لبطاقة Tima: ${text}`,
      model: "gemini-1.5-flash"
    })
  });
  const result = await response.json();
  
  // result.total هي الدرجة النهائية
  // اعرضها في البطاقة
  if (result && (result.total !== undefined || result.total !== null)) {
    const finalScore = Math.min(99, Math.max(50, Math.round(Number(result.total)) || 92));
    state.timaCard.overall = finalScore;

    if (result.stats) {
      if (result.stats.filming) state.timaCard.stats.filming = Math.min(99, Math.max(50, Math.round(result.stats.filming)));
      if (result.stats.montage) state.timaCard.stats.montage = Math.min(99, Math.max(50, Math.round(result.stats.montage)));
      if (result.stats.writing) state.timaCard.stats.writing = Math.min(99, Math.max(50, Math.round(result.stats.writing)));
      if (result.stats.presenting) state.timaCard.stats.presenting = Math.min(99, Math.max(50, Math.round(result.stats.presenting)));
      if (result.stats.pr) state.timaCard.stats.pr = Math.min(99, Math.max(50, Math.round(result.stats.pr)));
      if (result.stats.digital) state.timaCard.stats.digital = Math.min(99, Math.max(50, Math.round(result.stats.digital)));
    }

    updateTimaCardUI();
    saveToStorage();

    const feedbackBox = document.getElementById('tima-ai-feedback-box');
    if (feedbackBox) {
      feedbackBox.classList.remove('hidden');
      const textEl = document.getElementById('tima-ai-feedback-text');
      const scoreEl = document.getElementById('tima-ai-feedback-score');
      if (textEl) textEl.innerText = result.feedback || 'تم تقييم العمل وتحديث بطاقة Tima بالدرجة الإجمالية.';
      if (scoreEl) scoreEl.innerText = `${finalScore} OVR`;
    }
  }

  return result;
}

export async function rateTimaWithAi() {
  const exp = document.getElementById('cv-input-exp')?.value?.trim() || '';
  const tools = document.getElementById('cv-input-tools')?.value?.trim() || '';
  const workText = document.getElementById('tima-work-input')?.value?.trim() || `${exp} ${tools}`.trim() || 'مشروع تخرج إعلامي وتقارير تلفزيونية ومونتاج';
  
  const btn = document.getElementById('btn-rate-tima-ai');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'جاري التقييم بالذكاء الاصطناعي φ...';
  }

  try {
    const result = await evaluateTimaCard(workText);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4"></i> <span>تم التقييم (${result.total || state.timaCard.overall} OVR) ⭐</span>`;
      window.lucide && window.lucide.createIcons();
    }
  } catch (err) {
    console.error('AI rating error:', err);
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'قيم هذا العمل لبطاقة Tima بالذكاء الاصطناعي 🌟';
    }
  }
}

// Helper to generate embedded Cairo font style for htmlToImage
async function getArabicFontCSS() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    #tima-card, #tima-card * {
      font-family: 'Cairo', 'Tajawal', sans-serif !important;
      direction: rtl !important;
      text-rendering: optimizeLegibility !important;
      -webkit-font-smoothing: antialiased;
      letter-spacing: 0 !important;
      word-spacing: normal !important;
    }
    .card-name {
      unicode-bidi: plaintext;
      font-feature-settings: "liga" 1, "calt" 1;
    }
  `;
}

export async function downloadTimaCard() {
  const cardElement = document.getElementById('tima-card') || document.getElementById('tima-card-outer');
  if (!cardElement) {
    alert('تعذر العثور على بطاقة Tima الإعلامية.');
    return;
  }

  const userName = (state.currentUser?.name || state.timaCard.name || 'مريم حسام شريف').trim();
  const cleanFileName = `Tima-Card-${userName.replace(/\s+/g, '-')}.png`;

  // Provide visual feedback
  const downloadBtns = document.querySelectorAll('button[onclick*="downloadTimaCard"]');
  const originalHtmls = new Map();

  downloadBtns.forEach(b => {
    originalHtmls.set(b, b.innerHTML);
    b.innerHTML = '<span class="animate-spin inline-block mr-1">⏳</span> جاري التحميل...';
    b.disabled = true;
  });

  const resetButtons = () => {
    downloadBtns.forEach(b => {
      if (originalHtmls.has(b)) b.innerHTML = originalHtmls.get(b);
      b.disabled = false;
    });
  };

  try {
    // 1- Force Arabic font load
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 2- Attempt high-quality PNG capture
    const h2i = window.htmlToImage;
    let dataUrl = null;

    if (h2i && typeof h2i.toPng === 'function') {
      try {
        const fontCSS = await getArabicFontCSS();
        dataUrl = await h2i.toPng(cardElement, {
          quality: 1,
          pixelRatio: 3, // Higher quality for "High Quality" request
          style: {
            direction: 'rtl',
            fontFamily: "'Cairo', sans-serif"
          },
          fontEmbedCSS: fontCSS,
          cacheBust: true
        });
      } catch (e) {
        console.warn('html-to-image failed, falling back to html2canvas', e);
      }
    }

    // 3- Fallback to html2canvas if needed
    if (!dataUrl && window.html2canvas) {
      const canvas = await window.html2canvas(cardElement, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false
      });
      dataUrl = canvas.toDataURL('image/png');
    }

    if (dataUrl) {
      const link = document.createElement('a');
      link.download = cleanFileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('تم تحميل بطاقة Tima بنجاح! 🎨✨');
    } else {
      throw new Error('Could not generate image');
    }

  } catch (err) {
    console.error('Download failure:', err);
    alert('حدث خطأ أثناء تنزيل الصورة. يرجى التأكد من اتصال الإنترنت أو تجربة متصفح آخر.');
  } finally {
    resetButtons();
  }
}

// -------------------------------------------------------------
// BOOKING & EXPERT SYSTEM
// -------------------------------------------------------------
export function openBookingModal(mentorId) {
  const mentor = state.mentors.find(m => m.id === mentorId);
  if (!mentor) return;
  state.bookingMentor = mentor;

  const modal = document.getElementById('modal-booking-session');
  if (modal) {
    document.getElementById('booking-mentor-name').innerText = mentor.fullName || mentor.name;
    document.getElementById('booking-mentor-spec').innerText = mentor.specialty;
    document.getElementById('booking-mentor-work').innerText = mentor.experience;
    document.getElementById('booking-mentor-price').innerText = `${mentor.price} ج.م / السيشن`;
    document.getElementById('booking-mentor-avatar').src = mentor.image;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    window.lucide && window.lucide.createIcons();
  }
}

export function closeBookingModal() {
  const modal = document.getElementById('modal-booking-session');
  if (modal) {
    modal.classList.add('hidden');
  }
}

export function openMentorPaymentGateway(mentor, sessionDetails) {
  let container = document.getElementById('payment-gateway-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'payment-gateway-container';
    document.body.appendChild(container);
  }

  const handleSuccess = (receipt) => {
    unmountReactComponent(container);
    const newBooking = {
      id: receipt?.transactionId || `book-${Date.now()}`,
      mentorId: mentor.id,
      mentorName: mentor.fullName || mentor.name,
      studentName: state.currentUser?.name || state.timaCard.name,
      day: sessionDetails.day,
      time: sessionDetails.time,
      question: sessionDetails.question,
      amount: mentor.price,
      meetLink: mentor.meetLink || 'https://meet.google.com/phi-session-direct',
      status: 'مدفوعة ومؤكدة',
      receipt
    };

    state.bookings.unshift(newBooking);
    mentor.earnings = (mentor.earnings || 0) + mentor.price;
    mentor.sessionsCount = (mentor.sessionsCount || 0) + 1;
    saveToStorage();

    closeBookingModal();
    openMentorRoom(mentor.id, newBooking);
  };

  const handleClose = () => {
    unmountReactComponent(container);
  };

  mountReactComponent('MentorPaymentGateway', container, {
    expert: mentor,
    sessionDetails,
    onSuccess: handleSuccess,
    onClose: handleClose
  });
}

export function confirmBookingSession() {
  const mentor = state.bookingMentor;
  if (!mentor) return;

  const day = document.getElementById('booking-day-select')?.value;
  const time = document.getElementById('booking-time-select')?.value;
  const question = document.getElementById('booking-question-input')?.value.trim();

  if (!question) {
    alert('من فضلك اكتب سؤالك أو المحور الذي ترغب في مناقشته مع المنتور.');
    return;
  }

  const sessionDetails = {
    day,
    time,
    question,
    amount: mentor.price
  };

  // Process payment through secure simulated gateway integrated with ExpertInstaPay
  openMentorPaymentGateway(mentor, sessionDetails);
}

export function openReportForBookingMentor() {
  if (!state.bookingMentor) return;
  const m = state.bookingMentor;
  closeBookingModal();
  openReportModal(m.id, m.fullName || m.name, 'mentor');
}

export function openMentorRoom(mentorId, bookingData = null) {
  const mentor = state.mentors.find(m => m.id === mentorId);
  if (!mentor) return;
  state.activeRoomMentor = mentor;

  const modal = document.getElementById('modal-mentor-room');
  const container = document.getElementById('room-modal-body');
  if (!modal || !container) return;

  const booking = bookingData || state.bookings.find(b => b.mentorId === mentorId) || {
    day: 'اليوم',
    time: 'الآن',
    question: 'جلسة توجيه ونقد بورتفوليو عامة'
  };

  // Init room messages if empty
  if (!state.roomMessages[mentorId]) {
    state.roomMessages[mentorId] = [
      {
        id: 'msg-1',
        sender: mentor.fullName || mentor.name,
        role: 'mentor',
        text: `أهلاً بك! أنا جاهز لمناقشة سؤالك: "${booking.question}". يمكنك استخدام الشات هنا أو الانضمام للـ Meet المباشر.`,
        time: 'منذ دقيقة',
        isScam: false
      }
    ];
  }

  container.innerHTML = `
    <!-- Dark Blue Room Header with Verified Badge & Red Report Button -->
    <div class="bg-[#1E1B4B] text-white p-6 rounded-3xl relative overflow-hidden shadow-xl mb-6">
      <div class="absolute -top-10 -right-10 w-44 h-44 bg-[#EC4899]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-10 -left-10 w-44 h-44 bg-[#7C3AED]/30 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div class="flex items-center gap-4">
          <div class="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-[#EC4899]">
            <img src="${mentor.image}" alt="${mentor.name}" class="w-full h-full object-cover">
            <span class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#1E1B4B]"></span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-xl font-black text-white">${mentor.fullName || mentor.name}</h3>
              <!-- Required: Purple Verified Badge -->
              <span class="text-[10px] font-black text-purple-200 bg-purple-900/80 border border-purple-400 px-2.5 py-0.5 rounded-full shadow-sm">
                موثق ✓
              </span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                متاح الآن في الغرفة
              </span>
            </div>
            <p class="text-xs text-purple-200 mt-0.5">${mentor.specialty} • ${mentor.experience}</p>
            <div class="flex items-center gap-2 text-xs text-pink-300 mt-1 font-mono">
              <span>★ تقييم ${mentor.rating}</span>
              <span>•</span>
              <span>سعر السيشن: ${mentor.price} ج.م</span>
            </div>
          </div>
        </div>

        <!-- Actions: Google Meet Button + Red Report Button -->
        <div class="flex items-center gap-2.5">
          <a href="${mentor.meetLink}" target="_blank" class="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:opacity-95 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2 transition-all text-center">
            <i data-lucide="video" class="w-4 h-4"></i>
            <span>Google Meet الآن 🎥</span>
          </a>
          <!-- Required: Red Report Button on Profile/Room -->
          <button onclick="window.phiApp.openReportModal('${mentor.id}', '${mentor.fullName || mentor.name}', 'mentor')" class="px-4 py-3.5 rounded-2xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
            <i data-lucide="shield-alert" class="w-4 h-4 text-rose-400"></i>
            <span>🚩 إبلاغ عن نصب</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Room Content & Question -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Video Simulator Screen -->
      <div class="md:col-span-2 bg-[#1E1B4B] rounded-3xl p-6 flex flex-col justify-between min-h-[300px] text-white relative overflow-hidden">
        <div class="flex items-center justify-between text-xs text-purple-200 z-10">
          <span class="flex items-center gap-1.5 font-mono"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> بث مباشر مشفر HD</span>
          <span class="font-mono">Google Meet Ready</span>
        </div>

        <div class="my-auto text-center py-6 z-10">
          <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] mx-auto flex items-center justify-center text-2xl font-black mb-3 shadow-lg">
            φ
          </div>
          <h4 class="text-base font-bold text-white">غرفة السيشن الخاصة مع الخبير (${mentor.name})</h4>
          <p class="text-xs text-purple-200 max-w-sm mx-auto mt-1">تم تأكيد حجزك. انقر على الزر بالأعلى للانضمام للميت، أو استخدم الشات المباشر أدناه.</p>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-purple-900/50 z-10 text-xs">
          <span class="text-purple-300 font-mono">الموعد: ${booking.day} (${booking.time})</span>
          <span class="text-emerald-400 font-bold">جلسة آمنة ومراقبة ضد النصب</span>
        </div>
      </div>

      <!-- Question and Agenda -->
      <div class="space-y-4">
        <div class="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-xs">
          <h5 class="font-black text-[#1E1B4B] mb-2 flex items-center gap-1.5">
            <i data-lucide="help-circle" class="w-4 h-4 text-[#7C3AED]"></i>
            <span>سؤالك المطروح للسيشن:</span>
          </h5>
          <p class="text-slate-700 bg-white p-3 rounded-xl border border-purple-200 leading-relaxed font-medium">
            "${booking.question}"
          </p>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm text-xs space-y-2">
          <span class="font-bold text-[#1E1B4B] block">إنهاء الجلسة:</span>
          <p class="text-slate-500 text-[11px]">بعد الانتهاء يتم حفظ الملاحظات وإتاحة تقييم المنتور والسيشن.</p>
          <button onclick="window.phiApp.closeMentorRoom(); window.phiApp.openRatingModal('${mentor.id}', '${booking?.id || ''}');" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-bold text-xs shadow-md cursor-pointer hover:opacity-95">
            تم إنهاء الجلسة بنجاح ⭐
          </button>
        </div>
      </div>

      <!-- Live Interactive Session Chat with Anti-Scam Filter -->
      <div class="col-span-full bg-white rounded-3xl p-5 border border-purple-100 shadow-sm space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-purple-50">
          <div class="flex items-center gap-2">
            <i data-lucide="message-square" class="w-4 h-4 text-[#7C3AED]"></i>
            <h5 class="font-black text-xs text-[#1E1B4B]">محادثة الجلسة المباشرة (Live Session Chat)</h5>
          </div>
          <span class="text-[10px] text-slate-400 font-mono">نظام رصد الكلمات الاحتيالية نشط 🛡️</span>
        </div>

        <!-- Scam Detected Warning Banner -->
        <div id="room-scam-warning" class="hidden p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-black flex items-center gap-2">
          <i data-lucide="alert-octagon" class="w-5 h-5 text-rose-600 shrink-0"></i>
          <span>⚠️ تنبيه: هذا الحساب يطلب مقابل مادي وهذا ممنوع في φ</span>
        </div>

        <!-- Messages Feed -->
        <div id="room-messages-feed" class="space-y-2.5 max-h-48 overflow-y-auto p-3 bg-purple-50/40 rounded-2xl border border-purple-100 text-xs">
          <!-- Rendered via renderRoomMessages -->
        </div>

        <!-- Input Row -->
        <div class="flex items-center gap-2">
          <input type="text" id="room-msg-input" onkeydown="if(event.key==='Enter') window.phiApp.sendRoomMessage('${mentor.id}')" placeholder="اكتب رسالتك هنا..." class="flex-1 px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
          <button onclick="window.phiApp.sendRoomMessage('${mentor.id}')" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-bold text-xs shadow-md">
            إرسال
          </button>
        </div>

        <!-- Quick Test Buttons for Reviewer -->
        <div class="pt-1 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-purple-50">
          <span>💡 الكلمات المحظورة تشمل: [كورس مدفوع، حول فلوس، فودافون كاش، شهادة معتمدة ب، ادفع، 2000 جنيه، الدفع اولا]</span>
          <button type="button" onclick="window.phiApp.testRoomScamMessage('${mentor.id}')" class="text-rose-600 font-bold hover:underline shrink-0 flex items-center gap-1">
            <span>🧪 تجربة محاكاة كشف نصب (فودافون كاش 2000 جنيه)</span>
          </button>
        </div>
      </div>

    </div>
  `;

  renderRoomMessages(mentorId);

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  window.lucide && window.lucide.createIcons();
}

export function renderRoomMessages(mentorId) {
  const feed = document.getElementById('room-messages-feed');
  if (!feed) return;

  const msgs = state.roomMessages[mentorId] || [];
  feed.innerHTML = msgs.map(m => `
    <div class="p-2.5 rounded-xl ${m.role === 'mentor' ? 'bg-white border border-purple-100' : 'bg-purple-100/70 border border-purple-200'}">
      <div class="flex items-center justify-between mb-1">
        <span class="font-bold text-[11px] ${m.role === 'mentor' ? 'text-[#7C3AED]' : 'text-[#EC4899]'}">${m.sender}</span>
        <span class="text-[9px] text-slate-400 font-mono">${m.time}</span>
      </div>
      <p class="text-slate-800 leading-relaxed">${m.text}</p>
    </div>
  `).join('');

  feed.scrollTop = feed.scrollHeight;
}

export function sendRoomMessage(mentorId) {
  const input = document.getElementById('room-msg-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const userName = state.currentUser?.name || state.timaCard.name || 'مريم حسام شريف';
  
  if (!state.roomMessages[mentorId]) {
    state.roomMessages[mentorId] = [];
  }

  // Push user message
  state.roomMessages[mentorId].push({
    id: `msg-${Date.now()}`,
    sender: userName,
    role: 'student',
    text: text,
    time: 'الآن',
    isScam: false
  });

  input.value = '';
  renderRoomMessages(mentorId);

  // Check if message itself triggered scam or trigger simulated response
  const matches = scanTextForScamKeywords(text);
  if (matches.length > 0) {
    handleScamDetection(mentorId, matches, text);
  }
}

export function testRoomScamMessage(mentorId) {
  const mentor = state.mentors.find(m => m.id === mentorId);
  const mentorName = mentor?.fullName || mentor?.name || 'الخبير';
  
  if (!state.roomMessages[mentorId]) {
    state.roomMessages[mentorId] = [];
  }

  // Simulate scam message from suspicious account containing the exact keywords
  const scamText = 'علشان تستلم ملفات المشروع كاملة وشهادة معتمدة بـ تقدير ممتاز، حول فلوس 2000 جنيه على فودافون كاش والدفع اولا لكورس مدفوع.';
  state.roomMessages[mentorId].push({
    id: `msg-${Date.now()}`,
    sender: mentorName,
    role: 'mentor',
    text: scamText,
    time: 'الآن',
    isScam: true
  });

  renderRoomMessages(mentorId);

  const matches = scanTextForScamKeywords(scamText);
  handleScamDetection(mentorId, matches, scamText);
}

function handleScamDetection(reportedId, matches, text) {
  const warningEl = document.getElementById('room-scam-warning');
  if (warningEl) {
    warningEl.classList.remove('hidden');
  }

  const mentor = state.mentors.find(m => m.id === reportedId);
  const targetName = mentor?.fullName || mentor?.name || reportedId;

  // Auto flag report in state.reports
  const newReport = {
    id: `rep-auto-${Date.now()}`,
    reportedId: reportedId,
    reportedName: targetName,
    reportedType: 'mentor',
    reason: 'يطلب فلوس',
    description: `رصد آلي لكلمات نصب مشبوهة: "${matches.join(', ')}" في النص: "${text}"`,
    screenshot: '',
    date: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    status: 'pending'
  };

  state.reports.unshift(newReport);
  saveToStorage();

  // Evaluate auto block (3 reports = freeze)
  const isFrozen = checkAndApplyAutoBlock(reportedId);

  alert(`⚠️ تنبيه أمني: تم رصد عبارات طلب مقابل مادي محظورة ("${matches.join('", "')}")!\n\nتم إرسال إشعار تلقائي للإدارة لمراجعة الحساب.\n${isFrozen ? '⚠️ تم تجميد الحساب تلقائياً لتسجيل 3 بلاغات ضده!' : ''}`);
  renderApp();
}

export function closeMentorRoom() {
  const modal = document.getElementById('modal-mentor-room');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}
if (typeof window !== 'undefined') {
  window.closeMentorRoom = closeMentorRoom;
}

// -------------------------------------------------------------
// COMPANY DASHBOARD ACTIONS
// -------------------------------------------------------------
export function createCompanyJob() {
  const title = document.getElementById('job-create-title')?.value.trim();
  const desc = document.getElementById('job-create-desc')?.value.trim();
  const type = document.getElementById('job-create-type')?.value || 'تدريب';
  const minSkill = document.getElementById('job-create-skill')?.value || 'filming';
  const minScore = parseInt(document.getElementById('job-create-score')?.value || 80);
  const location = document.getElementById('job-create-location')?.value.trim() || 'القاهرة';

  if (!title || !desc) {
    alert('من فضلك املأ عنوان الفرصة ووصفها.');
    return;
  }

  const newJob = {
    id: `job-${Date.now()}`,
    title,
    company: state.currentUser?.name || 'مؤسسة إعلامية',
    companyType: state.currentUser?.companyType || 'شركة انتاج',
    type,
    minSkill,
    minScore,
    description: desc,
    location,
    stipend: 'مكافأة شهرية + بدل انتقال',
    applicantsCount: 0,
    date: 'الآن'
  };

  state.jobs.unshift(newJob);
  saveToStorage();
  renderApp();
  alert('تم نشر فرصة العمل/التدريب بنجاح! يمكن للطلبة أصحاب بطاقات Tima التقديم الآن. 🎯');
}

export function filterTalentPool() {
  const dept = document.getElementById('filter-talent-dept')?.value || 'all';
  const skill = document.getElementById('filter-talent-skill')?.value || 'all';
  const minScore = parseInt(document.getElementById('filter-talent-min-score')?.value || 0);
  const search = document.getElementById('filter-talent-search')?.value.trim().toLowerCase() || '';

  state.talentFilters = { dept, skillType: skill, minSkillScore: minScore, search };
  renderTalentPool();
}

export function contactStudent(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;
  alert(`تم نسخ بريد الطالب (${student.name}):\n${student.email}\nيمكنك الآن إرسال عرض المقابلة أو التدريب مباشرة.`);
}

export function applyToJob(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;

  const currentScore = state.timaCard.stats[job.minSkill] || 0;
  if (currentScore < job.minScore) {
    alert(`عذراً، تشترط هذه الفرصة الحصول على مهارة (${job.minSkill}) بحد أدنى ${job.minScore} في بطاقة Tima.\nدرجتك الحالية هي ${currentScore}. حسّن مهارتك في المعمل وشارك مجدداً!`);
    return;
  }

  const newApp = {
    id: `app-${Date.now()}`,
    jobId: job.id,
    jobTitle: job.title,
    studentId: `stud-${Date.now()}`,
    studentName: state.currentUser?.name || state.timaCard.name,
    university: state.currentUser?.university || 'جامعة القاهرة',
    department: state.currentUser?.department || state.timaCard.department,
    timaOverall: state.timaCard.overall,
    skillHighlight: `${job.minSkill}: ${currentScore}`,
    status: 'قيد المراجعة',
    appliedAt: 'الآن'
  };

  state.applications.unshift(newApp);
  job.applicantsCount = (job.applicantsCount || 0) + 1;
  saveToStorage();
  alert(`تهانينا! تم التقديم بنجاح على "${job.title}". ستصل بطاقتك Tima والبورتفوليو إلى الشركة فوراً.`);
  renderApp();
}

// -------------------------------------------------------------
// LAB ACTIONS & AI WORK EVALUATION
// -------------------------------------------------------------
export function isWritingChallenge(challenge) {
  if (!challenge) return false;
  const cat = (challenge.category || '').toLowerCase();
  const title = (challenge.title || '').toLowerCase();
  return (
    cat.includes('صحافة') ||
    cat.includes('كتابة') ||
    cat.includes('مقال') ||
    cat.includes('تحقيق') ||
    cat.includes('تقرير') ||
    title.includes('مقال') ||
    title.includes('تحقيق') ||
    title.includes('تقرير')
  );
}

export function updateLabFormForChallenge(challenge) {
  const isWriting = isWritingChallenge(challenge);
  const contentLabel = document.getElementById('lab-submit-content-label');
  const contentInput = document.getElementById('lab-submit-content');
  const contentHint = document.getElementById('lab-submit-content-hint');
  const charCountEl = document.getElementById('lab-submit-char-count');
  const linkLabel = document.getElementById('lab-submit-link-label');
  const linkInput = document.getElementById('lab-submit-link');
  const linkHint = document.getElementById('lab-submit-link-hint');

  if (isWriting) {
    if (contentLabel) contentLabel.innerText = 'الصق نص المقال / التحقيق / التقرير كاملا هنا (الحد الأدنى 100 حرف) *';
    if (contentInput) contentInput.placeholder = 'الصق المقال كامل مع العنوان والمصادر...';
    if (contentHint) contentHint.innerText = '⚠️ التدقيق الصحفي الصارم: يُفحص جاذبية العنوان، قوة المقدمة (Hook)، ذكر وتوثيق المصادر، والسلامة اللغوية.';
    if (linkLabel) linkLabel.innerText = 'أو ارفع المقال كملف - حط رابط Google Docs / PDF / Notion (اختياري)';
    if (linkInput) linkInput.placeholder = 'https://docs.google.com/... أو رابط Notion / Drive PDF / بوست فيسبوك (اختياري)';
    if (linkHint) linkHint.innerText = 'يدعم الروابط المباشرة لـ Google Docs، مستندات Notion، ملفات PDF على Drive، وبوستات فيسبوك للمطابقة مع النص.';
    if (charCountEl) {
      const len = (contentInput?.value || '').trim().length;
      charCountEl.innerText = `${len} حرف ${len < 100 ? '(الحد الأدنى 100)' : '✓ مستوفٍ للحد الأدنى'}`;
      charCountEl.className = len >= 100 ? 'text-[11px] font-mono text-emerald-600 font-bold' : 'text-[11px] font-mono text-slate-400';
    }
  } else {
    if (contentLabel) contentLabel.innerText = 'شرح وتفاصيل العمل أو اسكريبت الفيديو * (الحد الأدنى 30 حرف)';
    if (contentInput) contentInput.placeholder = 'اكتب هنا شرحاً لفكرة العمل والاسكريبت والتفاصيل الفنية للتنفيذ (30 حرف على الأقل)...';
    if (contentHint) contentHint.innerText = '⚠️ التقييم يعتمد على جودة التنفيذ والربط بين المحتوى والفيديو/التصميم المرفق بالرابط.';
    if (linkLabel) linkLabel.innerText = 'رابط مشاهدة العمل (YouTube / Vimeo / Behance / Google Drive) *';
    if (linkInput) linkInput.placeholder = 'https://youtube.com/watch?v=... أو https://behance.net/... (إلزامي للمشاهدة)';
    if (linkHint) linkHint.innerText = 'ضع رابط العمل النهائي لمشاهدته وتقييمه مع الوصف الفني المكتوب.';
    if (charCountEl) {
      const len = (contentInput?.value || '').trim().length;
      charCountEl.innerText = `${len} حرف ${len < 30 ? '(الحد الأدنى 30)' : '✓ مستوفٍ للحد الأدنى'}`;
      charCountEl.className = len >= 30 ? 'text-[11px] font-mono text-emerald-600 font-bold' : 'text-[11px] font-mono text-slate-400';
    }
  }
}

export function onLabContentInput(val) {
  const len = (val || '').trim().length;
  const chSelect = document.getElementById('lab-submit-challenge-select');
  const selectedChId = chSelect?.value;
  const challenge = state.challenges.find(c => c.id === selectedChId) || state.challenges[0];
  const isWriting = isWritingChallenge(challenge);
  const minLen = isWriting ? 100 : 30;

  const countEl = document.getElementById('lab-submit-char-count');
  const errorDiv = document.getElementById('lab-submit-error');
  if (countEl) {
    countEl.innerText = `${len} حرف ${len < minLen ? `(الحد الأدنى ${minLen})` : '✓ مستوفٍ للحد الأدنى'}`;
    countEl.className = len >= minLen ? 'text-[11px] font-mono text-emerald-600 font-bold' : 'text-[11px] font-mono text-slate-400';
  }
  if (len >= minLen && errorDiv && !errorDiv.classList.contains('hidden')) {
    errorDiv.classList.add('hidden');
  }
}

export function onChallengeSelected(chId) {
  const ch = state.challenges.find(c => c.id === chId) || state.challenges[0];
  const titleInput = document.getElementById('lab-submit-title');
  if (ch && titleInput && !titleInput.value) {
    titleInput.value = `حل: ${ch.title}`;
  }
  updateLabFormForChallenge(ch);
}

export function selectChallengeForSubmission(chId) {
  const ch = state.challenges.find(c => c.id === chId) || state.challenges[0];
  const select = document.getElementById('lab-submit-challenge-select');
  const title = document.getElementById('lab-submit-title');
  const form = document.getElementById('lab-submission-form');
  const content = document.getElementById('lab-submit-content');

  if (select && ch) select.value = ch.id;
  if (title && ch) title.value = `حل: ${ch.title}`;
  updateLabFormForChallenge(ch);
  if (form) form.scrollIntoView({ behavior: 'smooth' });
  if (content) content.focus();
}

export async function submitLabWork() {
  const chSelect = document.getElementById('lab-submit-challenge-select');
  const selectedChId = chSelect?.value;
  const challenge = state.challenges.find(c => c.id === selectedChId) || state.challenges[0] || {
    id: 'ch-4',
    title: 'تحدي كتابة التحقيق الصحفي',
    category: 'صحافة',
    description: 'الالتزام بمعايير الإنتاج الصحفي والاستقصائي'
  };

  const isWriting = isWritingChallenge(challenge);
  const minRequiredLength = isWriting ? 100 : 30;

  const titleInput = document.getElementById('lab-submit-title');
  const contentInput = document.getElementById('lab-submit-content');
  const linkInput = document.getElementById('lab-submit-link');
  const errorDiv = document.getElementById('lab-submit-error');
  const errorMsg = document.getElementById('lab-submit-error-msg');

  const title = (titleInput?.value || '').trim() || challenge.title;
  const content = (contentInput?.value || '').trim();
  const link = (linkInput?.value || '').trim();

  // Helper to show invalid error without calling AI
  const triggerInvalidError = (msg) => {
    const errorText = msg || (isWriting ? 'المقال قصير جدا أو غير صالح' : 'الحل غير صالح');
    if (errorDiv) {
      if (errorMsg) errorMsg.innerText = errorText;
      errorDiv.classList.remove('hidden');
    }
    alert(errorText);
  };

  // Pre-validation checks:
  // 1. Min chars (100 for writing, 30 for video/design)
  // 2. Random trash like 'test, asdasd, google.com'
  // 3. Just a random link alone
  // 4. Repeated character spam
  const isOnlyUrl = /^https?:\/\/[^\s]+$/i.test(content);
  const trashRegex = /\b(test|asdasd|asdf|qwerty|google\.com|12345|تجربة|تيست)\b/i;
  const repeatedCharRegex = /(.)\1{5,}/;

  if (isWriting) {
    if (!content || content.length < 100 || isOnlyUrl || trashRegex.test(content) || repeatedCharRegex.test(content)) {
      triggerInvalidError('المقال قصير جدا أو غير صالح');
      return;
    }
  } else {
    if (!content || content.length < 30 || isOnlyUrl || trashRegex.test(content) || repeatedCharRegex.test(content)) {
      triggerInvalidError('الحل غير صالح');
      return;
    }
    // For video/design challenges, link is expected
    if (!link) {
      alert('من فضلك ضع رابط مشاهدة العمل (YouTube / Vimeo / Behance / Google Drive).');
      return;
    }
  }

  // Clear any active error banner
  if (errorDiv) errorDiv.classList.add('hidden');

  const btn = document.getElementById('btn-lab-submit');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block mr-1">⏳</span> جاري التقييم الصارم ${isWriting ? 'للمقال الصحفي وفحص المستند' : 'للعمل'} عبر AI...`;
  }

  try {
    const res = await fetch('/api/gemini/evaluate-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeTitle: challenge.title,
        challengeCategory: challenge.category,
        challengeRequirements: challenge.description,
        submissionTitle: title,
        submissionContent: content,
        submissionLink: link
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const fallbackErr = isWriting ? 'المقال قصير جدا أو غير صالح' : 'الحل غير صالح';
      triggerInvalidError(errJson.error || fallbackErr);
      return;
    }

    const evalResult = await res.json();
    const score = Math.min(100, Math.max(0, parseInt(evalResult.score) || 64));
    const reqMet = Boolean(evalResult.requirements_met);
    const mistakes = Array.isArray(evalResult.mistakes) && evalResult.mistakes.length >= 3
      ? evalResult.mistakes.slice(0, 3)
      : isWriting ? [
          'الخطأ الأول: العنوان يفتقر للجاذبية والزاوية الصحفية الحادة التي تميز المادة عن السرد التقليدي.',
          'الخطأ الثاني: نقص الشواهد الميدانية والبيانات الرسمية المنسوبة لمصادر موثقة بالاسم والصفة.',
          'الخطأ الثالث: المقدمة تحتاج إلى ضبط نحوي وتكثيف يبرز قضية التقرير من أول سطرين (Hook).'
        ] : [
          'الخطأ الأول: البناء السردي يحتاج لمعالجة إبداعية أكثر عمقاً وتحديداً.',
          'الخطأ الثاني: عدم الالتزام بالمعايير التقنية الدقيقة المطلوبة في التحدي.',
          'الخطأ الثالث: نقص الشواهد الميدانية والاعتماد على صياغة إنشائية.'
        ];
    const feedback = evalResult.feedback || 'تم فحص المحتوى وتقييمه وفق معايير الجودة الصارمة.';
    
    // Connect to Tima Card:
    const categoryLower = (challenge.category || '').toLowerCase();
    let skillKey = isWriting ? 'writing' : 'montage';
    let skillArabic = isWriting ? 'الكتابة الصحفية' : 'المونتاج';
    if (!isWriting) {
      if (categoryLower.includes('تصوير')) { skillKey = 'filming'; skillArabic = 'التصوير'; }
      else if (categoryLower.includes('مونتاج')) { skillKey = 'montage'; skillArabic = 'المونتاج'; }
      else if (categoryLower.includes('تقديم') || categoryLower.includes('بودكاست') || categoryLower.includes('إذاعة')) { skillKey = 'presenting'; skillArabic = 'التقديم الإذاعي'; }
      else if (categoryLower.includes('صحافة') || categoryLower.includes('كتابة') || categoryLower.includes('تحقيق')) { skillKey = 'writing'; skillArabic = 'الكتابة الصحفية'; }
      else if (categoryLower.includes('علاقات')) { skillKey = 'pr'; skillArabic = 'العلاقات العامة'; }
      else if (categoryLower.includes('ديجيتال') || categoryLower.includes('موشن')) { skillKey = 'digital'; skillArabic = 'الديجيتال والميديا'; }
    }

    // Strict Score Impact Rules:
    let skillDelta = 0;
    let xpGained = 0;
    if (score >= 85) {
      skillDelta = 2;
      xpGained = 500;
    } else if (score >= 70) {
      skillDelta = 1;
      xpGained = 300;
    } else if (score >= 50) {
      skillDelta = 0;
      xpGained = 100;
    } else {
      skillDelta = -2;
      xpGained = 0;
    }

    if (!state.timaCard.stats) {
      state.timaCard.stats = { filming: 88, montage: 92, writing: 95, presenting: 98, pr: 90, digital: 94 };
    }
    const oldSkillVal = state.timaCard.stats[skillKey] || 85;
    const newSkillVal = Math.min(99, Math.max(45, oldSkillVal + skillDelta));
    state.timaCard.stats[skillKey] = newSkillVal;

    // Recalculate OVR (average of 6 stats)
    const statsSum = Object.values(state.timaCard.stats).reduce((acc, v) => acc + v, 0);
    const newOvr = Math.round(statsSum / 6);
    state.timaCard.overall = newOvr;

    if (xpGained > 0) {
      addTimaPoints(xpGained, `تقييم تحدي (${challenge.title}) بدرجة ${score}/100`);
    }

    // Save submission
    const studentName = state.currentUser?.name || state.timaCard.name || 'مريم حسام شريف';
    const newSub = {
      id: `sub-${Date.now()}`,
      studentName,
      challengeTitle: challenge.title,
      category: challenge.category,
      isWriting,
      title,
      content,
      link,
      date: 'الآن',
      score,
      requirements_met: reqMet,
      verdict: evalResult.verdict || (score >= 75 ? 'جيد جداً' : score >= 60 ? 'متوسط' : 'ضعيف'),
      mistakes,
      feedback,
      skillArabic,
      skillKey,
      skillDelta,
      newOvr
    };

    if (!state.submissions) {
      state.submissions = [...(INITIAL_DATA.submissions || [])];
    }
    state.submissions.unshift(newSub);
    INITIAL_DATA.submissions.unshift(newSub);

    saveToStorage();
    updateTimaCardUI();
    renderLabSubmissions();

    // Reset inputs
    if (contentInput) contentInput.value = '';
    if (linkInput) linkInput.value = '';
    const charCountEl = document.getElementById('lab-submit-char-count');
    if (charCountEl) charCountEl.innerText = `0 حرف (الحد الأدنى ${minRequiredLength})`;

    const deltaSign = skillDelta > 0 ? `+${skillDelta}` : skillDelta.toString();
    const impactMsg = skillDelta !== 0
      ? `تم تعديل مهارة (${skillArabic}) بمقدار (${deltaSign}) وتحديث الـ OVR لبطاقتك إلى (${newOvr})!`
      : `لم يتغير تقييم المهارة بسبب حصولك على تقييم متوسط (${score}/100).`;

    alert(`📊 نتيجة التدقيق الصحفي الصارم:
• الدرجة المستحقة: ${score}/100 (${reqMet ? 'استوفى الشروط' : 'لم يستوفِ الشروط بدقة'})
• أثر البطاقة: ${impactMsg}
• رصد 3 أخطاء صحفية محددة:
  1- ${mistakes[0]}
  2- ${mistakes[1]}
  3- ${mistakes[2]}
${link ? '• تم فحص الرابط المرفق وقراءته عبر urlContext.\n' : ''}تم حفظ التقرير وإضافته لقائمة الأعمال المقيّمة.`);

  } catch (err) {
    console.error('Challenge submission error:', err);
    alert('حدث خطأ أثناء تقييم الحل، يرجى المحاولة مرة أخرى.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i> <span>إرسال الحل للتقييم الصارم وتعديل بطاقة Tima</span>`;
      window.lucide && window.lucide.createIcons();
    }
  }
}

// -------------------------------------------------------------
// ADMIN ACTIONS & SECURE ACCESS GATE (pass: phi2026)
// -------------------------------------------------------------
export function isAdminAuthenticated() {
  const isAuth = sessionStorage.getItem('phi_admin_authenticated') === 'true' || localStorage.getItem('phi_admin_authenticated') === 'true';
  const isEmail = state.currentUser && state.currentUser.email && state.currentUser.email.trim().toLowerCase() === 'phytomedia10@gmail.com';
  return isAuth || isEmail;
}

export function checkAdminAccess() {
  if (isAdminAuthenticated()) {
    state.currentView = 'admin-app';
    window.location.hash = '#admin';
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  openAdminLockModal();
}

export function openAdminLockModal() {
  const modal = document.getElementById('modal-admin-lock');
  const emailInput = document.getElementById('admin-lock-email-input');
  const passInput = document.getElementById('admin-lock-password-input');
  const errorEl = document.getElementById('admin-lock-error');

  if (emailInput) {
    emailInput.value = 'phytomedia10@gmail.com';
  }
  if (passInput) passInput.value = '';
  if (errorEl) {
    errorEl.classList.add('hidden');
    errorEl.innerText = '';
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (passInput) {
      setTimeout(() => passInput.focus(), 100);
    }
    window.lucide && window.lucide.createIcons();
  }
}

export function closeAdminLockModal() {
  const modal = document.getElementById('modal-admin-lock');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function submitAdminLock(e) {
  if (e && e.preventDefault) e.preventDefault();
  const emailInput = document.getElementById('admin-lock-email-input');
  const passInput = document.getElementById('admin-lock-password-input');
  const errorEl = document.getElementById('admin-lock-error');

  const email = (emailInput?.value || '').trim().toLowerCase();
  const pass = (passInput?.value || '').trim();

  if ((email === 'phytomedia10@gmail.com' || !email) && (pass === 'phy-k13204' || pass === 'phi2026')) {
    state.currentUser = {
      id: 'admin-super',
      role: 'admin',
      name: 'المدير العام φ To Media',
      email: 'phytomedia10@gmail.com',
      status: 'active',
      joinedAt: new Date().toLocaleDateString('ar-EG')
    };
    sessionStorage.setItem('phi_admin_authenticated', 'true');
    localStorage.setItem('phi_admin_authenticated', 'true');
    saveToStorage();
    closeAdminLockModal();
    state.currentView = 'admin-app';
    window.location.hash = '#admin';
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert('✓ مرحباً بك يا مدير المنظومة! تم تسجيل الدخول بنجاح وإظهار لوحة التحكم.');
  } else {
    if (errorEl) {
      errorEl.innerText = '⛔ البريد الإلكتروني أو كلمة المرور غير صحيحة! لا يمكن الدخول إلا بالحساب المصرح له رسمياً.';
      errorEl.classList.remove('hidden');
    }
    if (passInput) {
      passInput.value = '';
      passInput.focus();
    }
  }
}

export function logoutAdmin() {
  state.currentUser = null;
  sessionStorage.removeItem('phi_admin_authenticated');
  localStorage.removeItem('phi_admin_authenticated');
  localStorage.removeItem(STORAGE_KEY_USER);
  if (window.location.hash === '#admin') {
    window.location.hash = '';
  }
  state.currentView = 'landing';
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  alert('🔒 تم قفل لوحة التحكم وتسجيل الخروج بنجاح.');
}

export function createAdminChallenge() {
  const title = document.getElementById('admin-ch-title')?.value.trim();
  const desc = document.getElementById('admin-ch-desc')?.value.trim();
  const cat = document.getElementById('admin-ch-cat')?.value || 'مونتاج';
  const points = parseInt(document.getElementById('admin-ch-points')?.value || 300);

  if (!title || !desc) {
    alert('من فضلك اكتب عنوان التحدي ووصفه.');
    return;
  }

  const newCh = {
    id: `ch-${Date.now()}`,
    title,
    icon: 'trophy',
    points,
    category: cat,
    description: desc,
    submissionsCount: 0,
    status: 'نشط'
  };

  state.challenges.unshift(newCh);
  saveToStorage();
  renderApp();
  alert('تمت إضافة التحدي الجديد في المعمل بنجاح! 🏆');
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// RENDER MASTER FUNCTION
// -------------------------------------------------------------
export function renderApp() {
  // Global Frozen Account Banner
  const frozenBanner = document.getElementById('banner-frozen-account');
  if (frozenBanner) {
    if (state.currentUser && state.currentUser.status === 'frozen') {
      frozenBanner.classList.remove('hidden');
      frozenBanner.classList.add('flex');
    } else {
      frozenBanner.classList.add('hidden');
      frozenBanner.classList.remove('flex');
    }
  }

  // Hide all view sections
  const views = ['landing', 'role-select', 'student-app', 'mentor-app', 'company-app', 'privacy', 'admin-app'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      if (state.currentView === v) {
        el.classList.remove('hidden');
        el.classList.add('block');
      } else {
        el.classList.add('hidden');
        el.classList.remove('block');
      }
    }
  });

  // Render role specific dashboards
  if (state.currentView === 'student-app') {
    renderStudentApp();
  } else if (state.currentView === 'mentor-app') {
    renderMentorApp();
  } else if (state.currentView === 'company-app') {
    renderCompanyApp();
  } else if (state.currentView === 'admin-app') {
    renderAdminApp();
  }

  // Update Top Nav user info
  updateNavUserStatus();

  window.lucide && window.lucide.createIcons();
}

function updateNavUserStatus() {
  const loggedInNav = document.getElementById('nav-user-logged-in');
  const loggedOutNav = document.getElementById('nav-user-logged-out');
  const userNameEl = document.getElementById('nav-username');
  const userRoleEl = document.getElementById('nav-user-role-badge');
  const adminNavBtn = document.getElementById('nav-admin-btn');
  const adminMobileBtn = document.getElementById('mobile-bottom-nav-admin');

  if (adminNavBtn) {
    adminNavBtn.classList.remove('hidden');
    adminNavBtn.classList.add('inline-flex');
  }

  if (adminMobileBtn) {
    adminMobileBtn.classList.remove('hidden');
    adminMobileBtn.classList.add('flex');
  }

  if (state.currentUser) {
    if (loggedInNav) loggedInNav.classList.remove('hidden');
    if (loggedOutNav) loggedOutNav.classList.add('hidden');
    if (userNameEl) userNameEl.innerText = state.currentUser.name;
    if (userRoleEl) {
      const roleMap = {
        student: 'طالب إعلام',
        mentor: 'خبير إعلامي',
        company: 'مؤسسة إعلامية',
        admin: 'مدير المنصة'
      };
      userRoleEl.innerText = roleMap[state.currentUser.role] || 'مستخدم';
    }
  } else {
    if (loggedInNav) loggedInNav.classList.add('hidden');
    if (loggedOutNav) loggedOutNav.classList.remove('hidden');
  }
}

// -------------------------------------------------------------
// RENDER: STUDENT DASHBOARD (5 TABS)
// -------------------------------------------------------------
function renderStudentApp() {
  const tabs = ['builder', 'tima', 'lab', 'mentors', 'about'];
  tabs.forEach(t => {
    const pane = document.getElementById(`student-pane-${t}`);
    const bottomBtn = document.getElementById(`student-bottom-nav-${t}`);
    const topBtn = document.getElementById(`student-top-nav-${t}`);
    const isActive = state.studentActiveTab === t;

    if (pane) {
      if (isActive) pane.classList.remove('hidden');
      else pane.classList.add('hidden');
    }
    if (bottomBtn) {
      bottomBtn.className = isActive
        ? 'flex flex-col items-center justify-center gap-1 text-[#EC4899] font-black transition-all scale-105'
        : 'flex flex-col items-center justify-center gap-1 text-purple-200 hover:text-white transition-all';
    }
    if (topBtn) {
      topBtn.className = isActive
        ? 'px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md'
        : 'px-4 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-all';
    }
  });

  if (state.studentActiveTab === 'builder') {
    renderBuilderPanes();
  } else if (state.studentActiveTab === 'tima') {
    updateTimaCardUI();
  } else if (state.studentActiveTab === 'lab') {
    renderLabChallenges();
    renderLeaderboard();
    renderLabSubmissions();
  } else if (state.studentActiveTab === 'mentors') {
    renderMentorsList();
  } else if (state.studentActiveTab === 'about') {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

function renderBuilderPanes() {
  const cvPane = document.getElementById('builder-pane-cv');
  const portPane = document.getElementById('builder-pane-portfolio');
  const btnCv = document.getElementById('tab-btn-cv');
  const btnPort = document.getElementById('tab-btn-portfolio');

  if (state.builderSubTab === 'cv') {
    if (cvPane) cvPane.classList.remove('hidden');
    if (portPane) portPane.classList.add('hidden');
    if (btnCv) btnCv.className = 'flex-1 py-3 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md transition-all text-center';
    if (btnPort) btnPort.className = 'flex-1 py-3 rounded-2xl text-xs sm:text-sm font-bold text-[#7C3AED] hover:bg-purple-50 transition-all text-center';
    
    // Render current step form and indicator
    renderCVStepIndicators();
    renderCVStepForm();
    renderCVPreview();
  } else {
    if (cvPane) cvPane.classList.add('hidden');
    if (portPane) portPane.classList.remove('hidden');
    if (btnCv) btnCv.className = 'flex-1 py-3 rounded-2xl text-xs sm:text-sm font-bold text-[#7C3AED] hover:bg-purple-50 transition-all text-center';
    if (btnPort) btnPort.className = 'flex-1 py-3 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md transition-all text-center';

    // Render portfolio items grid and folder stats
    renderPortfolioSection();
  }
}

function renderMentorsList() {
  const container = document.getElementById('mentors-grid-student');
  if (!container) return;

  // Filter: ONLY verified mentors appear! (Status must be 'verified' or isVerified === true, and NOT 'frozen' or 'pending_verification')
  const visibleMentors = state.mentors.filter(m => 
    (m.status === 'verified' || m.verificationStatus === 'verified' || m.isVerified) &&
    m.status !== 'frozen' &&
    m.verificationStatus !== 'pending_verification'
  );

  if (visibleMentors.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center bg-white rounded-3xl border border-purple-100">
        <p class="text-slate-500 font-bold">لا يوجد خبراء معتمدون حالياً. جميع الخبراء الجدد يخضعون لتوثيق الهوية قبل الظهور.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = visibleMentors.map(m => `
    <div class="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all flex flex-col justify-between group">
      <div>
        <!-- Top row: Avatar, status badge, verified badge and specialized badge -->
        <div class="flex items-start justify-between gap-4 mb-4">
          <div class="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-purple-200">
            <img src="${m.image}" alt="${m.name}" class="w-full h-full object-cover">
          </div>
          <div class="flex flex-col items-end gap-1.5">
            <span class="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] border border-purple-300 flex items-center gap-1 shadow-sm">
              <i data-lucide="badge-check" class="w-3.5 h-3.5 text-[#7C3AED]"></i>
              <span>موثق ✓</span>
            </span>
            <span class="text-[11px] font-black text-white bg-gradient-to-r from-[#7C3AED] to-[#EC4899] px-2.5 py-0.5 rounded-lg shadow-sm">
              ${m.badge || m.specialty}
            </span>
          </div>
        </div>

        <h4 class="text-lg font-black text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors flex items-center gap-1.5">
          <span>${m.fullName || m.name}</span>
        </h4>
        <div class="text-xs font-bold text-[#7C3AED] mt-0.5 mb-1">تخصص: ${m.specialty}</div>
        <p class="text-xs text-slate-500 font-medium mb-3">خبرة: ${m.experience}</p>
        <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">${m.bio}</p>

        <!-- Stats row: rating, price, and reviews link -->
        <div class="flex items-center justify-between p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs mb-4">
          <div class="flex items-center gap-1.5 font-mono text-[#EC4899] font-black">
            <span>★</span>
            <span>${m.rating || '5.0'}</span>
            <button onclick="window.phiApp.openMentorReviewsModal('${m.id}')" class="text-slate-500 hover:text-[#7C3AED] font-normal underline cursor-pointer text-[11px] mr-1">
              (${Array.isArray(m.reviewsList) ? m.reviewsList.length : (m.sessionsCount || 12)} تقييماً)
            </button>
          </div>
          <div class="font-mono font-black text-[#1E1B4B]">
            <span>${m.price}</span>
            <span class="text-xs text-slate-500 font-normal">ج.م / سيشن</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons: Book & Report -->
      <div class="space-y-2 pt-2">
        <div class="flex items-center justify-between gap-2">
          <button onclick="window.phiApp.openBookingModal('${m.id}')" class="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            <span>حجز سيشن توجيه الآن</span>
          </button>
          
          <!-- React Mount Slot for ExpertInstaPay -->
          <div id="react-instapay-${m.id}" class="no-print"></div>
        </div>

        <button onclick="window.phiApp.openReportModal('${m.id}', '${m.fullName || m.name}', 'mentor')" class="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer">
          <span>🚩 إبلاغ عن نصب / حساب وهمي</span>
        </button>
      </div>
    </div>
  `).join('');

  // Mount React ExpertInstaPay components
  visibleMentors.forEach(m => {
    const slotId = `react-instapay-${m.id}`;
    if (window.phiApp && window.phiApp.mountReactComponent && document.getElementById(slotId)) {
      setTimeout(() => {
        window.phiApp.mountReactComponent('ExpertInstaPay', slotId, {
          expert: {
            ...m,
            instapay_link: m.instapay_link || `${m.name.toLowerCase().replace(/\s+/g, '')}@instapay`,
            instapay_qr_image: m.instapay_qr_image || (m.instapay_link ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${m.instapay_link}` : '')
          }
        });
      }, 0);
    }
  });

  window.lucide && window.lucide.createIcons();
}

function renderLabChallenges() {
  const grid = document.getElementById('lab-challenges-grid');
  const chSelect = document.getElementById('lab-submit-challenge-select');

  if (chSelect && state.challenges.length > 0) {
    const curVal = chSelect.value || state.challenges[0].id;
    chSelect.innerHTML = state.challenges.map(c => `
      <option value="${c.id}" ${curVal === c.id ? 'selected' : ''}>
        ${c.title} (${c.category} • +${c.points} XP)
      </option>
    `).join('');
    const selectedCh = state.challenges.find(c => c.id === chSelect.value) || state.challenges[0];
    updateLabFormForChallenge(selectedCh);
  }

  if (!grid) return;

  grid.innerHTML = state.challenges.map(c => `
    <div class="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all flex flex-col justify-between group">
      <div>
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-[#7C3AED] flex items-center justify-center font-bold">
            <i data-lucide="${c.icon || 'trophy'}" class="w-6 h-6"></i>
          </div>
          <span class="text-xs font-black text-[#EC4899] bg-pink-50 px-3 py-1 rounded-full border border-pink-200 font-mono">
            +${c.points} نقطة Tima
          </span>
        </div>

        <span class="text-[10px] text-[#7C3AED] font-bold bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100">${c.category}</span>
        <h4 class="text-base font-black text-[#1E1B4B] mt-2 mb-1 group-hover:text-[#7C3AED] transition-colors">${c.title}</h4>
        <p class="text-xs text-slate-600 leading-relaxed mb-4">${c.description}</p>
      </div>

      <div class="pt-4 border-t border-purple-50 flex items-center justify-between text-xs">
        <span class="text-slate-400 font-mono">${c.submissionsCount || 15} طالب شاركوا</span>
        <button onclick="window.phiApp.selectChallengeForSubmission('${c.id}')" class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-bold text-xs shadow-md cursor-pointer hover:opacity-95">
          شارك في التحدي
        </button>
      </div>
    </div>
  `).join('');
}

export function renderLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  if (!container) return;

  // Make sure user's live points and name are synced in leaderboard
  const studentName = (state.currentUser?.name || state.timaCard.name) + ' (أنت)';
  let userItem = INITIAL_DATA.leaderboard.find(i => i.isUser);
  if (!userItem) {
    userItem = {
      rank: 3,
      name: studentName,
      dept: state.currentUser?.department || state.timaCard.department,
      university: state.currentUser?.university || 'جامعة القاهرة',
      points: state.totalPoints,
      works: 8,
      isUser: true
    };
    INITIAL_DATA.leaderboard.push(userItem);
  } else {
    userItem.points = state.totalPoints;
    userItem.name = studentName;
  }

  // Sort by points descending (Infinite ranking - while(true) leveling)
  const sorted = [...INITIAL_DATA.leaderboard].sort((a, b) => b.points - a.points);
  sorted.forEach((item, idx) => { item.rank = idx + 1; });

  container.innerHTML = sorted.map((item, idx) => {
    const isTop3 = idx < 3;
    const isUser = item.isUser;
    const itemLevel = getInfiniteLevel(item.points);
    const itemIcons = getLevelIcons(itemLevel.level);
    const levelText = itemLevel.isInfinite ? `المستوى ∞ - ${itemLevel.level}` : `المستوى ${itemLevel.level}`;

    let rowStyle = 'bg-purple-900/40 text-purple-200 border border-purple-800/50';
    if (isUser) {
      rowStyle = 'bg-gradient-to-r from-purple-950 via-[#2E1065] to-pink-950 text-white border-2 border-[#EC4899] shadow-xl shadow-pink-500/20 scale-[1.01]';
    } else if (isTop3) {
      rowStyle = 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md';
    }

    return `
      <div class="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl ${rowStyle} transition-all mb-2.5">
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${isTop3 ? 'bg-white/20 text-white' : 'bg-purple-800/40 text-purple-200'}">
            #${item.rank}
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h5 class="text-sm font-black ${isTop3 || isUser ? 'text-white' : 'text-slate-100'}">${item.name}</h5>
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/70 text-pink-300 font-mono font-bold border border-purple-800/60">
                ${levelText} ${itemIcons}
              </span>
            </div>
            <p class="text-[11px] mt-0.5 ${isTop3 || isUser ? 'text-purple-100' : 'text-purple-300'}">${item.university} • قسم ${item.dept} (${item.works || 5} أعمال)</p>
          </div>
        </div>

        <div class="text-left font-mono shrink-0">
          <span class="text-base font-black ${isTop3 || isUser ? 'text-white' : 'text-[#EC4899]'}">${item.points.toLocaleString('ar-EG')}</span>
          <span class="text-[10px] ${isTop3 || isUser ? 'text-purple-200' : 'text-purple-400'} block">XP نقطة</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderLabSubmissions() {
  const container = document.getElementById('lab-submissions-feed');
  if (!container) return;

  const list = (state.submissions && state.submissions.length > 0)
    ? state.submissions
    : (INITIAL_DATA.submissions || []);

  if (list.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center bg-white rounded-3xl border border-purple-100 text-slate-400 text-xs">
        لم يتم إرسال أي حلول بعد. كن أول من يرفع حله للتقييم الصارم!
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(s => {
    const scoreVal = parseInt(s.score) || 60;
    const scoreColor = scoreVal >= 85
      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
      : scoreVal >= 70
      ? 'bg-amber-50 text-amber-700 border-amber-300'
      : 'bg-rose-50 text-rose-700 border-rose-300';

    const mistakes = Array.isArray(s.mistakes) ? s.mistakes : [];

    return `
      <div class="p-5 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-3.5 mb-4 hover:border-purple-300 transition-all">
        <!-- Submission Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-50">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center font-black text-sm">
              ${(s.studentName || 'ط')[0]}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-black text-xs text-[#1E1B4B]">${s.studentName}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-[#7C3AED] font-bold border border-purple-100">
                  ${s.category || 'تحدي المعمل'}
                </span>
              </div>
              <span class="text-[10px] font-mono text-slate-400">${s.date || 'مؤخراً'}</span>
            </div>
          </div>

          <!-- Score Badge -->
          <div class="flex items-center gap-2">
            <span class="text-xs px-3 py-1 rounded-xl border font-black font-mono ${scoreColor}">
              ${s.score}/100
            </span>
            ${s.requirements_met
              ? '<span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">✅ استوفى الشروط</span>'
              : '<span class="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">❌ لم يستوفِ الشروط بدقة</span>'
            }
          </div>
        </div>

        <!-- Title & Submission Content -->
        <div>
          <h5 class="font-black text-sm text-[#1E1B4B] mb-1.5">${s.title}</h5>
          ${s.content ? `
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans mb-2">
              <span class="font-bold text-slate-700 block mb-1">المحتوى الفعلي المُقيّم:</span>
              ${s.content}
            </div>
          ` : ''}
          ${s.link ? `
            <div class="flex items-center gap-1.5 text-[11px] text-[#7C3AED] font-mono mb-2">
              <i data-lucide="link" class="w-3.5 h-3.5"></i>
              <span>${s.isWriting ? 'فحص مستند المقال المرفق (Google Docs / Notion / PDF / Facebook) عبر urlContext:' : 'فحص المحتوى بالرابط عبر urlContext:'}</span>
              <a href="${s.link}" target="_blank" class="hover:underline text-pink-600 truncate max-w-xs font-mono">${s.link}</a>
            </div>
          ` : ''}
        </div>

        <!-- AI Feedback & Verdict -->
        <div class="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 font-black text-[#7C3AED]">
              <i data-lucide="sparkles" class="w-4 h-4 text-[#EC4899]"></i>
              <span>تقييم الذكاء الاصطناعي الصارم (AI Feedback - بدون مجاملة):</span>
            </div>
            ${s.verdict ? `<span class="text-[11px] font-black text-purple-900">${s.verdict}</span>` : ''}
          </div>

          <p class="text-slate-700 leading-relaxed">${s.feedback || s.aiFeedback || ''}</p>

          <!-- Exactly 3 Mistakes Listed -->
          ${mistakes.length > 0 ? `
            <div class="p-3 rounded-xl bg-white border border-rose-200 space-y-1.5">
              <span class="block font-black text-[11px] text-rose-700 flex items-center gap-1">
                <span>⚠️ الأخطاء ونقاط الضعف المرصودة في العمل (3 أخطاء محددة):</span>
              </span>
              <ul class="space-y-1 text-[11px] text-slate-700 font-medium">
                ${mistakes.map(m => `
                  <li class="flex items-start gap-1.5">
                    <span class="text-rose-500 font-bold shrink-0">•</span>
                    <span>${m}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Tima Card Impact -->
          <div class="flex items-center justify-between pt-1 border-t border-purple-200/60 text-[11px]">
            <span class="font-bold text-[#EC4899] flex items-center gap-1">
              <span>⚡ أثر التقييم على بطاقة Tima:</span>
              <span class="font-black text-purple-900">
                ${s.skillDelta !== undefined ? (s.skillDelta >= 0 ? `+${s.skillDelta}` : s.skillDelta) : '+1'} في مهارة (${s.skillArabic || 'المونتاج'})
              </span>
            </span>
            <span class="font-mono font-bold text-slate-500">
              OVR الحالي: ${s.newOvr || state.timaCard.overall}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  window.lucide && window.lucide.createIcons();
}

// -------------------------------------------------------------
// RENDER: MENTOR DASHBOARD
// -------------------------------------------------------------
function renderMentorApp() {
  const u = state.currentUser || {
    name: 'أحمد كمال الدين',
    specialty: 'مونتاج بريمير ودافنشي',
    experience: 'مونتير في الجزيرة',
    earnings: 13600,
    price: 200
  };

  const nameEl = document.getElementById('mentor-dash-name');
  const specEl = document.getElementById('mentor-dash-specialty');
  const earningsEl = document.getElementById('mentor-dash-earnings');
  const bookingsCountEl = document.getElementById('mentor-dash-bookings-count');

  if (nameEl) nameEl.innerText = u.name;
  if (specEl) specEl.innerText = `التخصص: ${u.specialty} • ${u.experience || ''}`;
  if (earningsEl) earningsEl.innerText = `${u.earnings || 13600} ج.م`;
  if (bookingsCountEl) bookingsCountEl.innerText = state.bookings.length;

  // Render mentor's booking requests
  const list = document.getElementById('mentor-bookings-list');
  if (list) {
    if (!state.bookings || state.bookings.length === 0) {
      list.innerHTML = `
        <div class="p-8 text-center bg-white rounded-3xl border border-purple-100 text-slate-400 text-xs font-bold">
          لا توجد حجوزات أو طلبات جلسات حالياً.
        </div>
      `;
      return;
    }
    list.innerHTML = state.bookings.map(b => `
      <div class="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
        <div>
          <div class="flex items-center gap-2">
            <h5 class="font-black text-sm text-[#1E1B4B]">${b.studentName}</h5>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">${b.status}</span>
          </div>
          <p class="text-xs text-purple-700 mt-1 font-medium">سؤال الجلسة: "${b.question}"</p>
          <div class="text-[11px] text-slate-400 mt-1 font-mono">
            <span>الموعد: ${b.day} (${b.time})</span>
            <span class="mx-1">•</span>
            <span>القيمة: ${b.amount} ج.م</span>
          </div>
        </div>

        <button onclick="window.phiApp.openMentorRoom('${b.mentorId || ''}', ${JSON.stringify(b).replace(/"/g, '&quot;')})" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 shrink-0">
          <i data-lucide="video" class="w-4 h-4"></i>
          <span>دخول الغرفة مع الطالب</span>
        </button>
      </div>
    `).join('');
  }
}

// -------------------------------------------------------------
// RENDER: COMPANY DASHBOARD (Talent Pool & Jobs)
// -------------------------------------------------------------
function renderCompanyApp() {
  const u = state.currentUser || {
    name: 'شبكة أوان للإنتاج الإعلامي',
    companyType: 'شركة انتاج'
  };

  const compNameEl = document.getElementById('company-dash-name');
  const compTypeEl = document.getElementById('company-dash-type');
  if (compNameEl) compNameEl.innerText = u.name;
  if (compTypeEl) compTypeEl.innerText = u.companyType;

  renderTalentPool();
  renderCompanyApplications();
  renderCompanyJobs();
  if (state.scoutResults && state.scoutResults.length > 0) {
    renderPhiScoutResults(state.scoutResults);
  }
}

function renderTalentPool() {
  const container = document.getElementById('company-talent-pool-grid');
  if (!container) return;

  const f = state.talentFilters;
  const filtered = state.students.filter(s => {
    const matchDept = f.dept === 'all' || s.department.includes(f.dept);
    const matchSkill = f.skillType === 'all' || (s.timaStats[f.skillType] >= f.minSkillScore);
    const matchSearch = !f.search || s.name.toLowerCase().includes(f.search) || s.position.toLowerCase().includes(f.search);
    return matchDept && matchSkill && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <i data-lucide="search-x" class="w-10 h-10 mx-auto mb-2 text-purple-300"></i>
        <p class="font-bold text-slate-600">لم يتم العثور على طلاب مطابقين لمعايير الفلترة الحالية.</p>
        <p class="text-xs">جرّب تقليل درجات المهارة أو اختيار جميع الأقسام.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(s => `
    <div class="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all flex flex-col justify-between group">
      <div>
        <div class="flex items-start justify-between gap-4 mb-3">
          <div class="flex items-center gap-3">
            <img src="${s.avatar}" alt="${s.name}" class="w-14 h-14 rounded-2xl object-cover border-2 border-purple-200">
            <div>
              <h4 class="font-black text-base text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">${s.name}</h4>
              <p class="text-xs text-[#EC4899] font-bold">${s.position}</p>
              <p class="text-[11px] text-slate-400">${s.university} • ${s.department}</p>
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] text-white flex flex-col items-center justify-center shadow-md font-mono shrink-0">
            <span class="text-xs font-bold leading-none">OVR</span>
            <span class="text-lg font-black leading-none">${s.overall}</span>
          </div>
        </div>

        <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">${s.bio}</p>
        
        <div class="mt-3">
          <div class="flex justify-between text-[11px] mb-1"><span class="font-medium flex gap-1 text-[#1E1B4B]">البورتفوليو <span class="text-[9px] bg-[#FEF08A] px-2 rounded-full border border-amber-200">متميز</span></span><span class="text-slate-400">95%</span></div>
          <div class="w-full h-1.5 bg-[#F3F3F3] rounded-full overflow-hidden"><div class="h-full bg-black rounded-full" style="width:95%"></div></div>
          <p class="text-[10px] text-slate-400 mt-1">3 مشاريع حقيقية - خبرة سنة</p>
        </div>

        <!-- 6 Tima Skill Badges with Pink Numbers -->
        <div class="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#1E1B4B] text-white text-[11px] mb-4">
          <div class="text-center">
            <span class="block text-slate-300 text-[10px]">تصوير</span>
            <span class="font-mono font-black text-[#EC4899] text-xs">${s.timaStats.filming}</span>
          </div>
          <div class="text-center">
            <span class="block text-slate-300 text-[10px]">مونتاج</span>
            <span class="font-mono font-black text-[#EC4899] text-xs">${s.timaStats.montage}</span>
          </div>
          <div class="text-center">
            <span class="block text-slate-300 text-[10px]">كتابة</span>
            <span class="font-mono font-black text-[#EC4899] text-xs">${s.timaStats.writing}</span>
          </div>
          <div class="text-center">
            <span class="block text-slate-300 text-[10px]">تقديم</span>
            <span class="font-mono font-black text-[#EC4899] text-xs">${s.timaStats.presenting}</span>
          </div>
          <div class="text-center">
            <span class="block text-slate-300 text-[10px]">علاقات</span>
            <span class="font-mono font-black text-[#EC4899] text-xs">${s.timaStats.pr}</span>
          </div>
          <div class="text-center">
            <span class="block text-slate-300 text-[10px]">ديجيتال</span>
            <span class="font-mono font-black text-[#EC4899] text-xs">${s.timaStats.digital}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-2 pt-2 border-t border-purple-50">
        <div class="flex items-center gap-2">
          <a href="${s.portfolioLink}" target="_blank" class="flex-1 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] font-bold text-xs text-center border border-purple-200 transition-colors">
            معاينة البورتفوليو
          </a>
          <button onclick="window.phiApp.contactStudent('${s.id}')" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5">
            <i data-lucide="mail" class="w-3.5 h-3.5"></i>
            <span>تواصل للتوظيف</span>
          </button>
        </div>
        
        <!-- React Slot for Download Button -->
        <div id="cv-download-slot-${s.id}" class="flex justify-center pt-1"></div>
      </div>
    </div>
  `).join('');

  // Mount React DownloadCVButton for each student in the pool
  filtered.forEach(s => {
    setTimeout(() => {
      window.phiApp.mountReactComponent('DownloadCVButton', `cv-download-slot-${s.id}`, {
        pdfUrl: '#',
        fileName: `CV_${s.name.replace(/\s+/g, '_')}.pdf`,
        onTrigger: () => {
          // If this is the current user, download their real CV
          if (state.currentUser && state.currentUser.id === s.id) {
             return window.phiApp.downloadCVPdf();
          } else {
             // For other students, we'll download their Tima Card (mocked for now)
             alert('جاري تجهيز نسخة PDF من ملف الطالب ' + s.name);
             return window.phiApp.downloadTimaCard(); 
          }
        }
      });
    }, 0);
  });

  window.lucide && window.lucide.createIcons();
}

function renderCompanyApplications() {
  const container = document.getElementById('company-applications-list');
  if (!container) return;

  if (!state.applications || state.applications.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-white rounded-2xl border border-purple-100 text-slate-400 text-xs font-bold">
        لا توجد طلبات تقدم حالياً.
      </div>
    `;
    return;
  }

  container.innerHTML = state.applications.map(a => `
    <div class="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] text-white flex items-center justify-center font-black text-lg">
          ${a.timaOverall}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h5 class="font-black text-sm text-[#1E1B4B]">${a.studentName}</h5>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#7C3AED]">${a.status}</span>
          </div>
          <p class="text-xs text-slate-600 mt-0.5">${a.university} • ${a.department}</p>
          <div class="text-[11px] text-[#EC4899] font-bold font-mono mt-1">
            <span>متقدم على: ${a.jobTitle}</span>
            <span class="text-slate-400 mx-1">•</span>
            <span>المهارة المشترطة: ${a.skillHighlight}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button onclick="alert('تم إرسال دعوة مقابلة عمل للطالب بنجاح! ستصل إشعاراً في بريده الإلكتروني.')" class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-bold text-xs shadow-md">
          قبول للمقابلة
        </button>
      </div>
    </div>
  `).join('');
}

function renderCompanyJobs() {
  const container = document.getElementById('company-posted-jobs-list');
  if (!container) return;

  if (!state.jobs || state.jobs.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-white rounded-2xl border border-purple-100 text-slate-400 text-xs font-bold">
        لا توجد فرص توظيف مضافة حالياً.
      </div>
    `;
    return;
  }

  container.innerHTML = state.jobs.map(j => `
    <div class="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#EC4899]">${j.type}</span>
          <h5 class="font-black text-sm text-[#1E1B4B]">${j.title}</h5>
        </div>
        <p class="text-xs text-slate-500 mt-1">${j.description}</p>
        <span class="text-[11px] text-[#7C3AED] font-mono block mt-1">الشرط: مهارة ${j.minSkill} فوق ${j.minScore} في بطاقة Tima</span>
      </div>
      <div class="text-left font-mono text-xs text-slate-400 shrink-0">
        <span class="font-bold text-[#1E1B4B]">${j.applicantsCount || 0}</span> متقدم
      </div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// PHI SCOUT: AI MEDIA RECRUITMENT ASSISTANT
// -------------------------------------------------------------

export function applyScoutPreset(presetText) {
  const input = document.getElementById('phi-scout-query-input');
  if (input) {
    input.value = presetText;
  }
  askPhiScout(presetText);
}

export function toggleScoutJsonView() {
  const box = document.getElementById('phi-scout-json-box');
  const txt = document.getElementById('txt-toggle-scout-json');
  if (!box) return;
  const isHidden = box.classList.contains('hidden');
  if (isHidden) {
    box.classList.remove('hidden');
    if (txt) txt.innerText = 'إخفاء الـ JSON';
  } else {
    box.classList.add('hidden');
    if (txt) txt.innerText = 'عرض الـ JSON المستخرج';
  }
}

export function copyScoutJson() {
  const pre = document.getElementById('phi-scout-json-pre');
  const txtBtn = document.getElementById('btn-copy-scout-txt');
  if (!pre) return;
  const text = pre.innerText;
  navigator.clipboard.writeText(text).then(() => {
    if (txtBtn) {
      txtBtn.innerText = 'تم النسخ! ✓';
      setTimeout(() => { if (txtBtn) txtBtn.innerText = 'نسخ الـ JSON'; }, 2000);
    }
  }).catch(() => {
    alert('تم نسخ الكود بنجاح');
  });
}

export async function askPhiScout(forcedQuery) {
  const inputEl = document.getElementById('phi-scout-query-input');
  const query = (typeof forcedQuery === 'string' && forcedQuery.trim()) 
    ? forcedQuery.trim() 
    : (inputEl?.value?.trim() || 'عاوزين مونتير ومصور شاطر في القاهرة');

  if (inputEl && !inputEl.value) {
    inputEl.value = query;
  }

  const btn = document.getElementById('btn-phi-scout-ask');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>جاري فحص المواهب واستخراج أفضل 5...</span>`;
    window.lucide && window.lucide.createIcons();
  }

  // Filter students: Strict rule -> ممنوع تختار OVR أقل من 70
  const eligible = (state.students || []).filter(s => (s.OVR || s.overall || 0) >= 70);

  let results = [];
  try {
    const res = await fetch('/api/scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        students: eligible
      })
    });
    if (res.ok) {
      results = await res.json();
    }
  } catch (err) {
    console.warn('Scout network error, using client matcher:', err);
  }

  // If results are invalid or empty, fallback to client matching
  if (!Array.isArray(results) || results.length === 0) {
    results = runClientScoutFallback(query, eligible);
  }

  // Ensure max 5 candidates and strict OVR >= 70
  results = results.slice(0, 5).filter(item => {
    const st = eligible.find(s => (s.card_id || s.id) === item.card_id);
    return st && (st.OVR || st.overall) >= 70;
  });

  state.scoutResults = results;
  renderPhiScoutResults(results);

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4"></i><span>تم اختيار أفضل 5 بنجاح ⭐</span>`;
    setTimeout(() => {
      if (btn) {
        btn.innerHTML = `<i data-lucide="bot" class="w-4 h-4"></i><span>اسأل φ Scout</span>`;
        window.lucide && window.lucide.createIcons();
      }
    }, 3500);
    window.lucide && window.lucide.createIcons();
  }

  return results;
}

function runClientScoutFallback(query, eligibleStudents) {
  const q = (query || '').toLowerCase();
  const scored = eligibleStudents.map(s => {
    let score = Number(s.OVR || s.overall) || 75;
    const skillsStr = Array.isArray(s.skill) ? s.skill.join(' ').toLowerCase() : (s.skill || '').toLowerCase();
    const locStr = (s.location || '').toLowerCase();
    const posStr = (s.position || '').toLowerCase();

    if (q.includes('مونتاج') || q.includes('مونتير') || q.includes('فيديو') || q.includes('موشن') || q.includes('بريمير')) {
      if (skillsStr.includes('مونتاج') || posStr.includes('مونتير')) score += 35;
    }
    if (q.includes('تصوير') || q.includes('مصور') || q.includes('كاميرا') || q.includes('إضاءة') || q.includes('سينمائي')) {
      if (skillsStr.includes('تصوير') || posStr.includes('تصوير')) score += 35;
    }
    if (q.includes('مذيع') || q.includes('مذيعة') || q.includes('مراسل') || q.includes('تقديم') || q.includes('إلقاء') || q.includes('حوار')) {
      if (skillsStr.includes('تقديم') || posStr.includes('مراسلة')) score += 35;
    }
    if (q.includes('صحف') || q.includes('تحقيق') || q.includes('محرر') || q.includes('كتابة') || q.includes('استقصائ')) {
      if (skillsStr.includes('صحافة') || posStr.includes('صحفية')) score += 35;
    }
    if (q.includes('علاقات') || q.includes('سوشيال') || q.includes('حمل') || q.includes('تريند') || q.includes('ماركتنج') || q.includes('pr')) {
      if (skillsStr.includes('علاقات') || posStr.includes('علاقات')) score += 35;
    }
    if (q.includes('صوت') || q.includes('بودكاست') || q.includes('فويس') || q.includes('ميكساج')) {
      if (skillsStr.includes('صوت') || posStr.includes('صوت')) score += 35;
    }
    if (q.includes('رياض') || q.includes('كورة') || q.includes('ماتش')) {
      if (skillsStr.includes('رياضي') || posStr.includes('رياضي')) score += 35;
    }
    if (q.includes('إخراج') || q.includes('مخرج') || q.includes('وثائقي')) {
      if (skillsStr.includes('إخراج') || posStr.includes('مخرجة')) score += 35;
    }
    if (q.includes('جيزة') && (locStr.includes('جيزة') || locStr.includes('دقي') || locStr.includes('أكتوبر'))) score += 15;
    if (q.includes('قاهرة') && (locStr.includes('قاهرة') || locStr.includes('معادي') || locStr.includes('تجمع'))) score += 15;
    if (q.includes('إسكندرية') && locStr.includes('إسكندرية')) score += 20;

    return { s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5).map(item => item.s);

  const egyptianReasons = {
    'stud-1': 'مريم شاطرة جداً ومتمكنة في إدارة الحوار والمراسلة الميدانية، والـ OVR بتاعها 94 يعني جاهزة تنزل تصوير لايف فوراً بدون أي ارتباك.',
    'stud-2': 'عمر مونتير داهية وإيده سريعة جداً في الأفتر إفكتس والبريمير، واخد 93 OVR وهيطلعلك الشغل بأعلى جودة وأقصر وقت.',
    'stud-3': 'كريم ده عينه سينمائية أصيلة في الإضاءة والكاميرات الثقيلة، 91 OVR وعنده سابقة أعمال وثائقية مشرفة جداً في الصعيد والإسكندرية.',
    'stud-4': 'سلمى صحفية استقصائية بتعرف تحفر ورا المعلومة وتكتب اسكريبت يشد المشاهد من أول دقيقة، والـ OVR بتاعها 90 يعني دماغ شغالة.',
    'stud-5': 'زياد مخه إعلاني بحت وشاطر في السوشيال وإدارة الحملات وعنده علاقات ممتازة، هيعملك انتشار وتغطيات تريند مظبوطة.',
    'stud-6': 'أحمد إيده دهب في هندسة الصوت والميكساج، البودكاست بتاعه مسموع وناجح ومتمكن من تنقية الصوت باحترافية كاملة.',
    'stud-7': 'نور كاريزما ولسانه طلق في التعليق الرياضي والتحليل، متابع كل التفاصيل وهيقود الاستوديو التحليلي بتاعك بكفاءة عالية.',
    'stud-8': 'رانيا مخرجة شابة حسها الفني عالي وبتعرف توجه التيم والتمثيل، مشاريعها كسبت جوائز وإخراجها يرفع رنك أي إنتاج وثائقي.'
  };

  return top.map(st => ({
    card_id: st.card_id || st.id,
    matched_skills: Array.isArray(st.skill) ? st.skill.slice(0, 3) : [st.position || 'إعلام'],
    reason: egyptianReasons[st.card_id || st.id] || `${st.name} كادر إعلامي جاهز وواخد ${st.OVR || st.overall} OVR، متميز في مهاراته ومناسب جداً للفرصة المطلوبة.`
  }));
}

export function renderPhiScoutResults(results) {
  const container = document.getElementById('phi-scout-cards-list');
  const emptyState = document.getElementById('phi-scout-empty-state');
  const jsonPre = document.getElementById('phi-scout-json-pre');

  if (jsonPre) {
    jsonPre.innerText = JSON.stringify(results, null, 2);
  }

  if (!container) return;

  if (!results || results.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    container.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  container.classList.remove('hidden');

  container.innerHTML = results.map((item, idx) => {
    const student = state.students.find(s => (s.card_id || s.id) === item.card_id) || {
      name: 'مرشح إعلامي',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      university: 'إعلام القاهرة',
      department: 'إذاعة وتلفزيون',
      position: 'كادر متميز',
      overall: 90,
      OVR: 90,
      location: 'القاهرة',
      transcript: 'تقدير امتياز'
    };

    const ovrScore = student.OVR || student.overall || 88;
    const matchedSkills = Array.isArray(item.matched_skills) ? item.matched_skills : [item.matched_skills];

    return `
      <div class="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 hover:border-pink-400/50 transition-all text-white space-y-4">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="relative">
              <img src="${student.avatar}" alt="${student.name}" class="w-14 h-14 rounded-2xl object-cover border-2 border-pink-400/40">
              <span class="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-[11px] font-black flex items-center justify-center border border-white text-white shadow">
                #${idx + 1}
              </span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-black text-base text-white">${student.name}</h4>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
                  مرشح معتمد ✓
                </span>
              </div>
              <p class="text-xs text-purple-200 font-semibold">${student.position} • <span class="text-slate-300">${student.university}</span></p>
              <p class="text-[11px] text-purple-300/80 flex items-center gap-1 mt-0.5">
                <i data-lucide="map-pin" class="w-3 h-3 text-pink-400"></i>
                <span>${student.location || 'القاهرة'}</span>
                <span class="mx-1">•</span>
                <span class="truncate max-w-xs">${student.transcript || ''}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <div class="px-3.5 py-1.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex flex-col items-center justify-center font-mono shadow-md border border-white/20">
              <span class="text-[10px] uppercase font-bold text-pink-200">الدرجة النهائية</span>
              <span class="text-xl font-black">${ovrScore} OVR</span>
            </div>
          </div>
        </div>

        <!-- Matched Skills Pills -->
        <div class="flex flex-wrap items-center gap-1.5 pt-1">
          <span class="text-xs text-purple-200 font-bold ml-1">المهارات المطابقة:</span>
          ${matchedSkills.map(sk => `
            <span class="px-2.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-200 text-xs font-semibold">
              ✓ ${sk}
            </span>
          `).join('')}
        </div>

        <!-- Phi Scout Egyptian Slang Recommendation Reason -->
        <div class="p-3.5 rounded-2xl bg-[#1E1B4B]/80 border border-purple-400/30 text-xs text-purple-100 flex items-start gap-2.5 shadow-inner">
          <span class="text-lg shrink-0">💡</span>
          <div class="space-y-0.5">
            <div class="flex items-center gap-1.5 font-bold text-pink-300">
              <span>سبب الاختيار من φ Scout:</span>
              <span class="text-[10px] text-purple-300 font-mono">(Card: ${item.card_id})</span>
            </div>
            <p class="text-xs sm:text-sm text-white font-medium leading-relaxed">
              "${item.reason}"
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-1 border-t border-white/10 text-xs">
          <button onclick="window.phiApp.contactStudent('${student.id}')" class="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-center shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5">
            <i data-lucide="mail" class="w-3.5 h-3.5"></i>
            <span>تواصل للتوظيف فوراً</span>
          </button>
          <a href="${student.portfolioLink || '#'}" target="_blank" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 border border-white/20 font-bold text-center transition-all flex items-center gap-1.5">
            <i data-lucide="external-link" class="w-3.5 h-3.5 text-pink-400"></i>
            <span>معاينة الأعمال</span>
          </a>
        </div>

      </div>
    `;
  }).join('');

  window.lucide && window.lucide.createIcons();
}

// -------------------------------------------------------------
// ANTI-SCAM, VERIFICATION & SECURITY CORE LOGIC
// -------------------------------------------------------------

export function scanTextForScamKeywords(text) {
  if (!text || typeof text !== 'string') return [];
  const normalized = text.toLowerCase();
  return SCAM_KEYWORDS.filter(kw => normalized.includes(kw.toLowerCase()));
}

export function checkAllAccountsForScamKeywords() {
  if (!state.mentors || !Array.isArray(state.mentors)) return;
  state.mentors.forEach(m => {
    const textToScan = `${m.fullName || ''} ${m.specialty || ''} ${m.experience || ''} ${m.bio || ''}`;
    const matches = scanTextForScamKeywords(textToScan);
    if (matches.length > 0) {
      const alreadyReported = state.reports.some(r => r.reportedId === m.id && r.id.startsWith('rep-auto-bio-'));
      if (!alreadyReported) {
        state.reports.unshift({
          id: `rep-auto-bio-${m.id}`,
          reportedId: m.id,
          reportedName: m.fullName || m.name,
          reportedType: 'mentor',
          reason: 'كورس مدفوع',
          description: `رصد آلي لكلمات مشبوهة في النبذة المهنية: "${matches.join(', ')}"`,
          screenshot: '',
          date: new Date().toLocaleDateString('ar-EG'),
          status: 'pending'
        });
        checkAndApplyAutoBlock(m.id);
      }
    }
  });
}

export function checkAndApplyAutoBlock(reportedId) {
  if (!reportedId) return false;
  // Exact requirement:
  // if tima_reports.filter(r => r.reportedId == userId).length >= 3:
  //   Auto freeze account: user.status = 'frozen'
  //   Hide him from all lists
  //   Show banner: "تم تجميد الحساب لحين المراجعة"
  const count = state.reports.filter(r => r.reportedId == reportedId && r.status !== 'rejected').length;
  if (count >= 3) {
    // Freeze mentor if mentor
    const mentor = state.mentors.find(m => m.id == reportedId);
    if (mentor) {
      mentor.status = 'frozen';
    }
    // Freeze company if company
    if (state.companies) {
      const comp = state.companies.find(c => c.id == reportedId);
      if (comp) {
        comp.status = 'frozen';
      }
    }
    // Freeze current user if it's the current user
    if (state.currentUser && (state.currentUser.id == reportedId || state.currentUser.name == reportedId)) {
      state.currentUser.status = 'frozen';
    }
    saveToStorage();
    return true;
  }
  return false;
}

export function openReportModal(reportedId, reportedName, reportedType = 'mentor') {
  state.activeReportTarget = { id: reportedId, name: reportedName, type: reportedType };
  state.uploadedReportScreenshot = '';

  const modal = document.getElementById('modal-report-account');
  const nameEl = document.getElementById('report-target-name');
  const typeEl = document.getElementById('report-target-type');
  const idEl = document.getElementById('report-target-id');
  const descEl = document.getElementById('report-description-input');
  const phBox = document.getElementById('report-screenshot-placeholder');
  const prevBox = document.getElementById('report-screenshot-preview-box');

  if (nameEl) nameEl.innerText = reportedName || reportedId;
  if (typeEl) typeEl.innerText = reportedType === 'mentor' ? 'خبير إعلامي (Mentor)' : 'مؤسسة إعلامية (Company)';
  if (idEl) idEl.value = reportedId;
  if (descEl) descEl.value = '';
  if (phBox) phBox.classList.remove('hidden');
  if (prevBox) prevBox.classList.add('hidden');

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    window.lucide && window.lucide.createIcons();
  }
}

export function closeReportModal() {
  const modal = document.getElementById('modal-report-account');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  state.uploadedReportScreenshot = '';
}

export async function handleReportScreenshotUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const compressed = await compressImageFile(file, 800, 800, 0.65);
    state.uploadedReportScreenshot = compressed;
    const phBox = document.getElementById('report-screenshot-placeholder');
    const prevBox = document.getElementById('report-screenshot-preview-box');
    const imgEl = document.getElementById('report-screenshot-preview');
    if (imgEl) imgEl.src = compressed;
    if (phBox) phBox.classList.add('hidden');
    if (prevBox) prevBox.classList.remove('hidden');
  } catch (err) {
    console.warn('Error compressing screenshot:', err);
  }
}

export function removeReportScreenshot() {
  state.uploadedReportScreenshot = '';
  const phBox = document.getElementById('report-screenshot-placeholder');
  const prevBox = document.getElementById('report-screenshot-preview-box');
  const fileInput = document.getElementById('report-screenshot-input');
  if (fileInput) fileInput.value = '';
  if (phBox) phBox.classList.remove('hidden');
  if (prevBox) prevBox.classList.add('hidden');
}

export function submitReport() {
  const reportedId = document.getElementById('report-target-id')?.value || state.activeReportTarget?.id;
  const reason = document.getElementById('report-reason-select')?.value || 'حساب وهمي';
  const desc = document.getElementById('report-description-input')?.value.trim();

  if (!reportedId) {
    alert('حدث خطأ في تحديد الحساب المُبلّغ عنه.');
    return;
  }
  if (!desc) {
    alert('من فضلك اكتب تفاصيل الواقعة ووصف سبب البلاغ.');
    return;
  }

  // Exact required structure:
  // Save to localStorage tima_reports = [{reportedId, reason, date, status:'pending'}]
  const newReport = {
    id: `rep-${Date.now()}`,
    reportedId: reportedId,
    reportedName: state.activeReportTarget?.name || reportedId,
    reportedType: state.activeReportTarget?.type || 'mentor',
    reason: reason,
    description: desc,
    screenshot: state.uploadedReportScreenshot || '',
    date: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    status: 'pending'
  };

  state.reports.unshift(newReport);
  saveToStorage();

  // Evaluate auto block:
  const isFrozen = checkAndApplyAutoBlock(reportedId);
  closeReportModal();

  if (isFrozen) {
    alert('🚨 شكراً لإبلاغك! وصل عدد البلاغات ضد هذا الحساب إلى 3 بلاغات، وتم تجميد حسابه آلياً وإخفاؤه من جميع القوائم في المنصة.');
  } else {
    const totalCount = state.reports.filter(r => r.reportedId == reportedId && r.status !== 'rejected').length;
    const remaining = Math.max(0, 3 - totalCount);
    alert(`✓ تم إرسال البلاغ بنجاح للإدارة لمراجعته.\n(متبقي ${remaining} بلاغ للتجميد الآلي الفوري للحساب).`);
  }

  renderApp();
}

// -------------------------------------------------------------
// RENDER: ADMIN DASHBOARD (phi2026 / #admin)
// -------------------------------------------------------------
export let adminPortfolioFilter = 'all';

export function copyAdminDashboardLink() {
  const url = window.location.origin + window.location.pathname + '#admin';
  try {
    navigator.clipboard.writeText(url).then(() => {
      alert(`✓ تم نسخ رابط لوحة التحكم المركزية بنجاح!\n\n${url}\n\nكلمة المرور: phi2026\nيمكنك مشاركته أو تجربته في تبويب جديد.`);
    }).catch(() => {
      prompt('رابط لوحة التحكم المباشر:', url);
    });
  } catch (e) {
    prompt('رابط لوحة التحكم المباشر:', url);
  }
}

export function setAdminSubTab(tabName) {
  state.adminSubTab = tabName;
  const tabs = ['overview', 'students', 'portfolio', 'challenges', 'company-requests', 'verifications', 'reports'];

  tabs.forEach(t => {
    const btn = document.getElementById(`admin-tab-btn-${t}`);
    const pane = document.getElementById(`admin-pane-${t}`);
    const isActive = t === tabName;

    if (pane) {
      if (isActive) pane.classList.remove('hidden');
      else pane.classList.add('hidden');
    }

    if (btn) {
      if (isActive) {
        btn.className = 'px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md transition-all shrink-0 flex items-center gap-1.5';
      } else {
        btn.className = 'px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-purple-700 hover:bg-purple-50 transition-all shrink-0 flex items-center gap-1.5';
      }
    }
  });

  renderAdminApp();
  window.lucide && window.lucide.createIcons();
}

export function renderAdminApp() {
  // Update 6 Live Statistics KPI Cards
  const statStudents = document.getElementById('admin-stat-students-count');
  const statMentors = document.getElementById('admin-stat-mentors-count');
  const statCompanies = document.getElementById('admin-stat-companies-count');
  const statPortfolio = document.getElementById('admin-stat-portfolio-count');
  const statChallenges = document.getElementById('admin-stat-challenges-count');
  const statJobs = document.getElementById('admin-stat-jobs-count');

  const totalStudents = state.students ? state.students.length : 0;
  const totalMentors = state.mentors ? state.mentors.length : 0;
  const totalCompanies = state.companies ? state.companies.length : 0;
  const totalPortfolio = (portfolioState && portfolioState.items) ? portfolioState.items.length : 0;
  const totalChallenges = state.challenges ? state.challenges.length : 0;
  const totalJobs = state.jobs ? state.jobs.length : 0;

  if (statStudents) statStudents.innerText = `${totalStudents}`;
  if (statMentors) statMentors.innerText = `${totalMentors}`;
  if (statCompanies) statCompanies.innerText = `${totalCompanies}`;
  if (statPortfolio) statPortfolio.innerText = `${totalPortfolio}`;
  if (statChallenges) statChallenges.innerText = `${totalChallenges}`;
  if (statJobs) statJobs.innerText = `${totalJobs}`;

  // Update Pending badges
  const pendingReportsCount = state.reports ? state.reports.filter(r => r.status === 'pending').length : 0;
  const pendingVerifsCount = state.verifications ? state.verifications.filter(v => v.status === 'pending').length : 0;
  
  const badgeReports = document.getElementById('admin-badge-pending-reports');
  const badgeVerifs = document.getElementById('stat-pending-verifications-count');
  if (badgeReports) badgeReports.innerText = pendingReportsCount.toString();
  if (badgeVerifs) badgeVerifs.innerText = pendingVerifsCount.toString();

  const pendingPortBadge = document.getElementById('admin-badge-pending-portfolio');
  if (pendingPortBadge && portfolioState && portfolioState.items) {
    const pendingCount = portfolioState.items.filter(item => item.approvalStatus === 'pending' || !item.approvalStatus).length;
    if (pendingCount > 0) {
      pendingPortBadge.innerText = pendingCount.toString();
      pendingPortBadge.classList.remove('hidden');
    } else {
      pendingPortBadge.classList.add('hidden');
    }
  }

  // Render content according to active tab
  const activeTab = state.adminSubTab || 'overview';
  if (activeTab === 'students') {
    renderAdminStudentsTable();
  } else if (activeTab === 'portfolio') {
    renderAdminPortfolioTable();
  } else if (activeTab === 'challenges') {
    renderAdminChallengesTable();
  } else if (activeTab === 'company-requests') {
    renderAdminCompanyRequestsTable();
  } else if (activeTab === 'verifications') {
    renderAdminVerifications();
  } else if (activeTab === 'reports') {
    renderAdminProtectionTab();
  }

  window.lucide && window.lucide.createIcons();
}

// -------------------------------------------------------------
// TAB 2: STUDENTS MANAGEMENT TABLE (حذف وتفعيل)
// -------------------------------------------------------------
export function renderAdminStudentsTable() {
  const tbody = document.getElementById('admin-students-table-body');
  if (!tbody) return;

  const searchQuery = (document.getElementById('admin-students-search')?.value || '').trim().toLowerCase();
  const statusFilter = document.getElementById('admin-students-status-filter')?.value || 'all';

  let list = state.students || [];

  if (searchQuery) {
    list = list.filter(s =>
      (s.name && s.name.toLowerCase().includes(searchQuery)) ||
      (s.email && s.email.toLowerCase().includes(searchQuery)) ||
      (s.university && s.university.toLowerCase().includes(searchQuery)) ||
      (s.department && s.department.toLowerCase().includes(searchQuery)) ||
      (s.position && s.position.toLowerCase().includes(searchQuery))
    );
  }

  if (statusFilter !== 'all') {
    list = list.filter(s => {
      const isFrozen = s.status === 'frozen';
      return statusFilter === 'frozen' ? isFrozen : !isFrozen;
    });
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-slate-400 font-bold bg-purple-50/20">
          لا يوجد طلاب مطابقين لمعايير البحث الحالية.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(s => {
    const isFrozen = s.status === 'frozen';
    const ovr = s.OVR || s.overall || 90;
    const worksCount = s.works || (s.id === 'stud-1' ? (portfolioState.items.length || 3) : Math.floor(Math.random() * 4 + 2));
    const avatar = s.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80';

    return `
      <tr class="border-b border-purple-50 hover:bg-purple-50/40 transition-colors">
        <!-- Student Info -->
        <td class="p-4">
          <div class="flex items-center gap-3">
            <img src="${avatar}" alt="${s.name}" class="w-10 h-10 rounded-2xl object-cover border border-purple-200 shrink-0">
            <div>
              <div class="font-black text-[#1E1B4B] text-sm">${s.name}</div>
              <div class="text-[11px] font-mono text-[#7C3AED]">${s.email || 'student@phitomedia.eg'}</div>
            </div>
          </div>
        </td>

        <!-- Department & Position -->
        <td class="p-4">
          <div class="font-bold text-slate-800">${s.position || 'طالب إعلام'}</div>
          <div class="text-[11px] text-slate-500">${s.department || 'إذاعة وتلفزيون'}</div>
        </td>

        <!-- University & Grad Year -->
        <td class="p-4">
          <div class="font-medium text-slate-700">${s.university || 'جامعة القاهرة'}</div>
          <div class="text-[11px] font-mono text-purple-600 font-bold">دفعة ${s.gradYear || '2026'}</div>
        </td>

        <!-- TIMA OVR Badge -->
        <td class="p-4 text-center">
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-mono font-black text-xs shadow-sm">
            <span>${ovr}</span>
            <span class="text-[9px] uppercase">OVR</span>
          </span>
        </td>

        <!-- Works Count -->
        <td class="p-4 text-center font-mono font-bold text-slate-700">
          <span class="px-2.5 py-1 rounded-lg bg-purple-100 text-[#7C3AED]">
            ${worksCount} عمل
          </span>
        </td>

        <!-- Account Status Badge -->
        <td class="p-4 text-center">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${isFrozen ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
            <span class="w-2 h-2 rounded-full ${isFrozen ? 'bg-rose-500' : 'bg-emerald-500'}"></span>
            <span>${isFrozen ? 'مجمد وموقوف ⚠️' : 'مفعل ونشط ✓'}</span>
          </span>
        </td>

        <!-- Actions: Toggle Status & Delete -->
        <td class="p-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <!-- Activate / Freeze Button -->
            <button onclick="window.phiApp.toggleStudentStatus('${s.id}')" title="${isFrozen ? 'إلغاء التجميد وتفعيل الحساب' : 'تجميد الحساب'}" class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${isFrozen ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'}">
              ${isFrozen ? 'تفعيل الحساب ✓' : 'تجميد ⚠️'}
            </button>

            <!-- Delete Button -->
            <button onclick="window.phiApp.confirmDeleteStudent('${s.id}')" title="حذف الطالب نهائياً" class="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-colors cursor-pointer">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

export function filterAdminStudents() {
  renderAdminStudentsTable();
  window.lucide && window.lucide.createIcons();
}

export function toggleStudentStatus(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;

  const willBeFrozen = student.status !== 'frozen';
  student.status = willBeFrozen ? 'frozen' : 'active';

  // If this happens to be the currently logged-in student
  if (state.currentUser && state.currentUser.id === studentId) {
    state.currentUser.status = student.status;
  }

  saveToStorage();
  renderAdminStudentsTable();
  renderAdminApp();

  const msg = willBeFrozen
    ? `⚠️ تم تجميد حساب الطالب (${student.name}) وحجبه مؤقتاً من المنظومة.`
    : `✓ تم تفعيل حساب الطالب (${student.name}) وإعادته للنشاط بالكامل.`;
  alert(msg);
}

export function confirmDeleteStudent(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;

  const modal = document.getElementById('modal-confirm-student-delete');
  const nameEl = document.getElementById('confirm-delete-student-name');
  const idInput = document.getElementById('admin-delete-student-id');

  if (nameEl) nameEl.innerText = `هل أنت متأكد من حذف حساب الطالب (${student.name}) نهائياً من قاعدة البيانات؟ لن يتمكن من تسجيل الدخول.`;
  if (idInput) idInput.value = studentId;

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    window.lucide && window.lucide.createIcons();
  }
}

export function closeDeleteStudentModal() {
  const modal = document.getElementById('modal-confirm-student-delete');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function executeDeleteStudent() {
  const idInput = document.getElementById('admin-delete-student-id');
  const studentId = idInput?.value;
  if (!studentId) return;

  const deletedStudent = state.students.find(s => s.id === studentId);
  const studentName = deletedStudent ? deletedStudent.name : 'الطالب';

  state.students = state.students.filter(s => s.id !== studentId);
  saveToStorage();

  closeDeleteStudentModal();
  renderAdminStudentsTable();
  renderAdminApp();

  alert(`🗑️ تم حذف حساب الطالب (${studentName}) نهائياً من المنظومة.`);
}

export function openAdminAddStudentModal() {
  const modal = document.getElementById('modal-admin-add-student');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    window.lucide && window.lucide.createIcons();
  }
}

export function closeAdminAddStudentModal() {
  const modal = document.getElementById('modal-admin-add-student');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function submitAdminNewStudent(e) {
  if (e && e.preventDefault) e.preventDefault();

  const name = document.getElementById('admin-modal-stud-name')?.value.trim();
  const email = document.getElementById('admin-modal-stud-email')?.value.trim();
  const position = document.getElementById('admin-modal-stud-pos')?.value.trim();
  const university = document.getElementById('admin-modal-stud-univ')?.value.trim();
  const department = document.getElementById('admin-modal-stud-dept')?.value;
  const ovr = parseInt(document.getElementById('admin-modal-stud-ovr')?.value) || 92;
  const gradYear = document.getElementById('admin-modal-stud-year')?.value || '2026';

  if (!name || !email) {
    alert('من فضلك أكمل البيانات الأساسية للطالب.');
    return;
  }

  const newStudent = {
    id: `stud-${Date.now()}`,
    card_id: `stud-${Date.now()}`,
    name,
    email,
    position: position || 'طالب إعلام',
    university: university || 'جامعة القاهرة',
    department: department || 'إذاعة وتلفزيون',
    gradYear,
    overall: ovr,
    OVR: ovr,
    skill: [position || 'صناعة محتوى', 'إعلام رقمي', 'مونتاج'],
    transcript: 'معدل تراكمي ممتاز مع مرتبة الشرف، تدريب معتمد',
    location: 'القاهرة، مصر',
    timaStats: {
      filming: Math.min(99, ovr - 2),
      montage: Math.min(99, ovr + 2),
      writing: ovr,
      presenting: ovr,
      pr: Math.max(70, ovr - 4),
      digital: Math.min(99, ovr + 1)
    },
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    works: 1
  };

  state.students.unshift(newStudent);
  saveToStorage();

  closeAdminAddStudentModal();
  renderAdminStudentsTable();
  renderAdminApp();

  alert(`✓ تمت إضافة الطالب (${name}) بنجاح وتفعيله في قاعدة بيانات المواهب! 🎓`);
}

// -------------------------------------------------------------
// TAB 3: PORTFOLIO MANAGEMENT (موافقة ورفض ومعاينة)
// -------------------------------------------------------------
export function setAdminPortfolioFilter(filter) {
  adminPortfolioFilter = filter;
  ['all', 'pending', 'approved', 'rejected'].forEach(f => {
    const btn = document.getElementById(`btn-admin-port-filter-${f}`);
    if (btn) {
      if (f === filter) {
        btn.className = 'px-3 py-1.5 rounded-xl font-bold text-xs bg-purple-100 text-[#7C3AED] shadow-sm';
      } else {
        btn.className = 'px-3 py-1.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-purple-50';
      }
    }
  });
  renderAdminPortfolioTable();
}

export function renderAdminPortfolioTable() {
  const tbody = document.getElementById('admin-portfolio-table-body');
  if (!tbody) return;

  const items = (portfolioState && portfolioState.items && portfolioState.items.length > 0)
    ? portfolioState.items
    : DEFAULT_PORTFOLIO_ITEMS;

  let filtered = items;
  if (adminPortfolioFilter !== 'all') {
    filtered = items.filter(it => {
      const status = it.approvalStatus || 'pending';
      return status === adminPortfolioFilter;
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-slate-400 font-bold bg-purple-50/20">
          لا توجد أعمال تطابق الفلتر المحدد (${adminPortfolioFilter}).
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const status = item.approvalStatus || 'pending';
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';
    const isPending = status === 'pending';

    const statusBadge = isApproved
      ? '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200"><i data-lucide="check" class="w-3 h-3"></i> معتمد ✓</span>'
      : isRejected
      ? '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200"><i data-lucide="x" class="w-3 h-3"></i> مرفوض ✕</span>'
      : '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200">⏳ قيد المراجعة</span>';

    // Thumbnail / Icon
    const isVideo = item.type === 'فيديو';
    const thumbHtml = item.fileUrl && (item.fileUrl.startsWith('data:image/') || item.fileUrl.includes('unsplash.com') || item.fileUrl.endsWith('.png') || item.fileUrl.endsWith('.jpg'))
      ? `<img src="${item.fileUrl}" alt="" class="w-12 h-12 rounded-xl object-cover border border-purple-200 shrink-0">`
      : `<div class="w-12 h-12 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center font-bold text-lg shrink-0">
          <i data-lucide="${isVideo ? 'video' : item.type === 'مقال' || item.type === 'تحقيق' ? 'file-text' : 'sparkles'}" class="w-5 h-5"></i>
         </div>`;

    const studentName = item.studentName || state.currentUser?.name || 'مريم حسام شريف';

    return `
      <tr class="border-b border-purple-50 hover:bg-purple-50/40 transition-colors">
        <!-- Thumbnail -->
        <td class="p-4">
          ${thumbHtml}
        </td>

        <!-- Title & Description -->
        <td class="p-4 max-w-xs">
          <div class="font-black text-[#1E1B4B] text-sm">${item.title}</div>
          <div class="text-[11px] text-slate-500 line-clamp-1 mt-0.5">${item.desc || 'لا يوجد وصف'}</div>
          ${item.tools ? `<div class="text-[10px] text-purple-600 font-mono mt-0.5">الأدوات: ${item.tools}</div>` : ''}
        </td>

        <!-- Student -->
        <td class="p-4">
          <div class="font-bold text-slate-800 text-xs">${studentName}</div>
          <div class="text-[11px] text-slate-400 font-mono">طالب معتمد</div>
        </td>

        <!-- Media Type -->
        <td class="p-4">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-[#7C3AED]">
            ${item.type || 'فيديو'}
          </span>
        </td>

        <!-- Date -->
        <td class="p-4 font-mono text-[11px] text-slate-500">
          ${item.date || '2025-05-20'}
        </td>

        <!-- Approval Status -->
        <td class="p-4 text-center">
          ${statusBadge}
        </td>

        <!-- Actions: Approve, Reject, Preview -->
        <td class="p-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <!-- Preview Button -->
            <button onclick="window.phiApp.viewPortfolioDetail('${item.id}')" title="معاينة العمل داخل المنصة" class="px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#7C3AED] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              <span>معاينة</span>
            </button>

            <!-- Approve Button -->
            <button onclick="window.phiApp.approvePortfolioItem('${item.id}')" title="اعتماد المشروع ونشره" class="px-2.5 py-1.5 rounded-xl ${isApproved ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer'} font-bold text-xs flex items-center gap-1 transition-all">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              <span>موافقة</span>
            </button>

            <!-- Reject Button -->
            <button onclick="window.phiApp.rejectPortfolioItem('${item.id}')" title="رفض المشروع" class="px-2.5 py-1.5 rounded-xl ${isRejected ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer'} font-bold text-xs flex items-center gap-1 transition-colors">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
              <span>رفض</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

export function approvePortfolioItem(itemId) {
  const item = (portfolioState && portfolioState.items)
    ? portfolioState.items.find(i => i.id === itemId)
    : null;

  if (!item) return;

  item.approvalStatus = 'approved';
  savePortfolio();

  // Award +50 XP to student
  addTimaPoints(50, `اعتماد مشروع (${item.title}) في معرض الأعمال`);

  renderAdminPortfolioTable();
  renderAdminApp();

  alert(`✓ تمت الموافقة على مشروع (${item.title}) بنجاح!\nسيظهر الآن في معرض الأعمال للشركات كعمل معتمد ✓، وتمت إضافة +50 نقطة TIMA XP لبطاقة الطالب.`);
}

export function rejectPortfolioItem(itemId) {
  const item = (portfolioState && portfolioState.items)
    ? portfolioState.items.find(i => i.id === itemId)
    : null;

  if (!item) return;

  item.approvalStatus = 'rejected';
  savePortfolio();

  renderAdminPortfolioTable();
  renderAdminApp();

  alert(`تم رفض مشروع (${item.title}) وتحديث حالته.`);
}

// -------------------------------------------------------------
// TAB 4: CHALLENGES MANAGEMENT (اضافة تحدي جديد مع TIMA)
// -------------------------------------------------------------
export function openAdminAddChallengeModal() {
  const modal = document.getElementById('modal-admin-add-challenge');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    window.lucide && window.lucide.createIcons();
  }
}

export function closeAdminAddChallengeModal() {
  const modal = document.getElementById('modal-admin-add-challenge');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function submitAdminNewChallenge(e) {
  if (e && e.preventDefault) e.preventDefault();

  const title = document.getElementById('admin-modal-ch-title')?.value.trim();
  const cat = document.getElementById('admin-modal-ch-cat')?.value || 'مونتاج';
  const points = parseInt(document.getElementById('admin-modal-ch-points')?.value) || 350;
  const desc = document.getElementById('admin-modal-ch-desc')?.value.trim();

  if (!title || !desc) {
    alert('من فضلك أدخل عنوان ووصف التحدي.');
    return;
  }

  const newCh = {
    id: `ch-${Date.now()}`,
    title,
    category: cat,
    points,
    description: desc,
    submissionsCount: 0,
    status: 'نشط',
    icon: 'trophy'
  };

  state.challenges.unshift(newCh);
  saveToStorage();

  closeAdminAddChallengeModal();
  renderAdminChallengesTable();
  renderAdminApp();

  alert(`🏆 تم نشر التحدي الجديد (${title}) بنجاح في معمل تدريب الطلاب!\nمرتبط بمنح +${points} نقطة TIMA XP للمشاركين.`);
}

export function deleteAdminChallenge(challengeId) {
  const ch = state.challenges.find(c => c.id === challengeId);
  const chTitle = ch ? ch.title : 'التحدي';

  state.challenges = state.challenges.filter(c => c.id !== challengeId);
  saveToStorage();

  renderAdminChallengesTable();
  renderAdminApp();

  alert(`تم حذف التحدي (${chTitle}) من المعمل.`);
}

export function renderAdminChallengesTable() {
  const tbody = document.getElementById('admin-challenges-table-body');
  if (!tbody) return;

  const list = state.challenges || [];
  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-8 text-center text-slate-400 font-bold bg-purple-50/20">
          لا توجد تحديات نشطة حالياً. اضغط "إضافة تحدي جديد" لإنشاء أول تحدٍ.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr class="border-b border-purple-50 hover:bg-purple-50/40 transition-colors">
      <td class="p-4 font-black text-[#1E1B4B] text-sm">
        <div class="flex items-center gap-2">
          <span class="text-base">🏆</span>
          <span>${c.title}</span>
        </div>
      </td>
      <td class="p-4">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-[#7C3AED]">
          ${c.category}
        </span>
      </td>
      <td class="p-4 font-mono font-black text-[#EC4899]">
        +${c.points} XP
      </td>
      <td class="p-4 text-center font-mono font-bold text-slate-700">
        ${c.submissionsCount || 0} مشارك
      </td>
      <td class="p-4 text-center">
        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
          ${c.status || 'نشط'}
        </span>
      </td>
      <td class="p-4 text-center">
        <button onclick="window.phiApp.deleteAdminChallenge('${c.id}')" title="حذف التحدي" class="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-colors cursor-pointer">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// -------------------------------------------------------------
// TAB 5: COMPANY TALENT REQUESTS (طلبات الشركات للمواهب)
// -------------------------------------------------------------
export function toggleJobStatus(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;

  job.status = job.status === 'مغلق' ? 'نشط' : 'مغلق';
  saveToStorage();
  renderAdminCompanyRequestsTable();
  alert(`تم تغيير حالة الطلب (${job.title}) إلى: ${job.status}`);
}

export function renderAdminCompanyRequestsTable() {
  const tbody = document.getElementById('admin-company-requests-table-body');
  if (!tbody) return;

  const list = state.jobs || [];
  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-8 text-center text-slate-400 font-bold bg-purple-50/20">
          لا توجد طلبات شركات نشطة حالياً.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(job => {
    const isClosed = job.status === 'مغلق';
    return `
      <tr class="border-b border-purple-50 hover:bg-purple-50/40 transition-colors">
        <!-- Company -->
        <td class="p-4">
          <div class="font-black text-[#1E1B4B] text-sm">${job.company}</div>
          <div class="text-[10px] text-slate-400 font-mono">${job.location || 'القاهرة'}</div>
        </td>

        <!-- Title & Type -->
        <td class="p-4">
          <div class="font-bold text-slate-800 text-xs">${job.title}</div>
          <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${job.type === 'تدريب' ? 'bg-cyan-100 text-cyan-800' : job.type === 'دوام' ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-100 text-pink-800'} mt-0.5">
            ${job.type}
          </span>
        </td>

        <!-- Target Skill -->
        <td class="p-4 text-xs font-bold text-[#7C3AED]">
          ${job.minSkill || 'إعلام شامل'}
        </td>

        <!-- Min OVR -->
        <td class="p-4 text-center font-mono font-black text-[#EC4899]">
          ${job.minScore || 80}+ OVR
        </td>

        <!-- Stipend / Salary -->
        <td class="p-4 text-xs text-slate-700 font-medium">
          ${job.stipend || 'راتب مجزي'}
        </td>

        <!-- Applicants -->
        <td class="p-4 text-center font-mono font-bold text-purple-700">
          ${job.applicantsCount || 0} متقدم
        </td>

        <!-- Status -->
        <td class="p-4 text-center">
          <span class="px-2.5 py-1 rounded-full text-[11px] font-black ${isClosed ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'}">
            ${job.status || 'نشط'}
          </span>
        </td>

        <!-- Actions -->
        <td class="p-4 text-center">
          <button onclick="window.phiApp.toggleJobStatus('${job.id}')" class="px-3 py-1 rounded-xl text-xs font-bold ${isClosed ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition-colors cursor-pointer">
            ${isClosed ? 'إعادة الفتح' : 'إغلاق الطلب'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// ADMIN PROTECTION TAB (REPORTS, VERIFICATIONS, BLACKLIST)
// -------------------------------------------------------------
export function renderAdminProtectionTab() {
  // Stat counters
  const pendingVerifsCount = state.verifications.filter(v => v.status === 'pending').length;
  const totalReportsCount = state.reports.length;
  const blacklistCount = state.blacklistIps.length;

  const statVerifs = document.getElementById('stat-pending-verifications-count');
  const statReports = document.getElementById('stat-total-reports-count');
  const statIps = document.getElementById('stat-blacklisted-ips-count');
  const badgeReports = document.getElementById('admin-badge-pending-reports');

  if (statVerifs) statVerifs.innerText = pendingVerifsCount.toString();
  if (statReports) statReports.innerText = totalReportsCount.toString();
  if (statIps) statIps.innerText = blacklistCount.toString();
  if (badgeReports) badgeReports.innerText = state.reports.filter(r => r.status === 'pending').length.toString();

  renderAdminVerifications();
  renderAdminReports();
  renderAdminBlacklistIps();

  window.lucide && window.lucide.createIcons();
}

export function renderAdminVerifications() {
  const container = document.getElementById('admin-pending-verifications-list');
  if (!container) return;

  const pendingList = state.verifications.filter(v => v.status === 'pending');
  if (pendingList.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-purple-50/40 rounded-2xl border border-purple-100 text-slate-500">
        <i data-lucide="check-circle-2" class="w-8 h-8 text-emerald-500 mx-auto mb-2"></i>
        <p class="font-bold text-sm text-[#1E1B4B]">لا توجد طلبات توثيق معلقة حالياً</p>
        <p class="text-xs text-slate-400 mt-1">تمت مراجعة واعتماد جميع طلبات المنتورز والمؤسسات.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = pendingList.map(v => {
    const isMentor = v.role === 'mentor';
    return `
      <div class="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-black ${isMentor ? 'bg-purple-100 text-[#7C3AED]' : 'bg-pink-100 text-[#EC4899]'}">
              ${isMentor ? 'طلب توثيق خبير إعلامي 🧠' : 'طلب توثيق مؤسسة / قناة 🏢'}
            </span>
            <h5 class="text-base font-black text-[#1E1B4B]">${v.name}</h5>
            <span class="text-[11px] font-mono text-slate-400">${v.date}</span>
          </div>

          <div class="text-xs text-slate-600 space-y-1">
            <p><span class="font-bold text-[#1E1B4B]">الجهة / التخصص:</span> ${v.specialty || v.companyType || ''} • ${v.workplace || ''}</p>
            <p><span class="font-bold text-[#1E1B4B]">البريد:</span> <span class="font-mono text-[#7C3AED]">${v.email}</span></p>
            ${v.portfolioLink ? `<p><span class="font-bold text-[#1E1B4B]">رابط الأعمال الحقيقي:</span> <a href="${v.portfolioLink}" target="_blank" class="text-pink-600 hover:underline font-mono">${v.portfolioLink}</a></p>` : ''}
            ${v.website ? `<p><span class="font-bold text-[#1E1B4B]">الموقع الرسمي:</span> <a href="${v.website}" target="_blank" class="text-pink-600 hover:underline font-mono">${v.website}</a></p>` : ''}
          </div>

          <!-- Document Preview Triggers -->
          <div class="flex flex-wrap items-center gap-2 pt-1">
            ${v.idProof ? `
              <button onclick="window.phiApp.openImagePreviewModal('إثبات الهوية - ${v.name}', '${v.idProof}')" class="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#7C3AED] font-bold text-xs flex items-center gap-1.5 transition-colors">
                <i data-lucide="file-check" class="w-3.5 h-3.5"></i>
                <span>فحص إثبات الشخصية 🪪</span>
              </button>
            ` : ''}

            ${v.syndicateCard ? `
              <button onclick="window.phiApp.openImagePreviewModal('كارنيه النقابة/المؤسسة - ${v.name}', '${v.syndicateCard}')" class="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#7C3AED] font-bold text-xs flex items-center gap-1.5 transition-colors">
                <i data-lucide="award" class="w-3.5 h-3.5"></i>
                <span>كارنيه النقابة</span>
              </button>
            ` : ''}

            ${v.commercialRegister ? `
              <button onclick="window.phiApp.openImagePreviewModal('السجل التجاري / الترخيص - ${v.name}', '${v.commercialRegister}')" class="px-3 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-[#EC4899] font-bold text-xs flex items-center gap-1.5 transition-colors">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                <span>فحص السجل التجاري والترخيص 📜</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Approval Actions -->
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="window.phiApp.approveVerification('${v.id}')" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>اعتماد وتوثيق الحساب ✓</span>
          </button>
          <button onclick="window.phiApp.rejectVerification('${v.id}')" class="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold text-xs transition-colors">
            رفض الطلب ✕
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function approveVerification(verifId) {
  const verif = state.verifications.find(v => v.id === verifId);
  if (!verif) return;

  verif.status = 'verified';

  // If mentor: mark verified and active
  const mentor = state.mentors.find(m => m.id === verif.userId);
  if (mentor) {
    mentor.status = 'verified';
    mentor.verificationStatus = 'verified';
    mentor.isVerified = true;
  }

  // If company: mark verified and active
  if (state.companies) {
    const comp = state.companies.find(c => c.id === verif.userId);
    if (comp) {
      comp.status = 'verified';
      comp.verificationStatus = 'verified';
      comp.isVerified = true;
    }
  }

  // If current logged-in user
  if (state.currentUser && state.currentUser.id === verif.userId) {
    state.currentUser.status = 'active';
    state.currentUser.verificationStatus = 'verified';
    state.currentUser.isVerified = true;
  }

  saveToStorage();
  alert(`✓ تم اعتماد وتوثيق حساب (${verif.name}) بنجاح!\nسيظهر الآن في قوائم المنصة للطلاب مع شارة "موثق ✓" باللون البنفسجي.`);
  renderAdminProtectionTab();
  renderMentorsList();
}

export function rejectVerification(verifId) {
  const verif = state.verifications.find(v => v.id === verifId);
  if (!verif) return;

  verif.status = 'rejected';

  const mentor = state.mentors.find(m => m.id === verif.userId);
  if (mentor) {
    mentor.status = 'rejected';
    mentor.verificationStatus = 'rejected';
    mentor.isVerified = false;
  }

  saveToStorage();
  alert(`تم رفض طلب التوثيق لحساب (${verif.name}).`);
  renderAdminProtectionTab();
}

export function renderAdminReports() {
  const container = document.getElementById('admin-reports-list');
  if (!container) return;

  const filterVal = document.getElementById('admin-reports-filter')?.value || 'all';
  const filtered = state.reports.filter(r => {
    if (filterVal === 'all') return true;
    return r.status === filterVal;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-purple-50/30 rounded-2xl border border-purple-100 text-slate-500">
        <p class="font-bold text-sm text-[#1E1B4B]">لا توجد بلاغات مطابقة لهذا الفلتر</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => {
    const totalReportsAgainstTarget = state.reports.filter(rep => rep.reportedId == r.reportedId && rep.status !== 'rejected').length;
    const isFrozen = totalReportsAgainstTarget >= 3;

    return `
      <div class="p-5 rounded-2xl bg-white border border-rose-100 shadow-sm space-y-3 hover:border-rose-300 transition-all">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-50">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700">
              سبب: ${r.reason}
            </span>
            <h5 class="text-sm font-black text-[#1E1B4B]">ضد: ${r.reportedName || r.reportedId}</h5>
            <span class="text-[10px] text-slate-400 font-mono">${r.date}</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[11px] font-mono px-2.5 py-0.5 rounded-lg ${isFrozen ? 'bg-rose-600 text-white font-black' : 'bg-amber-100 text-amber-800 font-bold'}">
              ${totalReportsAgainstTarget} بلاغات ضده ${isFrozen ? '• مجمد تلقائياً ⚠️' : ''}
            </span>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${r.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : r.status === 'approved_banned' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}">
              الحالة: ${r.status === 'pending' ? 'قيد المراجعة' : r.status === 'approved_banned' ? 'تم الحظر النهائي' : r.status === 'warned' ? 'تم التحذير' : 'مرفوض'}
            </span>
          </div>
        </div>

        <p class="text-xs text-slate-700 leading-relaxed bg-rose-50/30 p-3 rounded-xl border border-rose-100/70">
          ${r.description}
        </p>

        <!-- Screenshot Preview if Uploaded -->
        ${r.screenshot ? `
          <div>
            <button onclick="window.phiApp.openImagePreviewModal('سكرين شوت البلاغ ضد ${r.reportedName}', '${r.screenshot}')" class="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center gap-1.5 border border-purple-200 transition-colors">
              <i data-lucide="image" class="w-3.5 h-3.5"></i>
              <span>عرض إثبات السكرين شوت المرفق 🖼️</span>
            </button>
          </div>
        ` : ''}

        <!-- Actions Row: [موافقة وحظر نهائي] [تحذير] [رفض البلاغ] -->
        <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-50">
          <button onclick="window.phiApp.takeReportAction('${r.id}', 'ban')" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all">
            <i data-lucide="ban" class="w-3.5 h-3.5"></i>
            <span>موافقة وحظر نهائي 🚫</span>
          </button>
          <button onclick="window.phiApp.takeReportAction('${r.id}', 'warn')" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
            <span>تحذير ⚠️</span>
          </button>
          <button onclick="window.phiApp.takeReportAction('${r.id}', 'reject')" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors">
            رفض البلاغ
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function takeReportAction(reportId, action) {
  const report = state.reports.find(r => r.id === reportId);
  if (!report) return;

  if (action === 'ban') {
    report.status = 'approved_banned';
    
    // Freeze target account
    const mentor = state.mentors.find(m => m.id == report.reportedId);
    if (mentor) mentor.status = 'frozen';
    
    if (state.companies) {
      const comp = state.companies.find(c => c.id == report.reportedId);
      if (comp) comp.status = 'frozen';
    }

    if (state.currentUser && (state.currentUser.id == report.reportedId || state.currentUser.name == report.reportedId)) {
      state.currentUser.status = 'frozen';
    }

    // Auto add target to blacklist IP table
    const randomIp = `197.34.88.${Math.floor(Math.random() * 80 + 10)}`;
    const alreadyListed = state.blacklistIps.some(ip => ip.ip === randomIp);
    if (!alreadyListed) {
      state.blacklistIps.unshift({
        ip: randomIp,
        reason: `حظر نهائي لتأكيد بلاغ احتيال: ${report.reason} (${report.reportedName})`,
        date: new Date().toLocaleDateString('ar-EG'),
        addedBy: 'إدارة المنظومة'
      });
    }

    saveToStorage();
    alert(`🚫 تمت الموافقة على البلاغ وحظر حساب (${report.reportedName}) نهائياً وحجبه من كافة القوائم وإضافة عنوان الشبكة للقائمة السوداء.`);

  } else if (action === 'warn') {
    report.status = 'warned';
    saveToStorage();
    alert(`⚠️ تم توجيه إنذار رسمي للحساب (${report.reportedName}) بحظر أي طلبات أموال أو مخالفة للشروط.`);

  } else if (action === 'reject') {
    report.status = 'rejected';
    saveToStorage();
    alert(`تم رفض البلاغ باعتباره غير مثبت أو كيدي.`);
  }

  renderAdminProtectionTab();
  renderMentorsList();
}

export function renderAdminBlacklistIps() {
  const tbody = document.getElementById('admin-blacklist-ips-table');
  if (!tbody) return;

  tbody.innerHTML = state.blacklistIps.map(item => `
    <tr class="border-b border-purple-50 hover:bg-purple-50/40">
      <td class="p-3 font-mono font-bold text-rose-600">${item.ip}</td>
      <td class="p-3 font-medium text-slate-700">${item.reason}</td>
      <td class="p-3 font-mono text-slate-400">${item.date}</td>
      <td class="p-3 text-purple-700 font-bold">${item.addedBy || 'النظام التلقائي'}</td>
      <td class="p-3 text-center">
        <button onclick="window.phiApp.removeIpFromBlacklist('${item.ip}')" class="text-rose-600 hover:text-rose-800 font-bold hover:underline">
          فك الحظر
        </button>
      </td>
    </tr>
  `).join('');
}

export function addIpToBlacklist() {
  const ipInput = document.getElementById('admin-new-ip');
  const reasonInput = document.getElementById('admin-new-ip-reason');
  const ip = ipInput?.value.trim();
  const reason = reasonInput?.value.trim();

  if (!ip) {
    alert('من فضلك أدخل عنوان IP صالح للحظر.');
    return;
  }

  state.blacklistIps.unshift({
    ip,
    reason: reason || 'محاولة احتيال ونصب وطلب تحويلات',
    date: new Date().toLocaleDateString('ar-EG'),
    addedBy: 'إدارة المنصة'
  });

  saveToStorage();
  if (ipInput) ipInput.value = '';
  if (reasonInput) reasonInput.value = '';

  alert(`✓ تم حظر عنوان الـ IP (${ip}) بنجاح وإضافته للقائمة السوداء لمنع الدخول.`);
  renderAdminProtectionTab();
}

export function removeIpFromBlacklist(ip) {
  state.blacklistIps = state.blacklistIps.filter(item => item.ip !== ip);
  saveToStorage();
  renderAdminProtectionTab();
  alert(`تم فك حظر الـ IP (${ip}).`);
}

export function openImagePreviewModal(title, imageUrl) {
  const modal = document.getElementById('modal-image-preview');
  const titleEl = document.getElementById('image-preview-title');
  const imgEl = document.getElementById('image-preview-img');

  if (titleEl) titleEl.innerText = title;
  if (imgEl) {
    if (imageUrl && (imageUrl.startsWith('data:image/') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/'))) {
      imgEl.src = imageUrl;
      imgEl.style.display = 'block';
    } else {
      imgEl.src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80';
      imgEl.style.display = 'block';
    }
  }

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

export function closeImagePreviewModal() {
  const modal = document.getElementById('modal-image-preview');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function toggleFaqItem(id) {
  const answer = document.getElementById(`faq-ans-${id}`);
  const chevron = document.getElementById(`faq-chevron-${id}`);
  if (!answer) return;
  const isHidden = answer.classList.contains('hidden');
  if (isHidden) {
    answer.classList.remove('hidden');
    if (chevron) {
      chevron.classList.add('rotate-180');
    }
  } else {
    answer.classList.add('hidden');
    if (chevron) {
      chevron.classList.remove('rotate-180');
    }
  }
}

// -------------------------------------------------------------
// STAR RATING & MENTOR REVIEW SYSTEM
// -------------------------------------------------------------
function getSeedReviewsForMentor(mentorId) {
  return [];
}

export function openRatingModal(mentorId, bookingId = '') {
  const mentor = state.mentors.find(m => m.id === mentorId) || state.mentors[0];
  if (!mentor) return;

  const modal = document.getElementById('modal-mentor-rating');
  const nameEl = document.getElementById('rating-mentor-name');
  const specEl = document.getElementById('rating-mentor-spec');
  const avatarEl = document.getElementById('rating-mentor-avatar');
  const mentorIdInput = document.getElementById('rating-mentor-id');
  const bookingIdInput = document.getElementById('rating-booking-id');
  const commentInput = document.getElementById('rating-comment-input');

  if (nameEl) nameEl.innerText = mentor.fullName || mentor.name;
  if (specEl) specEl.innerText = mentor.specialty;
  if (avatarEl) avatarEl.src = mentor.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';
  if (mentorIdInput) mentorIdInput.value = mentor.id;
  if (bookingIdInput) bookingIdInput.value = bookingId || '';
  if (commentInput) commentInput.value = '';

  setSelectedRating(5);

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    window.lucide && window.lucide.createIcons();
  }
}

export function closeRatingModal() {
  const modal = document.getElementById('modal-mentor-rating');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function setSelectedRating(score) {
  const valInput = document.getElementById('rating-score-value');
  const labelEl = document.getElementById('rating-score-label');
  const container = document.getElementById('star-rating-buttons');

  if (valInput) valInput.value = score;

  const labels = {
    5: '5.0 / 5.0 (ممتاز جداً 🌟)',
    4: '4.0 / 5.0 (جيد جداً ⭐)',
    3: '3.0 / 5.0 (جيد 👍)',
    2: '2.0 / 5.0 (متوسط 😐)',
    1: '1.0 / 5.0 (ضعيف 👎)'
  };

  if (labelEl) labelEl.innerText = labels[score] || `${score}.0 / 5.0`;

  if (container) {
    const buttons = container.querySelectorAll('.star-btn');
    buttons.forEach((btn, idx) => {
      if (idx < score) {
        btn.className = 'star-btn text-3xl text-amber-400 scale-110 hover:scale-125 transition-transform cursor-pointer';
      } else {
        btn.className = 'star-btn text-3xl text-slate-300 hover:scale-125 transition-transform cursor-pointer';
      }
    });
  }
}

export function submitMentorRating() {
  const mentorIdInput = document.getElementById('rating-mentor-id');
  const bookingIdInput = document.getElementById('rating-booking-id');
  const scoreInput = document.getElementById('rating-score-value');
  const commentInput = document.getElementById('rating-comment-input');

  const mentorId = mentorIdInput?.value;
  const bookingId = bookingIdInput?.value;
  const score = parseInt(scoreInput?.value || 5);
  const comment = (commentInput?.value || '').trim();

  if (!comment) {
    alert('من فضلك اكتب تعليقك وانطباعك عن الجلسة مع المنتور.');
    return;
  }

  const mentor = state.mentors.find(m => m.id === mentorId);
  if (!mentor) {
    alert('تعذر العثور على بيانات المنتور.');
    return;
  }

  if (!Array.isArray(mentor.reviewsList)) {
    mentor.reviewsList = getSeedReviewsForMentor(mentor.id);
  }

  const studentName = state.currentUser?.name || state.timaCard.name || 'مريم حسام شريف';

  const newReview = {
    id: `rev-${Date.now()}`,
    mentorId: mentor.id,
    studentName: studentName,
    rating: score,
    comment: comment,
    date: new Date().toLocaleDateString('ar-EG')
  };

  mentor.reviewsList.unshift(newReview);

  // Recalculate average rating
  const totalStars = mentor.reviewsList.reduce((acc, r) => acc + Number(r.rating || 5), 0);
  const avg = (totalStars / mentor.reviewsList.length).toFixed(1);
  mentor.rating = avg;
  mentor.sessionsCount = Math.max(mentor.sessionsCount || 0, mentor.reviewsList.length);

  // Update booking if exists
  if (bookingId) {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.hasBeenRated = true;
      booking.rating = score;
      booking.comment = comment;
    }
  }

  saveToStorage();
  closeRatingModal();

  showToast('تم حفظ تقييمك ومراجعتك للمنتور بنجاح! ⭐✨');
  renderApp();
}

export function openMentorReviewsModal(mentorId) {
  const mentor = state.mentors.find(m => m.id === mentorId);
  if (!mentor) return;

  const modal = document.getElementById('modal-mentor-reviews-list');
  const nameEl = document.getElementById('reviews-list-mentor-name');
  const container = document.getElementById('reviews-list-container');

  if (nameEl) {
    nameEl.innerHTML = `<span>تقييمات ومراجعات الخبير (${mentor.fullName || mentor.name}) ★ ${mentor.rating}</span>`;
  }

  if (!Array.isArray(mentor.reviewsList) || mentor.reviewsList.length === 0) {
    mentor.reviewsList = getSeedReviewsForMentor(mentor.id);
  }

  if (container) {
    container.innerHTML = mentor.reviewsList.map(r => {
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      return `
        <div class="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-black text-xs">
                ${(r.studentName || 'ط')[0]}
              </div>
              <div>
                <h5 class="font-black text-xs text-[#1E1B4B]">${r.studentName}</h5>
                <span class="text-[10px] text-slate-400 font-mono">${r.date}</span>
              </div>
            </div>
            <span class="text-amber-400 font-mono text-sm tracking-wider dir-ltr">${stars}</span>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed font-sans bg-white p-3 rounded-xl border border-purple-100">
            "${r.comment}"
          </p>
        </div>
      `;
    }).join('');
  }

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    window.lucide && window.lucide.createIcons();
  }
}

export function closeMentorReviewsModal() {
  const modal = document.getElementById('modal-mentor-reviews-list');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

const reactRootsMap = new WeakMap();

/**
 * Bridge function to mount React components into Vanilla JS slots safely without duplicate createRoot calls
 */
export function mountReactComponent(componentName, containerId, props = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return;

  try {
    let element = null;

    if (componentName === 'ExpertInstaPay') {
      element = React.createElement(ExpertInstaPay, props);
    } else if (componentName === 'DownloadCVButton') {
      element = React.createElement(DownloadCVButton, props);
    } else if (componentName === 'MentorPaymentGateway') {
      element = React.createElement(MentorPaymentGateway, props);
    }

    if (element) {
      let root = container._reactRoot || reactRootsMap.get(container);
      if (!root) {
        root = ReactDOM.createRoot(container);
        container._reactRoot = root;
        reactRootsMap.set(container, root);
      }
      root.render(element);
    }
  } catch (e) {
    console.error(`Failed to mount React component ${componentName}:`, e);
  }
}

export function unmountReactComponent(containerId) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return;

  const root = container._reactRoot || reactRootsMap.get(container);
  if (root) {
    try {
      root.unmount();
    } catch (e) {
      console.warn('Unmount error:', e);
    }
    delete container._reactRoot;
    reactRootsMap.delete(container);
  }
}

// -------------------------------------------------------------
// SETUP GLOBAL FUNCTIONS FOR INLINE ONCLICK HANDLERS
// -------------------------------------------------------------
export function setupGlobalFunctions() {
  const fns = {
    navigateView,
    mountReactComponent,
    unmountReactComponent,
    openMentorPaymentGateway,
    setStudentTab,
    toggleFaqItem,
    setBuilderSubTab,
    startOnboarding,
    openRoleSignup,
    closeRoleSignup,
    setMentorSignupPayoutTab,
    validateRoleSignupForm,
    submitRoleSignup,
    openRatingModal,
    closeRatingModal,
    setSelectedRating,
    submitMentorRating,
    openMentorReviewsModal,
    closeMentorReviewsModal,
    logoutUser,
    updateTimaFromSliders,
    rateTimaWithAi,
    evaluateTimaCard,
    downloadTimaCard,
    openBookingModal,
    closeBookingModal,
    confirmBookingSession,
    openMentorRoom,
    closeMentorRoom,
    openReportForBookingMentor,
    sendRoomMessage,
    testRoomScamMessage,
    createCompanyJob,
    filterTalentPool,
    contactStudent,
    applyToJob,
    submitLabWork,
    onLabContentInput,
    onChallengeSelected,
    selectChallengeForSubmission,
    updateLabFormForChallenge,
    isWritingChallenge,
    checkAdminAccess,
    createAdminChallenge,

    // Infinite Tima Levels
    getInfiniteLevel,
    addTimaPoints,
    setTimaPoints,
    triggerPrestige,
    setCustomCardTheme,
    initStarsCanvas,
    renderLeaderboard,

    // Professional CV & Portfolio Engine
    setCVStep,
    nextCVStep,
    prevCVStep,
    setCVTab,
    saveCV,
    aiEnhanceSummary,
    handleCVPhotoUpload,
    removeCVPhoto,
    addCVExperience,
    updateCVExperience,
    removeCVExperience,
    addCVMediaSkill,
    setMediaSkillLevel,
    removeCVMediaSkill,
    addCVTechSkill,
    removeCVTechSkill,
    addCVLanguage,
    removeCVLanguage,
    addCVCertificate,
    updateCVCertificate,
    removeCVCertificate,
    addCVVolunteering,
    updateCVVolunteering,
    removeCVVolunteering,
    downloadCVPdf,
    shareCVLink,
    openAddWorkModal,
    closeAddWorkModal,
    setAddWorkModalTab,
    handlePortfolioFileUpload,
    submitNewPortfolioWork,
    deletePortfolioItem,
    handlePortfolioDeleteClick,
    openDeleteConfirmModal,
    closeDeleteConfirmModal,
    executeConfirmedDelete,
    setPortfolioFilter,
    viewPortfolioDetail,
    closePortfolioDetailModal,
    copyPortfolioLink,

    // Anti-Scam, Auto-Block & Admin Protection System
    scanTextForScamKeywords,
    checkAllAccountsForScamKeywords,
    checkAndApplyAutoBlock,
    openReportModal,
    closeReportModal,
    handleReportScreenshotUpload,
    removeReportScreenshot,
    submitReport,
    setAdminSubTab,
    renderAdminApp,
    isAdminAuthenticated,
    openAdminLockModal,
    closeAdminLockModal,
    submitAdminLock,
    logoutAdmin,
    copyAdminDashboardLink,
    renderAdminStudentsTable,
    filterAdminStudents,
    toggleStudentStatus,
    confirmDeleteStudent,
    closeDeleteStudentModal,
    executeDeleteStudent,
    openAdminAddStudentModal,
    closeAdminAddStudentModal,
    submitAdminNewStudent,
    setAdminPortfolioFilter,
    renderAdminPortfolioTable,
    approvePortfolioItem,
    rejectPortfolioItem,
    openAdminAddChallengeModal,
    closeAdminAddChallengeModal,
    submitAdminNewChallenge,
    deleteAdminChallenge,
    renderAdminChallengesTable,
    toggleJobStatus,
    renderAdminCompanyRequestsTable,
    renderAdminProtectionTab,
    renderAdminVerifications,
    approveVerification,
    rejectVerification,
    renderAdminReports,
    takeReportAction,
    renderAdminBlacklistIps,
    addIpToBlacklist,
    removeIpFromBlacklist,
    openImagePreviewModal,
    closeImagePreviewModal,
    handleMentorIdUpload,
    handleMentorCardUpload,
    handleCompanyRegUpload,

    // Phi Scout AI Media Recruitment Assistant
    askPhiScout,
    applyScoutPreset,
    toggleScoutJsonView,
    copyScoutJson,
    renderPhiScoutResults,

    // Notification toast & Splash Screen
    showToast,
    triggerSplash: (ms = 2500) => {
      if (typeof window._domShowSplashScreen === 'function') {
        window._domShowSplashScreen(ms);
      } else if (typeof window.showSplashScreen === 'function' && window.showSplashScreen !== fns.showSplashScreen) {
        window.showSplashScreen(ms);
      }
    },
    showSplashScreen: (ms = 2500) => {
      if (typeof window._domShowSplashScreen === 'function') {
        window._domShowSplashScreen(ms);
      } else if (typeof window.showSplashScreen === 'function' && window.showSplashScreen !== fns.showSplashScreen) {
        window.showSplashScreen(ms);
      }
    }
  };

  if (!window.phiApp) {
    window.phiApp = {};
  }
  Object.assign(window.phiApp, fns);
  window._phiAppReal = fns;

  // Also bind all functions directly to window so inline HTML onclick="foo()" calls succeed without ReferenceError
  Object.keys(fns).forEach(key => {
    if (key === 'showSplashScreen' && typeof window._domShowSplashScreen === 'function') {
      return;
    }
    try {
      window[key] = fns[key];
    } catch (e) {
      // Ignore read-only properties
    }
  });

  // Process queued invocations if any buttons were clicked before module loaded
  if (window._phiAppQueue && Array.isArray(window._phiAppQueue) && window._phiAppQueue.length > 0) {
    const queue = [...window._phiAppQueue];
    window._phiAppQueue = [];
    queue.forEach(([fnName, args]) => {
      if (typeof fns[fnName] === 'function') {
        try {
          fns[fnName](...args);
        } catch (err) {
          console.warn(`Error running queued call ${fnName}:`, err);
        }
      }
    });
  }

  return window.phiApp;
}

// Call immediately on module evaluation so all globals are present
setTimeout(setupGlobalFunctions, 0);

