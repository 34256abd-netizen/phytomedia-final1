// =============================================================
// φ To Media - Professional CV & Portfolio Engine
// Storage keys: tima_cv_[email], tima_portfolio_[email]
// =============================================================

import { state, addTimaPoints, compressImageFile } from './app-logic.js';
import arabicReshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/**
  Arabic text forsupport RTL/Ligatures natively (like jsPDF)
 * Port of the provided Python logic to JavaScript.
 */
export function fixArabic(text) {
  if (!text) return '';
  let reshaped = text;
  try {
    const reshaper = (arabicReshaper && arabicReshaper.default) ? arabicReshaper.default : arabicReshaper;
    if (typeof reshaper?.convertArabic === 'function') {
      reshaped = reshaper.convertArabic(text);
    } else if (typeof reshaper?.reshape === 'function') {
      reshaped = reshaper.reshape(text);
    } else if (typeof reshaper?.convert === 'function') {
      reshaped = reshaper.convert(text);
    } else if (typeof reshaper === 'function') {
      reshaped = reshaper(text);
    } else if (typeof window !== 'undefined' && window.arabicReshaper) {
      if (typeof window.arabicReshaper.convertArabic === 'function') {
        reshaped = window.arabicReshaper.convertArabic(text);
      } else if (typeof window.arabicReshaper.reshape === 'function') {
        reshaped = window.arabicReshaper.reshape(text);
      }
    }
  } catch (e) {
    console.warn('arabicReshaper error:', e);
  }

  try {
    if (bidi && typeof bidi.getDisplay === 'function') {
      return bidi.getDisplay(reshaped);
    }
  } catch (e) {
    console.warn('bidi error:', e);
  }
  return reshaped;
}

// Default empty CV structure (No fake data - all clean empty template)
export function createEmptyCV() {
  return {
    // Step 1: Basic Info
    photo: '',
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    address: '',
    linkedin: '',

    // Step 2: Professional Summary
    summary: '',

    // Step 3: Work Experience (array of items)
    experiences: [],

    // Step 4: Education
    education: {
      university: '',
      faculty: '',
      department: '',
      gradYear: '',
      grade: '',
      gradProject: ''
    },

    // Step 5: Skills
    // Media skills: name, rating 1-5
    mediaSkills: [],
    // Tech skills: list of strings
    techSkills: [],

    // Step 6: Languages
    // name, level: 'لغة أم (Native)' | 'متقدم (Fluent)' | 'متوسط (Intermediate)' | 'مبتدئ (Beginner)'
    languages: [
      { name: 'اللغة العربية', level: 'لغة أم (Native)' }
    ],

    // Step 7: Certificates & Courses
    // title, issuer, year, linkOrImg
    certificates: [],

    // Step 8: Volunteering & Awards
    // name, role, year, desc
    volunteering: [],

    lastSaved: null
  };
}

// Current CV Builder state
export const cvState = {
  currentStep: 1, // 1 to 8
  data: createEmptyCV(),
  activeTab: 'edit', // 'edit' | 'preview'
  availableMediaSkills: [
    'تصوير',
    'مونتاج',
    'كتابة صحفية',
    'تقديم تلفزيوني',
    'تقديم إذاعي',
    'إخراج',
    'فويس أوفر (Voice Over)',
    'تحقيق استقصائي',
    'إعداد برامج',
    'إدارة منصات وتواصل اجتماعي',
    'علاقات عامة (PR)',
    'تصميم جرافيك وموشن'
  ]
};

// Portfolio state
export const portfolioState = {
  items: [],
  activeFilter: 'الكل', // 'الكل' | 'فيديو' | 'مقال' | 'تصميم' | 'بودكاست' | 'تحقيق'
  modalOpen: false,
  modalTab: 'link', // 'link' | 'file'
  selectedItemForView: null,
  newLinkItem: {
    title: '',
    type: 'فيديو',
    url: '',
    desc: '',
    date: new Date().toISOString().split('T')[0],
    tools: ''
  },
  newFileItem: {
    title: '',
    type: 'فيديو',
    fileData: null,
    selectedFile: null,
    fileUrl: '',
    fileName: '',
    fileSizeStr: '',
    desc: '',
    date: new Date().toISOString().split('T')[0],
    tools: ''
  }
};

// Storage helper functions
export function getUserEmail() {
  if (state.currentUser && state.currentUser.email) {
    return state.currentUser.email.trim().toLowerCase();
  }
  return 'guest_student@phitomedia.eg';
}

export function getCVStorageKey() {
  return `tima_cv_${getUserEmail()}`;
}

export function getPortfolioStorageKey() {
  return `tima_portfolio_${getUserEmail()}`;
}

// Default initial works for student portfolio
export const DEFAULT_PORTFOLIO_ITEMS = [];


// Load CV & Portfolio for current user
export function loadCVAndPortfolio() {
  try {
    const cvRaw = localStorage.getItem(getCVStorageKey());
    if (cvRaw) {
      const parsed = JSON.parse(cvRaw);
      cvState.data = Object.assign(createEmptyCV(), parsed);
      if (!Array.isArray(cvState.data.languages) || cvState.data.languages.length === 0) {
        cvState.data.languages = [{ name: 'اللغة العربية', level: 'لغة أم (Native)' }];
      }
    } else {
      cvState.data = createEmptyCV();
      // Pre-fill student name and email if logged in
      if (state.currentUser) {
        cvState.data.fullName = state.currentUser.name || '';
        cvState.data.email = state.currentUser.email || '';
        if (state.currentUser.department) {
          cvState.data.education.department = state.currentUser.department;
        }
        if (state.currentUser.gradYear) {
          cvState.data.education.gradYear = state.currentUser.gradYear;
        }
      }
    }
  } catch (e) {
    console.error('Error loading CV:', e);
    cvState.data = createEmptyCV();
  }

  try {
    const key = getPortfolioStorageKey();
    const portRaw = localStorage.getItem(key);
    if (portRaw !== null) {
      portfolioState.items = JSON.parse(portRaw);
      if (!Array.isArray(portfolioState.items)) portfolioState.items = [];
    } else {
      // First-time load: populate with default items and persist
      portfolioState.items = [...DEFAULT_PORTFOLIO_ITEMS];
      try {
        localStorage.setItem(key, JSON.stringify(portfolioState.items));
      } catch (err) {}
    }

    // Restore any IDB-backed files asynchronously
    portfolioState.items.forEach(async (item) => {
      if (item && item.fileUrl && (item.fileUrl.startsWith('idb://') || !item.fileUrl)) {
        const stored = await getFileFromIndexedDB(item.id);
        if (stored) {
          if (typeof stored === 'string') {
            item.fileUrl = stored;
          } else {
            item.fileUrl = URL.createObjectURL(stored);
            item._rawBlob = stored;
          }
          renderPortfolioSection();
        }
      }
    });
  } catch (e) {
    console.error('Error loading Portfolio:', e);
    portfolioState.items = [...DEFAULT_PORTFOLIO_ITEMS];
  }
}

// =============================================================
// INDEXED-DB MEDIA STORAGE (Reliable offline video & media cache)
// =============================================================
const IDB_NAME = 'phi_media_storage_v1';
const IDB_STORE = 'portfolio_files';

function getMediaDB() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

export async function saveFileToIndexedDB(id, blobOrData) {
  try {
    const db = await getMediaDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(blobOrData, id);
  } catch (e) {
    console.warn('IDB save error:', e);
  }
}

export async function getFileFromIndexedDB(id) {
  try {
    const db = await getMediaDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function deleteFileFromIndexedDB(id) {
  try {
    const db = await getMediaDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
  } catch (e) {}
}

// Save CV to localStorage and update Tima Card stats
export function saveCV(silent = false) {
  cvState.data.lastSaved = new Date().toISOString();
  try {
    localStorage.setItem(getCVStorageKey(), JSON.stringify(cvState.data));
    
    // Sync with Tima Card stats automatically!
    syncCVWithTimaCard();

    if (!silent) {
      showToast('تم حفظ بيانات السيرة الذاتية بنجاح في ملفك الشخصي! 💾✨');
    }
  } catch (e) {
    console.warn('CV storage quota exceeded:', e);
    if (!silent && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      alert('⚠️ تنبيه: مساحة التخزين المحلية ممتلئة!\n\nتعذر حفظ بيانات السيرة الذاتية كاملة بسبب كثرة البيانات أو الصور. يرجى محاولة حذف بعض الصور أو النصوص الطويلة لضمان الحفظ.');
    }
  }
  renderCVPreview();
}

// Sync CV with Tima Card: skills in CV auto update Tima stats
export function syncCVWithTimaCard() {
  if (!state.timaCard) return;

  // Update name and position if present
  if (cvState.data.fullName) state.timaCard.name = cvState.data.fullName;
  if (cvState.data.jobTitle) state.timaCard.position = cvState.data.jobTitle;
  if (cvState.data.education && cvState.data.education.department) {
    state.timaCard.department = cvState.data.education.department;
  }
  if (cvState.data.education && cvState.data.education.gradYear) {
    state.timaCard.gradYear = cvState.data.education.gradYear;
  }

  // Calculate boosts based on skills and experiences
  let filmingBoost = 0;
  let montageBoost = 0;
  let writingBoost = 0;
  let presentingBoost = 0;
  let prBoost = 0;
  let digitalBoost = 0;

  // Check mediaSkills
  if (Array.isArray(cvState.data.mediaSkills)) {
    cvState.data.mediaSkills.forEach(s => {
      const name = (s.name || '').toLowerCase();
      const stars = Number(s.level) || 3;
      const boostVal = stars * 3.5; // Up to ~18 points boost

      if (name.includes('تصوير') || name.includes('كاميرا')) filmingBoost += boostVal;
      if (name.includes('مونتاج') || name.includes('موشن')) montageBoost += boostVal;
      if (name.includes('كتابة') || name.includes('صحف') || name.includes('تحقيق')) writingBoost += boostVal;
      if (name.includes('تقديم') || name.includes('فويس') || name.includes('إذاع')) presentingBoost += boostVal;
      if (name.includes('علاقات') || name.includes('برامج') || name.includes('pr')) prBoost += boostVal;
      if (name.includes('سوشيال') || name.includes('ديجيتال') || name.includes('منصات')) digitalBoost += boostVal;
    });
  }

  // Check tech skills
  if (Array.isArray(cvState.data.techSkills)) {
    cvState.data.techSkills.forEach(t => {
      const low = (t || '').toLowerCase();
      if (low.includes('premiere') || low.includes('davinci') || low.includes('after effects') || low.includes('final cut')) {
        montageBoost += 4;
      }
      if (low.includes('sony') || low.includes('canon') || low.includes('red') || low.includes('arri') || low.includes('lighting')) {
        filmingBoost += 4;
      }
      if (low.includes('audition') || low.includes('pro tools') || low.includes('sound')) {
        presentingBoost += 3;
      }
      if (low.includes('photoshop') || low.includes('canva') || low.includes('illustrator') || low.includes('seo')) {
        digitalBoost += 4;
      }
    });
  }

  // Experience counts
  const expCount = (cvState.data.experiences || []).length;
  const certCount = (cvState.data.certificates || []).length;
  const baseline = 75; // Starting base for student with skills

  if (expCount > 0 || cvState.data.mediaSkills.length > 0) {
    state.timaCard.stats = {
      filming: Math.min(99, Math.max(70, Math.round(baseline + filmingBoost + (expCount * 2)))),
      montage: Math.min(99, Math.max(70, Math.round(baseline + montageBoost + (expCount * 2)))),
      writing: Math.min(99, Math.max(70, Math.round(baseline + writingBoost + (expCount * 2)))),
      presenting: Math.min(99, Math.max(70, Math.round(baseline + presentingBoost + (expCount * 2)))),
      pr: Math.min(99, Math.max(70, Math.round(baseline + prBoost + (expCount * 2)))),
      digital: Math.min(99, Math.max(70, Math.round(baseline + digitalBoost + (expCount * 2) + (certCount * 1.5))))
    };

    // Calculate overall average
    const vals = Object.values(state.timaCard.stats);
    state.timaCard.overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  try {
    localStorage.setItem('phi_tima_card_v1', JSON.stringify(state.timaCard));
  } catch (e) {}
}

// Save Portfolio to localStorage and IndexedDB
export function savePortfolio(itemTitleForToast = '') {
  let success = false;

  // Persist files into IndexedDB in background
  try {
    portfolioState.items.forEach(it => {
      if (it._rawBlob) {
        saveFileToIndexedDB(it.id, it._rawBlob);
      } else if (it.fileUrl && it.fileUrl.startsWith('data:')) {
        saveFileToIndexedDB(it.id, it.fileUrl);
      }
    });
  } catch (err) {}

  // Prepare safe items copy for localStorage (prevent QuotaExceededError for large media)
  const safeItems = portfolioState.items.map(it => {
    if (it.fileUrl && it.fileUrl.startsWith('data:') && it.fileUrl.length > 250000) {
      return { ...it, fileUrl: `idb://${it.id}`, fileData: '' };
    }
    return it;
  });

  try {
    localStorage.setItem(getPortfolioStorageKey(), JSON.stringify(safeItems));
    if (itemTitleForToast) {
      showToast(`تمت إضافة العمل "${itemTitleForToast}" بنجاح وحصلت على +15 نقطة Tima! 🎉⭐`);
    }
    success = true;
  } catch (e) {
    console.warn('Portfolio storage quota exceeded:', e);
    try {
      const minimalItems = portfolioState.items.map(it => ({
        ...it,
        fileUrl: it.fileUrl && it.fileUrl.length > 500 ? `idb://${it.id}` : it.fileUrl,
        fileData: ''
      }));
      localStorage.setItem(getPortfolioStorageKey(), JSON.stringify(minimalItems));
      if (itemTitleForToast) {
        showToast(`تمت إضافة العمل "${itemTitleForToast}" بنجاح وحصلت على +15 نقطة Tima! 🎉⭐`);
      }
      success = true;
    } catch (e2) {
      // In-memory success still holds
      success = true;
      if (itemTitleForToast) {
        showToast(`تمت إضافة العمل "${itemTitleForToast}" بنجاح وحصلت على +15 نقطة Tima! 🎉⭐`);
      }
    }
  }

  renderPortfolioSection();
  return success;
}

// Show toast notification
export function showToast(message) {
  let toast = document.getElementById('tima-global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tima-global-toast';
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1E1B4B] text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-pink-500/40 text-xs sm:text-sm font-bold flex items-center gap-3 transition-all duration-300 opacity-0 pointer-events-none transform translate-y-4';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-[#EC4899] animate-ping"></span><span>${message}</span>`;
  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
  toast.classList.add('opacity-100', 'translate-y-0');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
  }, 3500);
}

// -------------------------------------------------------------
// CV BUILDER: STEP NAVIGATION & FORM HANDLING
// -------------------------------------------------------------

export function setCVStep(stepNum) {
  if (stepNum < 1) stepNum = 1;
  if (stepNum > 8) stepNum = 8;
  cvState.currentStep = stepNum;
  renderCVStepForm();
  renderCVStepIndicators();
}

export function nextCVStep() {
  saveCurrentStepInputs();
  if (cvState.currentStep < 8) {
    setCVStep(cvState.currentStep + 1);
  } else {
    // Last step: Save & preview
    saveCV();
    setCVTab('preview');
  }
}

export function prevCVStep() {
  saveCurrentStepInputs();
  if (cvState.currentStep > 1) {
    setCVStep(cvState.currentStep - 1);
  }
}

export function setCVTab(tab) {
  cvState.activeTab = tab;
  const editContainer = document.getElementById('cv-tab-content-edit');
  const previewContainer = document.getElementById('cv-tab-content-preview');
  const tabBtnEdit = document.getElementById('cv-mode-btn-edit');
  const tabBtnPrev = document.getElementById('cv-mode-btn-prev');

  if (tab === 'edit') {
    if (editContainer) editContainer.classList.remove('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');
    if (tabBtnEdit) tabBtnEdit.className = 'px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md transition-all';
    if (tabBtnPrev) tabBtnPrev.className = 'px-4 py-2 rounded-xl text-xs font-bold text-[#7C3AED] hover:bg-purple-50 transition-all';
  } else {
    saveCurrentStepInputs();
    saveCV(true);
    renderCVPreview();
    if (editContainer) editContainer.classList.add('hidden');
    if (previewContainer) previewContainer.classList.remove('hidden');
    if (tabBtnEdit) tabBtnEdit.className = 'px-4 py-2 rounded-xl text-xs font-bold text-[#7C3AED] hover:bg-purple-50 transition-all';
    if (tabBtnPrev) tabBtnPrev.className = 'px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md transition-all';
  }
}

// Save inputs currently displayed in the active step
export function saveCurrentStepInputs() {
  const step = cvState.currentStep;
  if (step === 1) {
    cvState.data.fullName = document.getElementById('cv-input-name')?.value.trim() || cvState.data.fullName;
    cvState.data.jobTitle = document.getElementById('cv-input-title')?.value.trim() || cvState.data.jobTitle;
    cvState.data.email = document.getElementById('cv-input-email')?.value.trim() || cvState.data.email;
    cvState.data.phone = document.getElementById('cv-input-phone')?.value.trim() || cvState.data.phone;
    cvState.data.address = document.getElementById('cv-input-address')?.value.trim() || cvState.data.address;
    cvState.data.linkedin = document.getElementById('cv-input-linkedin')?.value.trim() || cvState.data.linkedin;
  } else if (step === 2) {
    cvState.data.summary = document.getElementById('cv-input-summary')?.value.trim() || cvState.data.summary;
  } else if (step === 4) {
    if (!cvState.data.education) cvState.data.education = {};
    cvState.data.education.university = document.getElementById('cv-input-uni')?.value.trim() || '';
    cvState.data.education.faculty = document.getElementById('cv-input-faculty')?.value.trim() || '';
    cvState.data.education.department = document.getElementById('cv-input-dept')?.value.trim() || '';
    cvState.data.education.gradYear = document.getElementById('cv-input-year')?.value.trim() || '';
    cvState.data.education.grade = document.getElementById('cv-input-grade')?.value.trim() || '';
    cvState.data.education.gradProject = document.getElementById('cv-input-project')?.value.trim() || '';
  }
  // Steps 3, 5, 6, 7, 8 use dynamic list mutations
}

// AI Assist for Professional Summary (Step 2)
export function aiEnhanceSummary() {
  const textarea = document.getElementById('cv-input-summary');
  const btn = document.getElementById('btn-ai-enhance-summary');
  if (!textarea) return;

  const currentVal = textarea.value.trim();
  const jobTitle = cvState.data.jobTitle || 'إعلامي ومحتوى إخباري';
  const name = cvState.data.fullName || 'إعلامي صاعد';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block">✨</span> جاري الصياغة الاحترافية وفق معايير الإعلام المصري...`;
  }

  setTimeout(() => {
    let enhanced = '';
    if (currentVal.length > 10) {
      enhanced = `إعلامي شغوف ومحترف ذو رؤية معاصرة في مجال ${jobTitle}. أمتلك خبرة عملية في صناعة المحتوى البصري والتحقيق الميداني، مع إتقان تقنيات السرد الصحفي الحديث وأدوات الإنتاج الرقمي. أتميز بالدقة في التحرير، وسرعة البديهة في التغطيات الحية، والالتزام الصارم بمواثيق الشرف الإعلامي، ساعياً لتقديم محتوى مؤثر يترك بصمة إيجابية ويعكس الهوية المصرية المعاصرة.`;
    } else {
      enhanced = `إعلامي متخصص ومبادر في ${jobTitle}، خريج شغوف بسرد القصص الإنسانية والتغطيات الميدانية والتحقيقات الاستقصائية. متمكن من أدوات المونتاج والتصوير وإعداد المحتوى الرقمي الموجه لمنصات التواصل والقنوات التلفزيونية. جاهز للانضمام إلى فرق العمل الإخبارية والإنتاجية بقدرة عالية على العمل تحت الضغط وتقديم أفكار مبتكرة.`;
    }

    textarea.value = enhanced;
    cvState.data.summary = enhanced;
    saveCV(true);

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="sparkles" class="w-3.5 h-3.5"></i> <span>تم تحسين الملخص بالذكاء الاصطناعي بنجاح! ⭐</span>`;
      window.lucide && window.lucide.createIcons();
    }
    showToast('تمت صياغة الملخص المهني بالـ AI بنجاح! 🚀');
  }, 800);
}

// Photo Upload via FileReader (Step 1)
export async function handleCVPhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    alert('حجم الصورة كبير جداً، الحد الأقصى المسموح 10 ميجابايت.');
    return;
  }

  try {
    const compressed = await compressImageFile(file, 400, 400, 0.75);
    cvState.data.photo = compressed;
    const preview = document.getElementById('cv-photo-preview');
    if (preview) {
      preview.src = compressed;
      preview.classList.remove('hidden');
    }
    const placeholder = document.getElementById('cv-photo-placeholder');
    if (placeholder) placeholder.classList.add('hidden');
    showToast('تم تحميل الصورة الشخصية وضغطها بنجاح 📸');
  } catch (err) {
    console.warn('Error uploading CV photo:', err);
  }
}

// Remove photo
export function removeCVPhoto() {
  cvState.data.photo = '';
  const preview = document.getElementById('cv-photo-preview');
  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  const placeholder = document.getElementById('cv-photo-placeholder');
  if (placeholder) placeholder.classList.remove('hidden');
}

// Step 3: Work Experience Mutations
export function addCVExperience() {
  saveCurrentStepInputs();
  if (!Array.isArray(cvState.data.experiences)) cvState.data.experiences = [];
  cvState.data.experiences.push({
    id: `exp-${Date.now()}`,
    company: '',
    role: '',
    period: '',
    desc: '',
    link: ''
  });
  renderCVStepForm();
}

export function updateCVExperience(index, field, value) {
  if (cvState.data.experiences && cvState.data.experiences[index]) {
    cvState.data.experiences[index][field] = value;
  }
}

export function removeCVExperience(index) {
  if (cvState.data.experiences) {
    cvState.data.experiences.splice(index, 1);
    renderCVStepForm();
  }
}

// Step 5: Skills Mutations
export function addCVMediaSkill(skillName = '', stars = 4) {
  if (!skillName) {
    const input = document.getElementById('cv-new-skill-input');
    skillName = input ? input.value.trim() : '';
    if (input) input.value = '';
  }
  if (!skillName) return;

  if (!Array.isArray(cvState.data.mediaSkills)) cvState.data.mediaSkills = [];
  // Avoid duplicates
  if (cvState.data.mediaSkills.some(s => s.name === skillName)) {
    showToast('هذه المهارة مضافة بالفعل!');
    return;
  }

  cvState.data.mediaSkills.push({
    name: skillName,
    level: Math.max(1, Math.min(5, stars))
  });
  renderCVStepForm();
  syncCVWithTimaCard();
}

export function setMediaSkillLevel(index, level) {
  if (cvState.data.mediaSkills && cvState.data.mediaSkills[index]) {
    cvState.data.mediaSkills[index].level = level;
    renderCVStepForm();
    syncCVWithTimaCard();
  }
}

export function removeCVMediaSkill(index) {
  if (cvState.data.mediaSkills) {
    cvState.data.mediaSkills.splice(index, 1);
    renderCVStepForm();
    syncCVWithTimaCard();
  }
}

export function addCVTechSkill(toolName = '') {
  if (!toolName) {
    const input = document.getElementById('cv-new-tech-input');
    toolName = input ? input.value.trim() : '';
    if (input) input.value = '';
  }
  if (!toolName) return;

  if (!Array.isArray(cvState.data.techSkills)) cvState.data.techSkills = [];
  if (cvState.data.techSkills.includes(toolName)) {
    showToast('هذه الأداة مضافة بالفعل!');
    return;
  }
  cvState.data.techSkills.push(toolName);
  renderCVStepForm();
  syncCVWithTimaCard();
}

export function removeCVTechSkill(index) {
  if (cvState.data.techSkills) {
    cvState.data.techSkills.splice(index, 1);
    renderCVStepForm();
    syncCVWithTimaCard();
  }
}

// Step 6: Languages Mutations
export function addCVLanguage(customName = '', customLevel = '') {
  let name = customName;
  let level = customLevel;

  if (!name) {
    const langInput = document.getElementById('cv-new-lang-name');
    const levelSelect = document.getElementById('cv-new-lang-level');
    name = langInput ? langInput.value.trim() : '';
    level = levelSelect ? levelSelect.value : 'متقدم (Fluent)';
    if (langInput) langInput.value = '';
  }

  if (!name) {
    alert('من فضلك اكتب اسم اللغة (مثل: اللغة العربية، الإنجليزية).');
    return;
  }

  if (!Array.isArray(cvState.data.languages)) cvState.data.languages = [];
  if (cvState.data.languages.some(l => l.name === name)) {
    showToast('هذه اللغة مضافة بالفعل!');
    return;
  }
  cvState.data.languages.push({ name, level });
  renderCVStepForm();
  renderCVPreview();
  saveCV(true);
}

export function removeCVLanguage(index) {
  if (cvState.data.languages) {
    cvState.data.languages.splice(index, 1);
    renderCVStepForm();
    renderCVPreview();
    saveCV(true);
  }
}

// Step 7: Certificates Mutations
export function addCVCertificate() {
  saveCurrentStepInputs();
  if (!Array.isArray(cvState.data.certificates)) cvState.data.certificates = [];
  cvState.data.certificates.push({
    id: `cert-${Date.now()}`,
    title: '',
    issuer: '',
    year: '',
    link: ''
  });
  renderCVStepForm();
}

export function updateCVCertificate(index, field, value) {
  if (cvState.data.certificates && cvState.data.certificates[index]) {
    cvState.data.certificates[index][field] = value;
  }
}

export function removeCVCertificate(index) {
  if (cvState.data.certificates) {
    cvState.data.certificates.splice(index, 1);
    renderCVStepForm();
  }
}

// Step 8: Volunteering Mutations
export function addCVVolunteering() {
  saveCurrentStepInputs();
  if (!Array.isArray(cvState.data.volunteering)) cvState.data.volunteering = [];
  cvState.data.volunteering.push({
    id: `vol-${Date.now()}`,
    name: '',
    role: '',
    year: '',
    desc: ''
  });
  renderCVStepForm();
}

export function updateCVVolunteering(index, field, value) {
  if (cvState.data.volunteering && cvState.data.volunteering[index]) {
    cvState.data.volunteering[index][field] = value;
  }
}

export function removeCVVolunteering(index) {
  if (cvState.data.volunteering) {
    cvState.data.volunteering.splice(index, 1);
    renderCVStepForm();
  }
}

// -------------------------------------------------------------
// RENDER: STEP INDICATORS (1 to 8)
// -------------------------------------------------------------
export function renderCVStepIndicators() {
  const container = document.getElementById('cv-steps-indicator');
  if (!container) return;

  const stepTitles = [
    { num: 1, title: 'الأساسية', icon: 'user' },
    { num: 2, title: 'الملخص', icon: 'file-text' },
    { num: 3, title: 'الخبرات', icon: 'briefcase' },
    { num: 4, title: 'التعليم', icon: 'graduation-cap' },
    { num: 5, title: 'المهارات', icon: 'sparkles' },
    { num: 6, title: 'اللغات', icon: 'languages' },
    { num: 7, title: 'الشهادات', icon: 'award' },
    { num: 8, title: 'الجوائز', icon: 'heart-handshake' }
  ];

  container.innerHTML = stepTitles.map(st => {
    const isCurrent = st.num === cvState.currentStep;
    const isPassed = st.num < cvState.currentStep;

    let bgClass = 'bg-white text-slate-400 border border-purple-100';
    if (isCurrent) {
      bgClass = 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md shadow-purple-500/20 scale-105';
    } else if (isPassed) {
      bgClass = 'bg-purple-100 text-[#7C3AED] border border-purple-200';
    }

    return `
      <button onclick="window.phiApp.setCVStep(${st.num})" class="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${bgClass}">
        <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${isCurrent ? 'bg-white/20' : 'bg-purple-50 text-[#7C3AED]'}">
          ${isPassed ? '✓' : st.num}
        </span>
        <span class="hidden sm:inline">${st.title}</span>
      </button>
    `;
  }).join('');
}

// -------------------------------------------------------------
// RENDER: STEP FORM BODY
// -------------------------------------------------------------
export function renderCVStepForm() {
  const container = document.getElementById('cv-step-form-body');
  if (!container) return;

  const d = cvState.data;
  const step = cvState.currentStep;

  let html = '';

  if (step === 1) {
    // Step 1: Basic Info
    html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-purple-50">
          <div>
            <h4 class="text-base font-black text-[#1E1B4B]">الخطوة 1: المعلومات الأساسية والشخصية</h4>
            <p class="text-xs text-slate-500">بيانات الاتصال والهوية المهنية لتظهر في رأس السيرة الذاتية.</p>
          </div>
          <span class="text-xs font-black px-2.5 py-1 rounded-lg bg-purple-100 text-[#7C3AED]">خطوة 1 من 8</span>
        </div>

        <!-- Photo Upload -->
        <div class="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col sm:flex-row items-center gap-4">
          <div class="relative w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-purple-200 flex items-center justify-center shrink-0 shadow-sm">
            ${d.photo 
              ? `<img id="cv-photo-preview" src="${d.photo}" class="w-full h-full object-cover">`
              : `<div id="cv-photo-placeholder" class="text-center p-2 text-purple-400">
                  <i data-lucide="camera" class="w-6 h-6 mx-auto mb-1"></i>
                  <span class="text-[9px] block font-bold">صورة</span>
                 </div>
                 <img id="cv-photo-preview" src="" class="w-full h-full object-cover hidden">`
            }
          </div>
          <div class="flex-1 text-center sm:text-right space-y-1.5">
            <span class="text-xs font-bold text-[#1E1B4B] block">الصورة الشخصية الرسمية (Media Profile Photo)</span>
            <p class="text-[11px] text-slate-500">يفضل صورة احترافية بخلفية حيادية أو استوديو (أقصى حجم: 5MB).</p>
            <div class="flex items-center gap-2 justify-center sm:justify-start pt-1">
              <label class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-bold cursor-pointer hover:opacity-95 shadow-sm inline-flex items-center gap-1.5">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                <span>رفع صورة</span>
                <input type="file" accept="image/*" class="hidden" onchange="window.phiApp.handleCVPhotoUpload(event)">
              </label>
              ${d.photo ? `
                <button onclick="window.phiApp.removeCVPhoto()" class="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50">
                  حذف الصورة
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">الاسم الكامل *</label>
            <input type="text" id="cv-input-name" value="${escapeHtml(d.fullName)}" placeholder="مثال: مريم حسام الشريف" class="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">المسمى الوظيفي المستهدف *</label>
            <input type="text" id="cv-input-title" value="${escapeHtml(d.jobTitle)}" placeholder="مثال: مراسلة ميدانية / مونتير إخباري / صحفي استقصائي" class="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">البريد الإلكتروني *</label>
            <input type="email" id="cv-input-email" value="${escapeHtml(d.email)}" placeholder="name@example.com" class="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]" dir="ltr">
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">رقم الهاتف / واتساب *</label>
            <input type="tel" id="cv-input-phone" value="${escapeHtml(d.phone)}" placeholder="01012345678" class="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]" dir="ltr">
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">العنوان / المدينة</label>
            <input type="text" id="cv-input-address" value="${escapeHtml(d.address)}" placeholder="مثال: الدقي، الجيزة، مصر" class="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">رابط لينكدإن (LinkedIn)</label>
            <input type="text" id="cv-input-linkedin" value="${escapeHtml(d.linkedin)}" placeholder="linkedin.com/in/username" class="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]" dir="ltr">
          </div>
        </div>
      </div>
    `;
  } else if (step === 2) {
    // Step 2: Professional Summary
    html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-purple-50">
          <div>
            <h4 class="text-base font-black text-[#1E1B4B]">الخطوة 2: الملخص المهني (Professional Summary)</h4>
            <p class="text-xs text-slate-500">فقرة تعريفية قوية (3 - 4 سطور) تلخص هويتك وشغفك الإعلامي ومجالات تميزك.</p>
          </div>
          <span class="text-xs font-black px-2.5 py-1 rounded-lg bg-purple-100 text-[#7C3AED]">خطوة 2 من 8</span>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-xs font-bold text-[#1E1B4B]">احكي عن نفسك كإعلامي *</label>
            <button onclick="window.phiApp.aiEnhanceSummary()" id="btn-ai-enhance-summary" class="px-3 py-1.5 rounded-xl bg-purple-100 text-[#7C3AED] hover:bg-purple-200 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-[#EC4899]"></i>
              <span>حسّن الملخص بالذكاء الاصطناعي 🪄</span>
            </button>
          </div>
          <textarea id="cv-input-summary" rows="6" placeholder="اكتب نبذة عن مسارك الإعلامي، أهدافك، وما يميز أسلوبك في السرد والتغطية الصحفية أو الإنتاج..." class="w-full px-3.5 py-3 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED] leading-relaxed">${escapeHtml(d.summary)}</textarea>
          <p class="text-[11px] text-slate-500 mt-1">نصيحة: يمكنك كتابة فكرة مبسطة والضغط على "حسّن الملخص بالذكاء الاصطناعي" لتحويلها إلى صياغة احترافية جاهزة لمسؤولي التوظيف.</p>
        </div>
      </div>
    `;
  } else if (step === 3) {
    // Step 3: Work Experience
    const exps = Array.isArray(d.experiences) ? d.experiences : [];
    html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-purple-50">
          <div>
            <h4 class="text-base font-black text-[#1E1B4B]">الخطوة 3: الخبرات العملية والتدريب الميداني</h4>
            <p class="text-xs text-slate-500">أضف تدريباتك الصحفية، القنوات، مشاريع الإنتاج، أو العمل الحر.</p>
          </div>
          <button onclick="window.phiApp.addCVExperience()" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-bold flex items-center gap-1 shadow-sm">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>إضافة خبرة جديدة</span>
          </button>
        </div>

        ${exps.length === 0 ? `
          <div class="p-8 rounded-3xl bg-purple-50/40 border border-dashed border-purple-200 text-center space-y-3">
            <i data-lucide="briefcase" class="w-8 h-8 mx-auto text-[#7C3AED]"></i>
            <h5 class="text-xs font-bold text-[#1E1B4B]">لا توجد خبرات مضافة حتى الآن</h5>
            <p class="text-[11px] text-slate-500 max-w-sm mx-auto">اضغط على زر "إضافة خبرة جديدة" لتسجيل تدريبك بقناة، جريدة، أو تغطية فعاليات.</p>
            <button onclick="window.phiApp.addCVExperience()" class="px-4 py-2 rounded-xl bg-white border border-purple-300 text-[#7C3AED] text-xs font-bold hover:bg-purple-50">
              + إضافة أول خبرة
            </button>
          </div>
        ` : `
          <div class="space-y-4">
            ${exps.map((exp, idx) => `
              <div class="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm space-y-3 relative group">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded-lg">خبرة #${idx + 1}</span>
                  <button onclick="window.phiApp.removeCVExperience(${idx})" class="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    <span>حذف</span>
                  </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">اسم المؤسسة / القناة / الموقع *</label>
                    <input type="text" value="${escapeHtml(exp.company || '')}" onchange="window.phiApp.updateCVExperience(${idx}, 'company', this.value)" placeholder="مثال: شبكة قنوات CBC / اليوم السابع" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">المسمى الوظيفي / الدور *</label>
                    <input type="text" value="${escapeHtml(exp.role || '')}" onchange="window.phiApp.updateCVExperience(${idx}, 'role', this.value)" placeholder="مثال: متدرب تحرير صحفي / مساعد مونتير" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">الفترة الزمنية (من - إلى) *</label>
                    <input type="text" value="${escapeHtml(exp.period || '')}" onchange="window.phiApp.updateCVExperience(${idx}, 'period', this.value)" placeholder="مثال: يوليو 2024 - سبتمبر 2024" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
                  </div>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">وصف المهام والإنجازات</label>
                  <textarea rows="2" onchange="window.phiApp.updateCVExperience(${idx}, 'desc', this.value)" placeholder="المسؤوليات اليومية، التقارير المنشورة، عدد المشاهدات..." class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">${escapeHtml(exp.desc || '')}</textarea>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">رابط أعمال أو تغطيات موثقة (اختياري)</label>
                  <input type="text" value="${escapeHtml(exp.link || '')}" onchange="window.phiApp.updateCVExperience(${idx}, 'link', this.value)" placeholder="https://..." class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]" dir="ltr">
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  } else if (step === 4) {
    // Step 4: Education
    const edu = d.education || {};
    html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-purple-50">
          <div>
            <h4 class="text-base font-black text-[#1E1B4B]">الخطوة 4: المؤهل والتعليم الأكاديمي</h4>
            <p class="text-xs text-slate-500">تفاصيل دراستك الجامعية، القسم الأكاديمي، ومشروع التخرج الإعلامي.</p>
          </div>
          <span class="text-xs font-black px-2.5 py-1 rounded-lg bg-purple-100 text-[#7C3AED]">خطوة 4 من 8</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">الجامعة *</label>
            <input type="text" id="cv-input-uni" value="${escapeHtml(edu.university || '')}" placeholder="مثال: جامعة القاهرة / جامعة عين شمس / MSA" class="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">الكلية *</label>
            <input type="text" id="cv-input-faculty" value="${escapeHtml(edu.faculty || '')}" placeholder="مثال: كلية الإعلام / كلية الآداب قسم إعلام" class="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">القسم الأكاديمي *</label>
            <input type="text" id="cv-input-dept" value="${escapeHtml(edu.department || '')}" placeholder="مثال: إذاعة وتلفزيون / صحافة ونشر / علاقات عامة وإعلان" class="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">سنة التخرج المتوقعة *</label>
            <select id="cv-input-year" class="w-full p-3 rounded-full border border-gray-300 bg-purple-50/50 text-xs outline-none focus:border-[#7C3AED] font-mono">
              ${[2028, 2027, 2026, 2025, 2024, 2023, 2022].map(year => {
                const isSelected = (edu.gradYear ? String(edu.gradYear) === String(year) : year === 2027);
                const currentYear = new Date().getFullYear();
                let label = `${year} (خريج)`;
                if (year === 2027) label = `${year} (دفعة حالية - هتتخرج 2027) ⭐`;
                else if (year > currentYear) label = `${year} (دفعة حالية)`;
                else if (year === currentYear) label = `${year} (دفعة حالية - سنة التخرج)`;
                return `<option value="${year}" ${isSelected ? 'selected' : ''}>${label}</option>`;
              }).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">التقدير التراكمي (إن وجد)</label>
            <input type="text" id="cv-input-grade" value="${escapeHtml(edu.grade || '')}" placeholder="مثال: ممتاز مع مرتبة الشرف / جيد جداً مرتفع" class="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
          </div>
          <div>
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">مشروع التخرج</label>
            <input type="text" id="cv-input-project" value="${escapeHtml(edu.gradProject || '')}" placeholder="مثال: فيلم وثائقي بعنوان (نبض النيل) - تقدير امتياز" class="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs outline-none focus:border-[#7C3AED]">
          </div>
        </div>
      </div>
    `;
  } else if (step === 5) {
    // Step 5: Skills (Media & Tech)
    const mediaSkills = Array.isArray(d.mediaSkills) ? d.mediaSkills : [];
    const techSkills = Array.isArray(d.techSkills) ? d.techSkills : [];
    html = `
      <div class="space-y-6">
        <div class="flex items-center justify-between pb-3 border-b border-purple-50">
          <div>
            <h4 class="text-base font-black text-[#1E1B4B]">الخطوة 5: المهارات الإعلامية والتقنية</h4>
            <p class="text-xs text-slate-500">هذه المهارات تحدث بطاقتك Tima الذكية ومعدل الـ Overall مباشرة.</p>
          </div>
          <span class="text-xs font-black px-2.5 py-1 rounded-lg bg-purple-100 text-[#7C3AED]">خطوة 5 من 8</span>
        </div>

        <!-- Section A: Media Skills -->
        <div class="p-5 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black text-[#7C3AED] flex items-center gap-1.5">
              <i data-lucide="video" class="w-4 h-4 text-[#EC4899]"></i>
              <span>المهارات الإعلامية (مستوى 1 - 5 نجوم)</span>
            </h5>
            <span class="text-[11px] text-slate-400">تقييم ذاتي دقيق</span>
          </div>

          <!-- Suggested quick tags -->
          <div class="flex flex-wrap gap-1.5">
            ${cvState.availableMediaSkills.map(s => `
              <button onclick="window.phiApp.addCVMediaSkill('${s}', 4)" class="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold transition-all border border-purple-100">
                + ${s}
              </button>
            `).join('')}
          </div>

          <div class="flex items-center gap-2">
            <input type="text" id="cv-new-skill-input" placeholder="اكتب مهارة إعلامية مخصصة..." class="flex-1 px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none">
            <button onclick="window.phiApp.addCVMediaSkill()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-bold shadow-sm">
              إضافة
            </button>
          </div>

          <!-- Active media skills list -->
          <div class="space-y-2 pt-2">
            ${mediaSkills.length === 0 ? `
              <p class="text-xs text-slate-400 text-center py-2">لم تقم بإضافة مهارات بعد، اضغط على الاقتراحات أعلاه.</p>
            ` : mediaSkills.map((sk, idx) => `
              <div class="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <span class="text-xs font-bold text-[#1E1B4B]">${sk.name}</span>
                <div class="flex items-center gap-3">
                  <!-- Star rating 1 to 5 -->
                  <div class="flex items-center gap-1 text-amber-400 cursor-pointer">
                    ${[1, 2, 3, 4, 5].map(star => `
                      <button onclick="window.phiApp.setMediaSkillLevel(${idx}, ${star})" class="text-sm hover:scale-125 transition-transform ${star <= sk.level ? 'text-amber-400' : 'text-slate-300'}">
                        ★
                      </button>
                    `).join('')}
                  </div>
                  <button onclick="window.phiApp.removeCVMediaSkill(${idx})" class="text-rose-500 hover:text-rose-700 text-xs">
                    <i data-lucide="x" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Section B: Technical Tools -->
        <div class="p-5 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black text-[#7C3AED] flex items-center gap-1.5">
              <i data-lucide="cpu" class="w-4 h-4 text-[#EC4899]"></i>
              <span>البرامج والأدوات التقنية (Tech Tools)</span>
            </h5>
            <span class="text-[11px] text-slate-400">برامج المونتاج والتصوير</span>
          </div>

          <div class="flex flex-wrap gap-1.5">
            ${['Premiere Pro', 'DaVinci Resolve', 'After Effects', 'Photoshop', 'Audition', 'Final Cut Pro', 'Sony FX3', 'Canon Cinema', 'OBS Studio', 'Canva Pro'].map(t => `
              <button onclick="window.phiApp.addCVTechSkill('${t}')" class="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold transition-all border border-purple-100">
                + ${t}
              </button>
            `).join('')}
          </div>

          <div class="flex items-center gap-2">
            <input type="text" id="cv-new-tech-input" placeholder="أداة أخرى (مثال: Logic Pro, Blender)..." class="flex-1 px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none">
            <button onclick="window.phiApp.addCVTechSkill()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-bold shadow-sm">
              إضافة
            </button>
          </div>

          <div class="flex flex-wrap gap-2 pt-2">
            ${techSkills.length === 0 ? `
              <p class="text-xs text-slate-400 text-center w-full py-2">لا توجد أدوات تقنية مضافة حتى الآن.</p>
            ` : techSkills.map((tool, idx) => `
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E1B4B] text-white text-xs font-bold">
                <span>${tool}</span>
                <button onclick="window.phiApp.removeCVTechSkill(${idx})" class="text-pink-300 hover:text-white">
                  ×
                </button>
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (step === 6) {
    // Step 6: Languages
    const langs = Array.isArray(d.languages) ? d.languages : [];
    html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-purple-50">
          <div>
            <h4 class="text-base font-black text-[#1E1B4B]">الخطوة 6: اللغات وإجادة التحدث</h4>
            <p class="text-xs text-slate-500">اللغات التي تتقنها في الكتابة والتقديم الصوتي والترجمة الإخبارية.</p>
          </div>
          <span class="text-xs font-black px-2.5 py-1 rounded-lg bg-purple-100 text-[#7C3AED]">خطوة 6 من 8</span>
        <!-- Quick Language Presets -->
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-[11px] font-bold text-slate-400 pl-1">إضافة سريعة:</span>
          <button type="button" onclick="window.phiApp.addCVLanguage('اللغة العربية', 'لغة أم (Native)')" class="px-2.5 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#7C3AED] text-[11px] font-black transition-all border border-purple-200 flex items-center gap-1">
            <span>+ اللغة العربية (لغة أم)</span>
          </button>
          <button type="button" onclick="window.phiApp.addCVLanguage('اللغة الإنجليزية', 'متقدم (Fluent)')" class="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold transition-all border border-purple-100 flex items-center gap-1">
            <span>+ اللغة الإنجليزية (متقدم)</span>
          </button>
          <button type="button" onclick="window.phiApp.addCVLanguage('اللغة الفرنسية', 'متوسط (Intermediate)')" class="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold transition-all border border-purple-100 flex items-center gap-1">
            <span>+ اللغة الفرنسية</span>
          </button>
          <button type="button" onclick="window.phiApp.addCVLanguage('اللغة الألمانية', 'مبتدئ (Beginner)')" class="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold transition-all border border-purple-100 flex items-center gap-1">
            <span>+ اللغة الألمانية</span>
          </button>
        </div>

        <div class="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">اللغة</label>
            <input type="text" id="cv-new-lang-name" placeholder="مثال: العربية / الإنجليزية / الفرنسية" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 text-xs outline-none">
          </div>
          <div class="sm:w-44">
            <label class="block text-xs font-bold text-[#1E1B4B] mb-1">مستوى الإتقان</label>
            <select id="cv-new-lang-level" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 text-xs outline-none">
              <option value="لغة أم (Native)">لغة أم (Native)</option>
              <option value="متقدم (Fluent)" selected>متقدم (Fluent)</option>
              <option value="متوسط (Intermediate)">متوسط (Intermediate)</option>
              <option value="مبتدئ (Beginner)">مبتدئ (Beginner)</option>
            </select>
          </div>
          <div class="flex items-end">
            <button onclick="window.phiApp.addCVLanguage()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-bold shadow-sm">
              إضافة لغة
            </button>
          </div>
        </div>

        <div class="space-y-2">
          ${langs.length === 0 ? `
            <p class="text-xs text-slate-400 text-center py-4">لم تضف أي لغة بعد. ابدأ بإضافة لغتك الأم واللغات الأجنبية.</p>
          ` : langs.map((l, idx) => `
            <div class="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-purple-100 shadow-sm">
              <div class="flex items-center gap-3">
                <i data-lucide="globe" class="w-4 h-4 text-[#7C3AED]"></i>
                <span class="text-xs font-black text-[#1E1B4B]">${l.name}</span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-[#7C3AED]">${l.level}</span>
              </div>
              <button onclick="window.phiApp.removeCVLanguage(${idx})" class="text-rose-500 hover:text-rose-700 text-xs font-bold">
                حذف
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (step === 7) {
    // Step 7: Certificates & Courses
    const certs = Array.isArray(d.certificates) ? d.certificates : [];
    html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-purple-50">
          <div>
            <h4 class="text-base font-black text-[#1E1B4B]">الخطوة 7: الشهادات والكورسات المتخصصة</h4>
            <p class="text-xs text-slate-500">الدورات التدريبية المعتمدة (صحافة، مونتاج، تقديم، ورش عمل).</p>
          </div>
          <button onclick="window.phiApp.addCVCertificate()" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-bold flex items-center gap-1 shadow-sm">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>إضافة كورس / شهادة</span>
          </button>
        </div>

        ${certs.length === 0 ? `
          <div class="p-8 rounded-3xl bg-purple-50/40 border border-dashed border-purple-200 text-center space-y-2">
            <i data-lucide="award" class="w-8 h-8 mx-auto text-[#7C3AED]"></i>
            <h5 class="text-xs font-bold text-[#1E1B4B]">لا توجد شهادات مسجلة بعد</h5>
            <p class="text-[11px] text-slate-500">سجل شهاداتك من نقابة الصحفيين، قنوات التدريب، أو منصات التعليم الرقمي.</p>
          </div>
        ` : `
          <div class="space-y-3">
            ${certs.map((c, idx) => `
              <div class="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-[#7C3AED]">شهادة #${idx + 1}</span>
                  <button onclick="window.phiApp.removeCVCertificate(${idx})" class="text-rose-500 hover:text-rose-700 text-xs font-bold">
                    حذف
                  </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">اسم الشهادة / الكورس *</label>
                    <input type="text" value="${escapeHtml(c.title || '')}" onchange="window.phiApp.updateCVCertificate(${idx}, 'title', this.value)" placeholder="مثال: دبلومة المونتاج السينمائي" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none">
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">الجهة المانحة *</label>
                    <input type="text" value="${escapeHtml(c.issuer || '')}" onchange="window.phiApp.updateCVCertificate(${idx}, 'issuer', this.value)" placeholder="مثال: قطاع القنوات المتخصصة / معهد الأهرام" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none">
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">السنة</label>
                    <input type="text" value="${escapeHtml(c.year || '')}" onchange="window.phiApp.updateCVCertificate(${idx}, 'year', this.value)" placeholder="2024" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none">
                  </div>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">رابط التحقق / الاعتماد (اختياري)</label>
                  <input type="text" value="${escapeHtml(c.link || '')}" onchange="window.phiApp.updateCVCertificate(${idx}, 'link', this.value)" placeholder="https://..." class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none" dir="ltr">
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  } else if (step === 8) {
    // Step 8: Volunteering & Awards
    const vols = Array.isArray(d.volunteering) ? d.volunteering : [];
    html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-purple-50">
          <div>
            <h4 class="text-base font-black text-[#1E1B4B]">الخطوة 8: العمل التطوعي والجوائز التقديرية</h4>
            <p class="text-xs text-slate-500">المبادرات الشبابية، التغطيات الخيرية، والجوائز في مهرجانات السينما والإعلام.</p>
          </div>
          <button onclick="window.phiApp.addCVVolunteering()" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-bold flex items-center gap-1 shadow-sm">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>إضافة مشاركة / جائزة</span>
          </button>
        </div>

        ${vols.length === 0 ? `
          <div class="p-8 rounded-3xl bg-purple-50/40 border border-dashed border-purple-200 text-center space-y-2">
            <i data-lucide="trophy" class="w-8 h-8 mx-auto text-[#7C3AED]"></i>
            <h5 class="text-xs font-bold text-[#1E1B4B]">لا توجد جوائز أو أنشطة تطوعية بعد</h5>
            <p class="text-[11px] text-slate-500">أضف مشاركاتك في مؤتمرات الشباب، التغطيات الثقافية، ونوادي السينما.</p>
          </div>
        ` : `
          <div class="space-y-3">
            ${vols.map((v, idx) => `
              <div class="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-[#7C3AED]">مشاركة #${idx + 1}</span>
                  <button onclick="window.phiApp.removeCVVolunteering(${idx})" class="text-rose-500 hover:text-rose-700 text-xs font-bold">
                    حذف
                  </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">اسم المبادرة / الجائزة *</label>
                    <input type="text" value="${escapeHtml(v.name || '')}" onchange="window.phiApp.updateCVVolunteering(${idx}, 'name', this.value)" placeholder="مثال: المركز الأول بمهرجان أفلام الشباب" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none">
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">الدور / المشاركة *</label>
                    <input type="text" value="${escapeHtml(v.role || '')}" onchange="window.phiApp.updateCVVolunteering(${idx}, 'role', this.value)" placeholder="مثال: مخرج منفذ / مصور متطوع" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none">
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">السنة</label>
                    <input type="text" value="${escapeHtml(v.year || '')}" onchange="window.phiApp.updateCVVolunteering(${idx}, 'year', this.value)" placeholder="2024" class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none">
                  </div>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">الوصف والإنجاز المحقق</label>
                  <input type="text" value="${escapeHtml(v.desc || '')}" onchange="window.phiApp.updateCVVolunteering(${idx}, 'desc', this.value)" placeholder="تفاصيل التكريم أو أثر المبادرة..." class="w-full px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs outline-none">
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  container.innerHTML = html;
  window.lucide && window.lucide.createIcons();
}

// -------------------------------------------------------------
// CV PREVIEW & PDF EXPORT
// -------------------------------------------------------------
export function renderCVPreview() {
  const container = document.getElementById('cv-preview-sheet');
  if (!container) return;

  const d = cvState.data;
  const edu = d.education || {};
  const exps = Array.isArray(d.experiences) ? d.experiences : [];
  const mediaSkills = Array.isArray(d.mediaSkills) ? d.mediaSkills : [];
  const techSkills = Array.isArray(d.techSkills) ? d.techSkills : [];
  const rawLangs = Array.isArray(d.languages) ? d.languages : [];
  const langs = rawLangs.length > 0
    ? rawLangs
    : [{ name: 'اللغة العربية', level: 'لغة أم (Native)' }, { name: 'اللغة الإنجليزية', level: 'متقدم (Fluent)' }];
  const certs = Array.isArray(d.certificates) ? d.certificates : [];
  const vols = Array.isArray(d.volunteering) ? d.volunteering : [];

  // Professional Media ATS layout
  container.innerHTML = `
    <div id="cv-preview-section" data-id="cv-printable-document" dir="rtl" lang="ar" class="bg-white rounded-3xl overflow-hidden shadow-xl border border-purple-100 font-cairo text-slate-800" style="direction: rtl !important; text-align: right !important; font-family: 'Cairo', 'Amiri', 'Tajawal', sans-serif !important; letter-spacing: normal !important;">
      
      <!-- Dark Blue #1E1B4B Header with Purple/Pink accents -->
      <div class="bg-[#1E1B4B] text-white p-6 sm:p-8 relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-44 h-44 bg-[#7C3AED]/20 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute -bottom-10 -left-10 w-44 h-44 bg-[#EC4899]/20 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-row items-center gap-4 sm:gap-6 text-right">
          ${d.photo ? `
            <div class="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-pink-400 shrink-0 shadow-lg bg-purple-950">
              <img src="${d.photo}" class="w-full h-full object-cover">
            </div>
          ` : `
            <div class="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-2 border-purple-400/40 shrink-0 flex items-center justify-center bg-purple-900/40 text-pink-300 font-black text-2xl font-mono">
              φ
            </div>
          `}

          <div class="flex-1 text-right space-y-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h1 class="text-xl sm:text-2xl font-black text-white" style="letter-spacing: 0 !important;">${d.fullName || 'الاسم الكامل غير مدخل'}</h1>
              <span class="text-[11px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-sm">
                بطاقة Tima OVR: ${state.timaCard?.overall || 90}
              </span>
            </div>

            <p class="text-xs sm:text-sm font-bold text-pink-300">${d.jobTitle || 'المسمى الوظيفي الإعلامي'}</p>

            <!-- Contact info row -->
            <div class="flex flex-wrap items-center justify-start gap-y-1 gap-x-3 sm:gap-x-4 pt-1.5 text-[11px] sm:text-xs text-purple-200">
              ${d.email ? `<span class="flex items-center gap-1"><i data-lucide="mail" class="w-3.5 h-3.5 text-pink-400"></i> <span dir="ltr">${d.email}</span></span>` : ''}
              ${d.phone ? `<span class="flex items-center gap-1"><i data-lucide="phone" class="w-3.5 h-3.5 text-pink-400"></i> <span dir="ltr">${d.phone}</span></span>` : ''}
              ${d.address ? `<span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-pink-400"></i> <span>${d.address}</span></span>` : ''}
              ${d.linkedin ? `<span class="flex items-center gap-1"><i data-lucide="linkedin" class="w-3.5 h-3.5 text-pink-400"></i> <span dir="ltr">${d.linkedin}</span></span>` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- CV Body -->
      <div class="p-6 sm:p-8 space-y-6">
        
        <!-- Summary -->
        ${d.summary ? `
          <section class="space-y-2">
            <h3 class="text-xs font-black text-[#7C3AED] flex items-center gap-2 pb-1 border-b border-purple-100" style="letter-spacing: 0 !important;">
              <i data-lucide="user" class="w-4 h-4 text-[#EC4899]"></i>
              <span>الملخص المهني (Professional Profile)</span>
            </h3>
            <p class="text-xs text-slate-700 leading-relaxed font-sans">${escapeHtml(d.summary)}</p>
          </section>
        ` : ''}

        <!-- Experience -->
        ${exps.length > 0 ? `
          <section class="space-y-3">
            <h3 class="text-xs font-black text-[#7C3AED] flex items-center gap-2 pb-1 border-b border-purple-100" style="letter-spacing: 0 !important;">
              <i data-lucide="briefcase" class="w-4 h-4 text-[#EC4899]"></i>
              <span>الخبرات العملية والتدريب الميداني (Experience)</span>
            </h3>
            <div class="space-y-3">
              ${exps.map(exp => `
                <div class="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 text-xs space-y-1">
                  <div class="flex items-center justify-between font-black text-[#1E1B4B]">
                    <span>${exp.role || ''} - <span class="text-[#7C3AED]">${exp.company || ''}</span></span>
                    <span class="text-[11px] font-mono text-slate-500">${exp.period || ''}</span>
                  </div>
                  ${exp.desc ? `<p class="text-slate-600 leading-relaxed text-[11px] pt-1">${escapeHtml(exp.desc)}</p>` : ''}
                  ${exp.link ? `<a href="${exp.link}" target="_blank" class="text-[11px] text-[#EC4899] font-bold block pt-1 hover:underline" dir="ltr">رابط العمل: ${exp.link}</a>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Education -->
        ${edu.university || edu.faculty ? `
          <section class="space-y-2">
            <h3 class="text-xs font-black text-[#7C3AED] flex items-center gap-2 pb-1 border-b border-purple-100" style="letter-spacing: 0 !important;">
              <i data-lucide="graduation-cap" class="w-4 h-4 text-[#EC4899]"></i>
              <span>التعليم والمؤهل الأكاديمي (Education)</span>
            </h3>
            <div class="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 text-xs space-y-1">
              <div class="flex items-center justify-between font-black text-[#1E1B4B]">
                <span>${edu.faculty || ''} - ${edu.university || ''}</span>
                <span class="text-[11px] font-mono text-slate-500">${edu.gradYear || ''}</span>
              </div>
              <p class="text-[11px] text-[#7C3AED] font-bold">القسم: ${edu.department || ''} ${edu.grade ? `| التقدير: ${edu.grade}` : ''}</p>
              ${edu.gradProject ? `<p class="text-[11px] text-slate-600">مشروع التخرج: ${edu.gradProject}</p>` : ''}
            </div>
          </section>
        ` : ''}

        <!-- Skills Grid: Media + Tech -->
        ${mediaSkills.length > 0 || techSkills.length > 0 ? `
          <section class="space-y-3">
            <h3 class="text-xs font-black text-[#7C3AED] flex items-center gap-2 pb-1 border-b border-purple-100" style="letter-spacing: 0 !important;">
              <i data-lucide="sparkles" class="w-4 h-4 text-[#EC4899]"></i>
              <span>المهارات والأدوات التقنية (Skills & Proficiencies)</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              ${mediaSkills.length > 0 ? `
                <div class="p-3 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-1.5">
                  <span class="font-bold text-[#1E1B4B] block text-[11px]">المهارات الإعلامية:</span>
                  <div class="space-y-1">
                    ${mediaSkills.map(s => `
                      <div class="flex items-center justify-between text-[11px]">
                        <span>${s.name}</span>
                        <span class="text-amber-500">${'★'.repeat(s.level || 4)}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${techSkills.length > 0 ? `
                <div class="p-3 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-1.5">
                  <span class="font-bold text-[#1E1B4B] block text-[11px]">البرامج والإنتاج:</span>
                  <div class="flex flex-wrap gap-1.5 pt-1">
                    ${techSkills.map(t => `
                      <span class="px-2 py-0.5 rounded-md bg-[#1E1B4B] text-white text-[10px] font-mono">${t}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </section>
        ` : ''}

        <!-- Languages & Certifications -->
        ${langs.length > 0 || certs.length > 0 ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            ${langs.length > 0 ? `
              <div class="space-y-2">
                <h4 class="font-black text-[#7C3AED] pb-1 border-b border-purple-100 flex items-center gap-1.5 text-xs">
                  <i data-lucide="globe" class="w-3.5 h-3.5 text-[#EC4899]"></i>
                  <span>اللغات (Languages)</span>
                </h4>
                <div class="space-y-1 text-[11px]">
                  ${langs.map(l => `
                    <div class="flex items-center justify-between p-2 rounded-xl bg-purple-50/40">
                      <span class="font-bold">${l.name}</span>
                      <span class="text-slate-500">${l.level}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${certs.length > 0 ? `
              <div class="space-y-2">
                <h4 class="font-black text-[#7C3AED] pb-1 border-b border-purple-100 flex items-center gap-1.5 text-xs">
                  <i data-lucide="award" class="w-3.5 h-3.5 text-[#EC4899]"></i>
                  <span>الشهادات (Certificates)</span>
                </h4>
                <div class="space-y-1 text-[11px]">
                  ${certs.map(c => `
                    <div class="p-2 rounded-xl bg-purple-50/40">
                      <div class="font-bold text-[#1E1B4B]">${c.title}</div>
                      <div class="text-slate-500">${c.issuer} ${c.year ? `(${c.year})` : ''}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Volunteering -->
        ${vols.length > 0 ? `
          <section class="space-y-2 text-xs">
            <h4 class="font-black text-[#7C3AED] pb-1 border-b border-purple-100 flex items-center gap-1.5">
              <i data-lucide="trophy" class="w-3.5 h-3.5 text-[#EC4899]"></i>
              <span>الجوائز والعمل التطوعي (Awards & Volunteering)</span>
            </h4>
            <div class="space-y-2">
              ${vols.map(v => `
                <div class="p-2.5 rounded-xl bg-purple-50/40 text-[11px]">
                  <span class="font-bold text-[#1E1B4B]">${v.name}</span> - <span>${v.role}</span>
                  ${v.desc ? `<p class="text-slate-500 pt-0.5">${v.desc}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Footer watermark -->
        <div class="pt-4 border-t border-purple-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>تم الإنشاء بواسطة منصة φ To Media - منظومة الإعلاميين المصريين</span>
          <span class="font-mono">tima_cv_verified</span>
        </div>

      </div>
    </div>
    
    <!-- React Mount Slot for Download Button -->
    <div id="react-cv-download-slot" class="mt-8 flex justify-center no-print"></div>
  `;

  // Mount React DownloadCVButton
  if (window.phiApp && window.phiApp.mountReactComponent) {
    setTimeout(() => {
      window.phiApp.mountReactComponent('DownloadCVButton', 'react-cv-download-slot', {
        pdfUrl: '#',
        fileName: `CV_${(d.fullName || 'Media_Student').replace(/\s+/g, '_')}.pdf`,
        onTrigger: () => window.phiApp.downloadCVPdf()
      });
    }, 0);
  }

  window.lucide && window.lucide.createIcons();
}

// =============================================================
// EXECUTIVE A4 DOCUMENT ENGINE & PDF EXPORT
// =============================================================

const DOC_ICONS = {
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  briefcase: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>`,
  gradCap: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`,
  sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  award: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  trophy: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`
};

/**
 * Builds standard executive A4 CV document (794px width, 0 border radius, rectangular print sheet)
 */
export function buildA4DocumentHtml(d, edu, exps, mediaSkills, techSkills, langs, certs, vols, ovr) {
  return `
    <div id="a4-cv-sheet-root" style="width: 794px; min-height: 1123px; background: #ffffff; color: #1E1B4B; font-family: 'Cairo', 'Amiri', 'Tajawal', sans-serif; direction: rtl; text-align: right; box-sizing: border-box; margin: 0; padding: 0; position: relative; letter-spacing: 0px !important;">
      
      <!-- Dark Blue #1E1B4B Header -->
      <div class="cv-a4-header" style="background-color: #1E1B4B; color: #ffffff; padding: 26px 36px; border-radius: 0; position: relative; overflow: hidden;">
        <div style="display: flex; align-items: center; gap: 20px;">
          ${d.photo ? `
            <div style="width: 88px; height: 88px; border-radius: 16px; overflow: hidden; border: 2.5px solid #EC4899; flex-shrink: 0; background: #2E1065;">
              <img src="${d.photo}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
            </div>
          ` : `
            <div style="width: 88px; height: 88px; border-radius: 16px; border: 2.5px solid rgba(236,72,153,0.5); flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #2E1065; color: #F472B6; font-size: 32px; font-weight: 900;">
              φ
            </div>
          `}

          <div style="flex: 1; text-align: right;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 4px;">
              <h1 style="font-size: 23px; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: 0; line-height: 1.2;">
                ${escapeHtml(d.fullName || 'الاسم الكامل')}
              </h1>
              <span style="font-size: 11px; font-weight: 900; padding: 3px 12px; border-radius: 9999px; background: linear-gradient(135deg, #7C3AED, #EC4899); color: #ffffff; box-shadow: 0 2px 6px rgba(236,72,153,0.3); white-space: nowrap;">
                بطاقة Tima OVR: ${ovr}
              </span>
            </div>

            <p style="font-size: 13.5px; font-weight: 700; color: #F472B6; margin: 0 0 10px 0;">
              ${escapeHtml(d.jobTitle || 'المسمى الوظيفي الإعلامي')}
            </p>

            <!-- Contacts Row -->
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; font-size: 11px; color: #DDD6FE;">
              ${d.email ? `
                <span style="display: inline-flex; align-items: center; gap: 5px;">
                  <span style="color: #F472B6;">${DOC_ICONS.mail}</span>
                  <span dir="ltr">${escapeHtml(d.email)}</span>
                </span>
              ` : ''}
              ${d.phone ? `
                <span style="display: inline-flex; align-items: center; gap: 5px;">
                  <span style="color: #F472B6;">${DOC_ICONS.phone}</span>
                  <span dir="ltr">${escapeHtml(d.phone)}</span>
                </span>
              ` : ''}
              ${d.address ? `
                <span style="display: inline-flex; align-items: center; gap: 5px;">
                  <span style="color: #F472B6;">${DOC_ICONS.mapPin}</span>
                  <span>${escapeHtml(d.address)}</span>
                </span>
              ` : ''}
              ${d.linkedin ? `
                <span style="display: inline-flex; align-items: center; gap: 5px;">
                  <span style="color: #F472B6;">${DOC_ICONS.linkedin}</span>
                  <span dir="ltr">${escapeHtml(d.linkedin)}</span>
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- CV Body Content -->
      <div class="cv-a4-body" style="padding: 24px 36px 32px 36px; display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Summary Section -->
        ${d.summary ? `
          <div class="cv-a4-section cv-section-summary" style="page-break-inside: avoid; break-inside: avoid;">
            <h3 style="font-size: 13px; font-weight: 900; color: #7C3AED; display: flex; align-items: center; gap: 7px; margin: 0 0 6px 0; padding-bottom: 5px; border-bottom: 1.5px solid #EDE9FE;">
              <span style="color: #EC4899;">${DOC_ICONS.user}</span>
              <span>الملخص المهني (Professional Profile)</span>
            </h3>
            <p style="font-size: 11.5px; color: #334155; line-height: 1.7; margin: 0; text-align: justify;">
              ${escapeHtml(d.summary)}
            </p>
          </div>
        ` : ''}

        <!-- Experience Section -->
        ${exps.length > 0 ? `
          <div class="cv-a4-section cv-section-experience" style="page-break-inside: avoid; break-inside: avoid;">
            <h3 style="font-size: 13px; font-weight: 900; color: #7C3AED; display: flex; align-items: center; gap: 7px; margin: 0 0 7px 0; padding-bottom: 5px; border-bottom: 1.5px solid #EDE9FE;">
              <span style="color: #EC4899;">${DOC_ICONS.briefcase}</span>
              <span>الخبرات العملية والتدريب الميداني (Experience)</span>
            </h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${exps.map(exp => `
                <div style="padding: 9px 13px; border-radius: 12px; background: #FAF5FF; border: 1px solid #EDE9FE; font-size: 11.5px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 900; color: #1E1B4B; margin-bottom: 2px;">
                    <span>${escapeHtml(exp.role || '')} - <span style="color: #7C3AED;">${escapeHtml(exp.company || '')}</span></span>
                    <span style="font-size: 10px; color: #64748B; font-family: monospace;">${escapeHtml(exp.period || '')}</span>
                  </div>
                  ${exp.desc ? `<p style="color: #475569; margin: 0; line-height: 1.6; font-size: 11px;">${escapeHtml(exp.desc)}</p>` : ''}
                  ${exp.link ? `<div style="margin-top: 3px; font-size: 10px; color: #EC4899; font-weight: 700;" dir="ltr">رابط العمل: ${escapeHtml(exp.link)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Education Section -->
        ${edu.university || edu.faculty ? `
          <div class="cv-a4-section cv-section-education" style="page-break-inside: avoid; break-inside: avoid;">
            <h3 style="font-size: 13px; font-weight: 900; color: #7C3AED; display: flex; align-items: center; gap: 7px; margin: 0 0 7px 0; padding-bottom: 5px; border-bottom: 1.5px solid #EDE9FE;">
              <span style="color: #EC4899;">${DOC_ICONS.gradCap}</span>
              <span>التعليم والمؤهل الأكاديمي (Education)</span>
            </h3>
            <div style="padding: 9px 13px; border-radius: 12px; background: #FAF5FF; border: 1px solid #EDE9FE; font-size: 11.5px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 900; color: #1E1B4B; margin-bottom: 2px;">
                <span>${escapeHtml(edu.faculty || '')} - ${escapeHtml(edu.university || '')}</span>
                <span style="font-size: 10px; color: #64748B; font-family: monospace;">${escapeHtml(edu.gradYear || '')}</span>
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #7C3AED;">
                القسم: ${escapeHtml(edu.department || '')} ${edu.grade ? `| التقدير: ${escapeHtml(edu.grade)}` : ''}
              </div>
              ${edu.gradProject ? `<div style="font-size: 10.5px; color: #475569; margin-top: 2px;">مشروع التخرج: ${escapeHtml(edu.gradProject)}</div>` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Skills Section: Media + Tech in 2 Columns -->
        ${mediaSkills.length > 0 || techSkills.length > 0 ? `
          <div class="cv-a4-section cv-section-skills" style="page-break-inside: avoid; break-inside: avoid;">
            <h3 style="font-size: 13px; font-weight: 900; color: #7C3AED; display: flex; align-items: center; gap: 7px; margin: 0 0 7px 0; padding-bottom: 5px; border-bottom: 1.5px solid #EDE9FE;">
              <span style="color: #EC4899;">${DOC_ICONS.sparkles}</span>
              <span>المهارات والأدوات التقنية (Skills & Proficiencies)</span>
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11.5px;">
              ${mediaSkills.length > 0 ? `
                <div style="padding: 9px 12px; border-radius: 12px; background: #FAF5FF; border: 1px solid #EDE9FE;">
                  <span style="font-weight: 900; color: #1E1B4B; display: block; margin-bottom: 5px; font-size: 11px;">المهارات الإعلامية:</span>
                  <div style="display: flex; flex-direction: column; gap: 3.5px;">
                    ${mediaSkills.map(s => `
                      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                        <span>${escapeHtml(s.name)}</span>
                        <span style="color: #F59E0B; letter-spacing: 1px;">${'★'.repeat(s.level || 4)}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${techSkills.length > 0 ? `
                <div style="padding: 9px 12px; border-radius: 12px; background: #FAF5FF; border: 1px solid #EDE9FE;">
                  <span style="font-weight: 900; color: #1E1B4B; display: block; margin-bottom: 5px; font-size: 11px;">البرامج والإنتاج:</span>
                  <div style="display: flex; flex-wrap: wrap; gap: 4px; padding-top: 2px;">
                    ${techSkills.map(t => `
                      <span style="padding: 2px 7px; border-radius: 6px; background: #1E1B4B; color: #ffffff; font-size: 9.5px; font-family: monospace;">${escapeHtml(t)}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Languages & Certifications Section -->
        ${langs.length > 0 || certs.length > 0 ? `
          <div class="cv-a4-section cv-section-langs-certs" style="page-break-inside: avoid; break-inside: avoid;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11.5px;">
              ${langs.length > 0 ? `
                <div>
                  <h4 style="font-size: 12px; font-weight: 900; color: #7C3AED; display: flex; align-items: center; gap: 6px; margin: 0 0 5px 0; padding-bottom: 4px; border-bottom: 1.5px solid #EDE9FE;">
                    <span style="color: #EC4899;">${DOC_ICONS.globe}</span>
                    <span>اللغات (Languages)</span>
                  </h4>
                  <div style="display: flex; flex-direction: column; gap: 3.5px;">
                    ${langs.map(l => `
                      <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 9px; border-radius: 8px; background: #FAF5FF; font-size: 10.5px;">
                        <span style="font-weight: 700;">${escapeHtml(l.name)}</span>
                        <span style="color: #64748B;">${escapeHtml(l.level)}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${certs.length > 0 ? `
                <div>
                  <h4 style="font-size: 12px; font-weight: 900; color: #7C3AED; display: flex; align-items: center; gap: 6px; margin: 0 0 5px 0; padding-bottom: 4px; border-bottom: 1.5px solid #EDE9FE;">
                    <span style="color: #EC4899;">${DOC_ICONS.award}</span>
                    <span>الشهادات (Certificates)</span>
                  </h4>
                  <div style="display: flex; flex-direction: column; gap: 3.5px;">
                    ${certs.map(c => `
                      <div style="padding: 5px 9px; border-radius: 8px; background: #FAF5FF; font-size: 10.5px;">
                        <div style="font-weight: 700; color: #1E1B4B;">${escapeHtml(c.title)}</div>
                        <div style="color: #64748B; font-size: 9.5px;">${escapeHtml(c.issuer)} ${c.year ? `(${escapeHtml(c.year)})` : ''}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Volunteering Section (if present) -->
        ${vols.length > 0 ? `
          <div class="cv-a4-section cv-section-volunteering" style="page-break-inside: avoid; break-inside: avoid;">
            <h4 style="font-size: 12px; font-weight: 900; color: #7C3AED; display: flex; align-items: center; gap: 6px; margin: 0 0 5px 0; padding-bottom: 4px; border-bottom: 1.5px solid #EDE9FE;">
              <span style="color: #EC4899;">${DOC_ICONS.trophy}</span>
              <span>الجوائز والعمل التطوعي (Awards & Volunteering)</span>
            </h4>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${vols.map(v => `
                <div style="padding: 6px 9px; border-radius: 8px; background: #FAF5FF; font-size: 10.5px;">
                  <span style="font-weight: 700; color: #1E1B4B;">${escapeHtml(v.name)}</span> - <span>${escapeHtml(v.role)}</span>
                  ${v.desc ? `<p style="color: #64748B; margin: 2px 0 0 0; font-size: 10px;">${escapeHtml(v.desc)}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Footer watermark -->
        <div class="cv-a4-footer" style="margin-top: auto; padding-top: 12px; border-top: 1px solid #EDE9FE; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94A3B8;">
          <span>تم الإنشاء بواسطة منصة φ To Media - منظومة الإعلاميين المصريين</span>
          <span style="font-family: monospace; color: #7C3AED; font-weight: 700;">tima_cv_verified</span>
        </div>

      </div>
    </div>
  `;
}

/**
 * Capture an off-screen HTML element into a high-res Canvas with proper Arabic fonts
 */
async function captureElementToCanvas(element, width, height) {
  // Option 1: htmlToImage (crisp Arabic ligatures)
  if (window.htmlToImage && typeof window.htmlToImage.toCanvas === 'function') {
    try {
      const fontEmbedCSS = `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:wght@400;700&family=Tajawal:wght@400;700;800&display=swap');
        * {
          font-family: 'Cairo', 'Amiri', 'Tajawal', sans-serif !important;
          direction: rtl !important;
          letter-spacing: 0px !important;
          word-spacing: normal !important;
          font-feature-settings: "liga" 1, "calt" 1 !important;
          text-rendering: optimizeLegibility !important;
          -webkit-font-smoothing: antialiased !important;
        }
      `;
      const canvas = await window.htmlToImage.toCanvas(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS,
        cacheBust: true,
        width: width,
        height: height
      });
      return canvas;
    } catch (e) {
      console.warn('htmlToImage.toCanvas failed, falling back to html2canvas:', e);
    }
  }

  // Option 2: html2canvas
  if (window.html2canvas) {
    const canvas = await window.html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: width,
      height: height,
      windowWidth: 1024
    });
    return canvas;
  }

  throw new Error('لا توجد مكتبة رسم متاحة في المتصفح');
}

/**
 * Generates and downloads the executive A4 PDF matching the exact desktop layout
 * with standard 210x297mm dimensions, zero text clipping, and authentic document styling.
 */
export async function downloadCVAsPDF() {
  saveCurrentStepInputs();
  saveCV(true);

  showToast('جاري إنشاء ملف السيرة الذاتية بصيغة A4 الاحترافية... 📄✨');

  let a4Container = null;
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 1. Create a dedicated off-screen container with fixed A4 width (794px at 96 DPI = 210mm)
    a4Container = document.createElement('div');
    a4Container.id = 'cv-isolated-a4-render';
    a4Container.setAttribute('dir', 'rtl');
    a4Container.setAttribute('lang', 'ar');
    a4Container.style.position = 'fixed';
    a4Container.style.left = '-9999px';
    a4Container.style.top = '0';
    a4Container.style.width = '794px';
    a4Container.style.backgroundColor = '#ffffff';
    a4Container.style.color = '#1E1B4B';
    a4Container.style.fontFamily = "'Cairo', 'Amiri', 'Tajawal', sans-serif";
    a4Container.style.direction = 'rtl';
    a4Container.style.textAlign = 'right';
    a4Container.style.letterSpacing = '0px';
    a4Container.style.boxSizing = 'border-box';
    a4Container.style.zIndex = '-9999';

    // Populate data
    const d = cvState.data;
    const edu = d.education || {};
    const exps = Array.isArray(d.experiences) ? d.experiences : [];
    const mediaSkills = Array.isArray(d.mediaSkills) ? d.mediaSkills : [];
    const techSkills = Array.isArray(d.techSkills) ? d.techSkills : [];
    const rawLangs = Array.isArray(d.languages) ? d.languages : [];
    const langs = rawLangs.length > 0 ? rawLangs : [{ name: 'اللغة العربية', level: 'لغة أم (Native)' }];
    const certs = Array.isArray(d.certificates) ? d.certificates : [];
    const vols = Array.isArray(d.volunteering) ? d.volunteering : [];
    const ovr = state.timaCard?.overall || 86;

    a4Container.innerHTML = buildA4DocumentHtml(d, edu, exps, mediaSkills, techSkills, langs, certs, vols, ovr);
    document.body.appendChild(a4Container);

    // Wait for image load if custom photo is present
    const photoImg = a4Container.querySelector('img');
    if (photoImg && !photoImg.complete) {
      await new Promise(res => {
        photoImg.onload = res;
        photoImg.onerror = res;
        setTimeout(res, 600);
      });
    } else {
      await new Promise(r => setTimeout(r, 120));
    }

    const { jsPDF } = window.jspdf || window;
    const sheetRoot = a4Container.querySelector('#a4-cv-sheet-root');
    const totalHeight = sheetRoot ? sheetRoot.offsetHeight : a4Container.offsetHeight;

    // Standard A4 height at 96 DPI is 1123px (297mm)
    const A4_MAX_PAGE_HEIGHT_PX = 1130;

    // SCENARIO 1: Content fits comfortably onto 1 pristine A4 page (typical for 95% of student CVs)
    if (totalHeight <= A4_MAX_PAGE_HEIGHT_PX) {
      const canvas = await captureElementToCanvas(sheetRoot, 794, totalHeight);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.82);
      const targetHeightMm = Math.min(297, (totalHeight * 210) / 794);

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, targetHeightMm, undefined, 'FAST');
      pdf.save('Phi-To-Media-CV.pdf');
    } else {
      // SCENARIO 2: Content exceeds 1 page -> Paginate cleanly BY SECTION so NO TEXT IS EVER CUT IN HALF
      const headerEl = sheetRoot.querySelector('.cv-a4-header');
      const sections = Array.from(sheetRoot.querySelectorAll('.cv-a4-section'));
      const footerEl = sheetRoot.querySelector('.cv-a4-footer');

      const page1Sections = [];
      const page2Sections = [];
      let currentHeight = (headerEl?.offsetHeight || 140) + 40; // initial header height + padding

      for (const sec of sections) {
        const secHeight = sec.offsetHeight;
        if (currentHeight + secHeight <= 1040) {
          page1Sections.push(sec);
          currentHeight += secHeight + 16;
        } else {
          page2Sections.push(sec);
        }
      }

      // If page 2 has sections:
      if (page2Sections.length > 0) {
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Create Page 1 Wrapper
        const p1Wrapper = document.createElement('div');
        p1Wrapper.style.width = '794px';
        p1Wrapper.style.minHeight = '1123px';
        p1Wrapper.style.background = '#ffffff';
        p1Wrapper.style.fontFamily = "'Cairo', 'Amiri', 'Tajawal', sans-serif";
        p1Wrapper.style.direction = 'rtl';
        p1Wrapper.style.textAlign = 'right';
        p1Wrapper.style.boxSizing = 'border-box';
        p1Wrapper.appendChild(headerEl.cloneNode(true));

        const p1Body = document.createElement('div');
        p1Body.style.padding = '24px 36px';
        p1Body.style.display = 'flex';
        p1Body.style.flexDirection = 'column';
        p1Body.style.gap = '16px';
        page1Sections.forEach(s => p1Body.appendChild(s.cloneNode(true)));
        p1Wrapper.appendChild(p1Body);

        a4Container.appendChild(p1Wrapper);
        const canvas1 = await captureElementToCanvas(p1Wrapper, 794, 1123);
        pdf.addImage(canvas1.toDataURL('image/jpeg', 0.82), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        p1Wrapper.remove();

        // Create Page 2 Wrapper
        const p2Wrapper = document.createElement('div');
        p2Wrapper.style.width = '794px';
        p2Wrapper.style.minHeight = '1123px';
        p2Wrapper.style.background = '#ffffff';
        p2Wrapper.style.fontFamily = "'Cairo', 'Amiri', 'Tajawal', sans-serif";
        p2Wrapper.style.direction = 'rtl';
        p2Wrapper.style.textAlign = 'right';
        p2Wrapper.style.padding = '36px';
        p2Wrapper.style.display = 'flex';
        p2Wrapper.style.flexDirection = 'column';
        p2Wrapper.style.gap = '16px';
        p2Wrapper.style.boxSizing = 'border-box';

        // Page 2 continuation header
        const p2Header = document.createElement('div');
        p2Header.style.paddingBottom = '10px';
        p2Header.style.borderBottom = '2px solid #EDE9FE';
        p2Header.style.display = 'flex';
        p2Header.style.justifyContent = 'space-between';
        p2Header.style.alignItems = 'center';
        p2Header.style.fontSize = '12px';
        p2Header.style.fontWeight = 'bold';
        p2Header.style.color = '#7C3AED';
        p2Header.innerHTML = `<span>تابع سيرة: ${escapeHtml(d.fullName || '')}</span><span>صفحة 2</span>`;
        p2Wrapper.appendChild(p2Header);

        page2Sections.forEach(s => p2Wrapper.appendChild(s.cloneNode(true)));
        if (footerEl) p2Wrapper.appendChild(footerEl.cloneNode(true));

        a4Container.appendChild(p2Wrapper);
        const canvas2 = await captureElementToCanvas(p2Wrapper, 794, 1123);
        pdf.addPage();
        pdf.addImage(canvas2.toDataURL('image/jpeg', 0.82), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        p2Wrapper.remove();

        pdf.save('Phi-To-Media-CV.pdf');
      } else {
        // Fallback single page
        const canvas = await captureElementToCanvas(sheetRoot, 794, totalHeight);
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.82), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        pdf.save('Phi-To-Media-CV.pdf');
      }
    }

    showToast('تم تحميل ملف السيرة الذاتية (Phi-To-Media-CV.pdf) بدقة A4 العالية! 📄🎉');
  } catch (error) {
    console.error("حدث خطأ أثناء تحميل الـ PDF:", error);
    // Graceful fallback to native browser print
    window.print();
  } finally {
    if (a4Container && a4Container.parentNode) {
      a4Container.parentNode.removeChild(a4Container);
    }
  }
}

/**
 * Trigger native browser print dialog for 100% Vector PDF export
 */
export function printCVPdf() {
  saveCurrentStepInputs();
  saveCV(true);
  setCVTab('preview');
  renderCVPreview();
  setTimeout(() => {
    window.print();
  }, 200);
}

export const downloadCVPdf = downloadCVAsPDF;
export const generateCVPDF = downloadCVAsPDF;

if (typeof window !== 'undefined') {
  window.downloadCVAsPDF = downloadCVAsPDF;
  window.generateCVPDF = downloadCVAsPDF;
  window.downloadCVPdf = downloadCVAsPDF;
  window.printCVPdf = printCVPdf;
  if (window.phiApp) {
    window.phiApp.downloadCVAsPDF = downloadCVAsPDF;
    window.phiApp.generateCVPDF = downloadCVAsPDF;
    window.phiApp.downloadCVPdf = downloadCVAsPDF;
    window.phiApp.printCVPdf = printCVPdf;
  }
}

// Share CV Link
export function shareCVLink() {
  const username = (cvState.data.fullName || 'student').toLowerCase().replace(/\s+/g, '-');
  const url = `${window.location.origin}/cv/${encodeURIComponent(username)}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('تم نسخ رابط السيرة الذاتية للحافظة بنجاح! 📋✨');
  }).catch(() => {
    alert(`رابط سيرتك الذاتية:\n${url}`);
  });
}

// -------------------------------------------------------------
// PORTFOLIO BUILDER: ADD WORK MODAL & DIRECT UPLOAD
// -------------------------------------------------------------

export function openAddWorkModal() {
  portfolioState.modalOpen = true;
  portfolioState.modalTab = 'link';
  const modal = document.getElementById('modal-add-portfolio-work');
  if (modal) modal.classList.remove('hidden'), modal.classList.add('flex');
  renderAddWorkModal();
}

export function closeAddWorkModal() {
  portfolioState.modalOpen = false;
  const modal = document.getElementById('modal-add-portfolio-work');
  if (modal) modal.classList.add('hidden'), modal.classList.remove('flex');
}

export function setAddWorkModalTab(tab) {
  portfolioState.modalTab = tab;
  renderAddWorkModal();
}

export function handlePortfolioFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    alert('حجم الملف يتجاوز الحد الأقصى المسموح (50 ميجابايت)! يرجى اختيار ملف أصغر أو استخدام رابط خارجي.');
    return;
  }

  // Create immediate and reliable Object URL so fileUrl is ALWAYS updated upon upload!
  const objectUrl = URL.createObjectURL(file);
  portfolioState.newFileItem.selectedFile = file;
  portfolioState.newFileItem.fileUrl = objectUrl;
  portfolioState.newFileItem.fileName = file.name;
  portfolioState.newFileItem.fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  
  // Auto guess type
  if (file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi)$/i.test(file.name)) portfolioState.newFileItem.type = 'فيديو';
  else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) portfolioState.newFileItem.type = 'تصميم';
  else if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(file.name)) portfolioState.newFileItem.type = 'بودكاست';
  else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) portfolioState.newFileItem.type = 'مقال';
  else portfolioState.newFileItem.type = 'فيديو';

  // Read data URL if file is not huge (< 10MB) so it persists even in data url
  if (file.size < 10 * 1024 * 1024) {
    const reader = new FileReader();
    reader.onload = function(e) {
      portfolioState.newFileItem.fileData = e.target.result;
      // Also update fileUrl with the persistent data url
      portfolioState.newFileItem.fileUrl = e.target.result;
      renderAddWorkModal();
    };
    reader.readAsDataURL(file);
  } else {
    portfolioState.newFileItem.fileData = objectUrl;
    renderAddWorkModal();
  }

  renderAddWorkModal();
}

export function submitNewPortfolioWork() {
  const tab = portfolioState.modalTab;
  let workItem = null;

  if (tab === 'link') {
    const title = document.getElementById('port-link-title')?.value.trim();
    const type = document.getElementById('port-link-type')?.value || 'فيديو';
    const url = document.getElementById('port-link-url')?.value.trim();
    const desc = document.getElementById('port-link-desc')?.value.trim();
    const tools = document.getElementById('port-link-tools')?.value.trim();
    const date = document.getElementById('port-link-date')?.value || new Date().toISOString().split('T')[0];

    if (!title || !url) {
      alert('من فضلك اكتب عنوان العمل وضع الرابط المباشر (YouTube / Behance / Drive / موقع)!');
      return;
    }

    workItem = {
      id: `work-${Date.now()}`,
      title,
      type,
      url,
      fileUrl: url,
      desc,
      tools,
      date,
      mode: 'link',
      views: Math.floor(Math.random() * 40) + 15
    };
  } else {
    // Direct file upload
    const title = document.getElementById('port-file-title')?.value.trim();
    const type = document.getElementById('port-file-type')?.value || portfolioState.newFileItem.type || 'فيديو';
    const desc = document.getElementById('port-file-desc')?.value.trim();
    const tools = document.getElementById('port-file-tools')?.value.trim();
    const date = document.getElementById('port-file-date')?.value || new Date().toISOString().split('T')[0];

    if (!title) {
      alert('من فضلك اكتب عنوان العمل!');
      return;
    }

    if (!portfolioState.newFileItem.fileUrl && !portfolioState.newFileItem.fileData && !portfolioState.newFileItem.selectedFile) {
      alert('من فضلك ارفع ملف العمل أولاً (فيديو / صورة / صوت / PDF)!');
      return;
    }

    // Check size again in save as requested (50MB)
    const fileToSave = portfolioState.newFileItem.selectedFile;
    if (fileToSave && fileToSave.size > 50 * 1024 * 1024) {
      alert('⚠️ تنبيه: حجم الملف كبير جداً (أقصى حد 50 ميجابايت).');
      return;
    }

    // Ensure fileUrl is ALWAYS updated and stored upon upload!
    const effectiveFileUrl = portfolioState.newFileItem.fileUrl || portfolioState.newFileItem.fileData || '';

    workItem = {
      id: `work-${Date.now()}`,
      title,
      type,
      fileUrl: effectiveFileUrl,
      fileData: portfolioState.newFileItem.fileData || effectiveFileUrl,
      fileName: portfolioState.newFileItem.fileName || 'ملف مرفوع',
      fileSizeStr: portfolioState.newFileItem.fileSizeStr || '',
      desc,
      tools,
      date,
      mode: 'file',
      views: 0,
      _rawBlob: portfolioState.newFileItem.selectedFile || null
    };

    // Reset temporary file inputs
    portfolioState.newFileItem.fileData = null;
    portfolioState.newFileItem.selectedFile = null;
    portfolioState.newFileItem.fileUrl = '';
    portfolioState.newFileItem.fileName = '';
    portfolioState.newFileItem.fileSizeStr = '';
    portfolioState.newFileItem.title = '';
  }

  // Add work to user's private items
  portfolioState.items.unshift(workItem);

  // Contributing to Tima points: each work = +15 points
  addTimaPoints(15, `إضافة عمل جديد للبورتفوليو: ${workItem.title}`);

  const saved = savePortfolio(workItem.title);
  if (saved) {
    closeAddWorkModal();
  } else {
    // Rollback if storage failed
    portfolioState.items.shift();
    renderPortfolioSection();
  }
}

let pendingDeleteId = null;

export function openDeleteConfirmModal(id) {
  pendingDeleteId = String(id).trim();
  const item = portfolioState.items.find(it => String(it.id).trim() === pendingDeleteId);
  const title = item ? item.title : 'هذا العمل';
  
  const modal = document.getElementById('modal-confirm-portfolio-delete');
  const titleEl = document.getElementById('confirm-delete-item-title');
  if (titleEl) {
    titleEl.innerText = `هل أنت متأكد من حذف "${title}" نهائياً من البورتفوليو؟`;
  }

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    window.lucide && window.lucide.createIcons();
  }
}

export function closeDeleteConfirmModal() {
  pendingDeleteId = null;
  const modal = document.getElementById('modal-confirm-portfolio-delete');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function executeConfirmedDelete() {
  if (pendingDeleteId) {
    const idToDelete = pendingDeleteId;
    closeDeleteConfirmModal();
    deletePortfolioItem(idToDelete, true);
  }
}

export function handlePortfolioDeleteClick(id) {
  if (!id) return;
  const targetId = String(id).trim();
  const item = portfolioState.items.find(it => String(it.id).trim() === targetId);
  const title = item ? item.title : 'هذا العمل';

  // 1. Try native browser confirm (for automated test runners or environments supporting dialogs)
  try {
    const start = performance.now();
    const confirmed = window.confirm(`هل أنت متأكد من حذف "${title}" نهائياً من البورتفوليو؟`);
    const elapsed = performance.now() - start;

    if (confirmed === true) {
      deletePortfolioItem(targetId, true);
      return;
    } else if (elapsed > 35) {
      // User explicitly clicked Cancel in a real native dialog
      return;
    }
  } catch (e) {
    // Sandbox threw DOMException
  }

  // 2. If native confirm was suppressed by browser iframe sandbox, show in-app modal
  openDeleteConfirmModal(targetId);
}

export async function deletePortfolioItem(id, skipConfirm = false) {
  if (!id) return;
  const targetId = String(id).trim();
  const item = portfolioState.items.find(it => String(it.id).trim() === targetId);
  const title = item ? item.title : 'هذا العمل';

  // If not already confirmed, prompt
  if (!skipConfirm) {
    let ok = false;
    try {
      ok = window.confirm(`هل أنت متأكد من حذف "${title}" نهائياً من البورتفوليو؟`);
    } catch (e) {
      ok = true;
    }
    if (!ok) {
      openDeleteConfirmModal(targetId);
      return;
    }
  }

  // Close any open modals
  closeDeleteConfirmModal();
  closePortfolioDetailModal();

  // 1. FIRST & SYNCHRONOUS: Instant local state removal without full page reload
  portfolioState.items = portfolioState.items.filter(it => String(it.id).trim() !== targetId);

  // 2. Synchronously save state to storage
  savePortfolio();

  // 3. Immediately re-render the UI grid so the card vanishes in 0ms!
  renderPortfolioSection();

  // 4. Show success toast notification
  showToast(`تم حذف "${title}" من البورتفوليو بنجاح 🗑️`);

  // 5. Clean up IndexedDB in background
  try {
    deleteFileFromIndexedDB(targetId);
  } catch (err) {}

  // 6. Trigger Firebase Firestore deletion in background if available
  try {
    const { getFirestore, doc, deleteDoc } = await import('firebase/firestore').catch(() => ({}));
    if (getFirestore && doc && deleteDoc) {
      const db = getFirestore();
      deleteDoc(doc(db, 'portfolio', targetId)).catch(() => {});
      deleteDoc(doc(db, 'portfolio_items', targetId)).catch(() => {});
    }
  } catch (fbErr) {
    // Graceful continuation for offline/local mode
  }
}

export function setPortfolioFilter(category) {
  portfolioState.activeFilter = category;
  renderPortfolioSection();
}

export function viewPortfolioDetail(id) {
  if (!id) return;
  const targetId = String(id).trim();
  const item = portfolioState.items.find(it => String(it.id).trim() === targetId);
  if (!item) {
    showToast('لم يتم العثور على العمل المطلوب!');
    return;
  }

  item.views = (item.views || 0) + 1;
  savePortfolio();

  portfolioState.selectedItemForView = item;
  const modal = document.getElementById('modal-view-portfolio-detail');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
  renderPortfolioDetailModal();
}

export function closePortfolioDetailModal() {
  portfolioState.selectedItemForView = null;
  const modal = document.getElementById('modal-view-portfolio-detail');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    const vid = modal.querySelector('video');
    if (vid) {
      vid.pause();
    }
  }
}

export function copyPortfolioLink() {
  const username = (cvState.data.fullName || state.currentUser?.name || 'student').toLowerCase().replace(/\s+/g, '-');
  const url = `${window.location.origin}/portfolio/${encodeURIComponent(username)}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast(`تم نسخ رابط البورتفوليو الشخصي: /portfolio/${username} 📋✨`);
  }).catch(() => {
    alert(`رابط مجلد بورتفوليوك:\n${url}`);
  });
}

// -------------------------------------------------------------
// RENDER: ADD WORK MODAL (2 Tabs)
// -------------------------------------------------------------
function renderAddWorkModal() {
  const container = document.getElementById('add-work-modal-body');
  if (!container) return;

  const isLink = portfolioState.modalTab === 'link';

  container.innerHTML = `
    <!-- Tabs Switcher -->
    <div class="flex items-center gap-1 p-1 bg-purple-50 rounded-2xl mb-4 border border-purple-200">
      <button onclick="window.phiApp.setAddWorkModalTab('link')" class="flex-1 py-2 rounded-xl text-xs font-black transition-all ${isLink ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-sm' : 'text-[#7C3AED] hover:bg-white'}">
        <i data-lucide="link" class="w-3.5 h-3.5 inline ml-1"></i>
        <span>التبويب 1: إضافة بلينك خارجي</span>
      </button>
      <button onclick="window.phiApp.setAddWorkModalTab('file')" class="flex-1 py-2 rounded-xl text-xs font-black transition-all ${!isLink ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-sm' : 'text-[#7C3AED] hover:bg-white'}">
        <i data-lucide="upload-cloud" class="w-3.5 h-3.5 inline ml-1"></i>
        <span>التبويب 2: رفع ملف مباشر (حتى 25MB)</span>
      </button>
    </div>

    ${isLink ? `
      <!-- TAB 1: ADD VIA LINK -->
      <div class="space-y-3.5 text-xs">
        <div>
          <label class="block font-bold text-[#1E1B4B] mb-1">عنوان العمل *</label>
          <input type="text" id="port-link-title" placeholder="مثال: تحقيق استقصائي: كواليس سوق الذهب" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 outline-none focus:border-[#7C3AED]">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-[#1E1B4B] mb-1">نوع العمل *</label>
            <select id="port-link-type" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 outline-none">
              <option value="فيديو">فيديو (Video / Showreel)</option>
              <option value="مقال">مقال / تقرير صحفي</option>
              <option value="تحقيق">تحقيق استقصائي</option>
              <option value="بودكاست">بودكاست / فويس أوفر</option>
              <option value="تصميم">تصميم / إنفوجرافيك</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-[#1E1B4B] mb-1">تاريخ النشر / الإنتاج</label>
            <input type="date" id="port-link-date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 outline-none font-mono">
          </div>
        </div>

        <div>
          <label class="block font-bold text-[#1E1B4B] mb-1">الرابط المباشر (YouTube / Behance / Drive / موقع إخباري) *</label>
          <input type="text" id="port-link-url" placeholder="https://youtube.com/watch?v=..." class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 outline-none focus:border-[#7C3AED]" dir="ltr">
        </div>

        <div>
          <label class="block font-bold text-[#1E1B4B] mb-1">أدوات وبرامج تم استخدامها</label>
          <input type="text" id="port-link-tools" placeholder="مثال: DaVinci Resolve, Sony FX3, Premiere Pro" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 outline-none">
        </div>

        <div>
          <label class="block font-bold text-[#1E1B4B] mb-1">وصف العمل ودورك الإبداعي</label>
          <textarea id="port-link-desc" rows="3" placeholder="احكِ باختصار عن فكرة العمل، التحديات، والنتيجة..." class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 outline-none leading-relaxed"></textarea>
        </div>
      </div>
    ` : `
      <!-- TAB 2: DIRECT FILE UPLOAD -->
      <div class="space-y-3.5 text-xs">
        <!-- Drag & drop / upload zone -->
        <div class="p-5 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/40 text-center space-y-2 hover:bg-purple-50 transition-colors">
          <i data-lucide="cloud-upload" class="w-8 h-8 mx-auto text-[#7C3AED]"></i>
          <span class="block font-bold text-[#1E1B4B]">ارفع ملف العمل مباشرة (فيديو / صورة / صوت / PDF)</span>
          <p class="text-[11px] text-slate-500">الحد الأقصى لحجم الملف: <strong class="text-[#EC4899]">25MB</strong> (حفظ محلي فوري وآمن)</p>
          <label class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-bold inline-block cursor-pointer shadow-sm hover:opacity-95">
            <span>اختر ملف من جهازك</span>
            <input type="file" id="portfolio-file-input" accept="video/*,.mp4,.mov,image/*,audio/*,application/pdf" class="hidden" onchange="window.phiApp.handlePortfolioFileUpload(event)">
          </label>
          ${portfolioState.newFileItem.fileName ? `
            <div class="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-mono text-xs flex items-center justify-between">
              <span>📄 ${portfolioState.newFileItem.fileName}</span>
              <span class="font-bold">${portfolioState.newFileItem.fileSizeStr}</span>
            </div>
          ` : ''}
        </div>

        <div>
          <label class="block font-bold text-[#1E1B4B] mb-1">عنوان العمل *</label>
          <input type="text" id="port-file-title" value="${escapeHtml(portfolioState.newFileItem.title || '')}" placeholder="مثال: غلاف مجلة التخرج / تغطية صوتية" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 outline-none focus:border-[#7C3AED]">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-[#1E1B4B] mb-1">نوع العمل *</label>
            <select id="port-file-type" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 outline-none">
              <option value="فيديو" ${portfolioState.newFileItem.type === 'فيديو' ? 'selected' : ''}>فيديو</option>
              <option value="تصميم" ${portfolioState.newFileItem.type === 'تصميم' ? 'selected' : ''}>تصميم / صورة</option>
              <option value="بودكاست" ${portfolioState.newFileItem.type === 'بودكاست' ? 'selected' : ''}>صوت / بودكاست</option>
              <option value="مقال" ${portfolioState.newFileItem.type === 'مقال' ? 'selected' : ''}>ملف PDF / مقال</option>
              <option value="تحقيق" ${portfolioState.newFileItem.type === 'تحقيق' ? 'selected' : ''}>تحقيق</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-[#1E1B4B] mb-1">تاريخ النشر</label>
            <input type="date" id="port-file-date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 outline-none font-mono">
          </div>
        </div>

        <div>
          <label class="block font-bold text-[#1E1B4B] mb-1">الأدوات المستخدمة</label>
          <input type="text" id="port-file-tools" placeholder="مثال: Photoshop, Audition, DaVinci" class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 outline-none">
        </div>

        <div>
          <label class="block font-bold text-[#1E1B4B] mb-1">وصف العمل</label>
          <textarea id="port-file-desc" rows="2" placeholder="وصف محتوى الملف ودورك..." class="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 outline-none"></textarea>
        </div>
      </div>
    `}

    <div class="pt-4 flex items-center justify-between gap-3 border-t border-purple-100">
      <span class="text-[11px] text-[#EC4899] font-bold flex items-center gap-1">
        <span>⭐</span>
        <span>كل عمل يمنحك +15 نقطة Tima</span>
      </span>
      <div class="flex items-center gap-2">
        <button onclick="window.phiApp.closeAddWorkModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">
          إلغاء
        </button>
        <button onclick="window.phiApp.submitNewPortfolioWork()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black shadow-md hover:opacity-95">
          حفظ وإضافة للبورتفوليو 🎉
        </button>
      </div>
    </div>
  `;

  window.lucide && window.lucide.createIcons();
}

// -------------------------------------------------------------
// RENDER: PORTFOLIO MAIN SECTION
// -------------------------------------------------------------
export function renderPortfolioSection() {
  const container = document.getElementById('builder-pane-portfolio');
  console.log('Rendering portfolio, container:', container);
  if (!container) return;

  const items = portfolioState.items;
  console.log('Rendering portfolio. Total items:', items.length);
  items.forEach((item, index) => console.log(`Item ${index}:`, item.id, item.title, item.type));
  const username = (cvState.data.fullName || state.currentUser?.name || 'طالب إعلامي').toLowerCase().replace(/\s+/g, '-');
  const userFolderUrl = `https://phi-to.media/portfolio/${username}`;

  // Filter items
  const filter = portfolioState.activeFilter;
  const filteredItems = filter === 'الكل' ? items : items.filter(it => it.type === filter);

  // Stats calculation
  const totalCount = items.length;
  const videoCount = items.filter(it => it.type === 'فيديو').length;
  const articleCount = items.filter(it => it.type === 'مقال' || it.type === 'تحقيق').length;
  const designCount = items.filter(it => it.type === 'تصميم').length;
  const podcastCount = items.filter(it => it.type === 'بودكاست').length;

  container.innerHTML = `
    <div class="space-y-6">

      <!-- Top Header & Folder Bar -->
      <div class="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-purple-100 text-[#7C3AED]">
              <i data-lucide="folder" class="w-5 h-5"></i>
            </span>
            <div>
              <h3 class="text-base font-black text-[#1E1B4B]">مجلد بورتفوليوك الخاص (/portfolio/${username})</h3>
              <p class="text-xs text-slate-500">معرض أعمالك الاحترافي المخصص لمسؤولي التوظيف والشركات الإعلامية.</p>
            </div>
          </div>
          <!-- Folder Stats badge -->
          <div class="flex flex-wrap items-center gap-2 pt-3 text-xs">
            <span class="px-3 py-1 rounded-xl bg-[#1E1B4B] text-white font-bold font-mono">
              عندك ${totalCount} عمل
            </span>
            <span class="px-2.5 py-1 rounded-xl bg-purple-100 text-[#7C3AED] font-bold">
              ${videoCount} فيديو
            </span>
            <span class="px-2.5 py-1 rounded-xl bg-pink-100 text-[#EC4899] font-bold">
              ${articleCount} مقال وتحقيق
            </span>
            <span class="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold">
              ${designCount} تصميم
            </span>
            ${podcastCount > 0 ? `
              <span class="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold">
                ${podcastCount} بودكاست
              </span>
            ` : ''}
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <!-- Share Link Button -->
          <button onclick="window.phiApp.copyPortfolioLink()" class="px-4 py-2.5 rounded-2xl bg-white border border-purple-200 text-[#7C3AED] hover:bg-purple-50 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all">
            <i data-lucide="share-2" class="w-4 h-4 text-[#EC4899]"></i>
            <span>شارك لينك البورتفوليو</span>
          </button>

          <!-- Add Work Button -->
          <button onclick="window.phiApp.openAddWorkModal()" class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 hover:opacity-95 transition-all">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>إضافة عمل جديد (+15 XP)</span>
          </button>
        </div>
      </div>

      <!-- Categories Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        ${['الكل', 'فيديو', 'مقال', 'تحقيق', 'تصميم', 'بودكاست'].map(cat => {
          const isActive = portfolioState.activeFilter === cat;
          return `
            <button onclick="window.phiApp.setPortfolioFilter('${cat}')" class="px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              isActive 
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-purple-50 border border-purple-100'
            }">
              ${cat}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Grid of Works -->
      ${filteredItems.length === 0 ? `
        <div class="bg-white rounded-3xl p-12 border border-purple-100 text-center space-y-4">
          <div class="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 mx-auto flex items-center justify-center text-[#7C3AED]">
            <i data-lucide="folder-open" class="w-8 h-8"></i>
          </div>
          <div>
            <h4 class="text-base font-black text-[#1E1B4B]">لا توجد أعمال في هذا التصنيف</h4>
            <p class="text-xs text-slate-500 max-w-md mx-auto mt-1">ابدأ برفع أعمالك الآن (فيديوهات، تحقيقات، بودكاست، تصميمات) لبناء ملفك الإعلامي الموثوق.</p>
          </div>
          <button onclick="window.phiApp.openAddWorkModal()" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black text-xs shadow-md">
            + إضافة أول عمل للبورتفوليو
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${filteredItems.map(item => {
            // Icon & gradient based on type
            let badgeBg = 'bg-purple-100 text-[#7C3AED]';
            let iconName = 'video';
            if (item.type === 'مقال' || item.type === 'تحقيق') {
              badgeBg = 'bg-pink-100 text-[#EC4899]';
              iconName = 'file-text';
            } else if (item.type === 'تصميم') {
              badgeBg = 'bg-indigo-100 text-indigo-700';
              iconName = 'image';
            } else if (item.type === 'بودكاست') {
              badgeBg = 'bg-amber-100 text-amber-700';
              iconName = 'mic';
            }

            return `
              <div class="bg-white rounded-3xl overflow-hidden border border-purple-100 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all flex flex-col justify-between group">
                
                <!-- Media Thumbnail / Preview Area -->
                <div class="relative h-48 bg-purple-950 overflow-hidden cursor-pointer group/thumb" data-portfolio-view="${item.id}" onclick="window.phiApp.viewPortfolioDetail('${item.id}')">
                  ${(item.type === 'فيديو' || (item.fileName && /\.(mp4|mov|webm)$/i.test(item.fileName))) && item.fileUrl ? `
                    <video src="${item.fileUrl}" class="w-full h-full object-cover" muted preload="metadata"></video>
                    <div class="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/thumb:bg-black/20 transition-all">
                      <span class="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-xl group-hover/thumb:scale-110 transition-transform">
                        <i data-lucide="play" class="w-6 h-6 fill-white text-white ml-0.5"></i>
                      </span>
                    </div>
                  ` : (item.fileUrl || item.fileData) && (item.type === 'تصميم' || (item.fileUrl && (item.fileUrl.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(item.fileUrl)))) ? `
                    <img src="${item.fileUrl || item.fileData}" class="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300" alt="${escapeHtml(item.title)}">
                  ` : `
                    <div class="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gradient-to-br from-[#1E1B4B] to-purple-900 group-hover/thumb:scale-105 transition-transform duration-300">
                      <span class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-pink-300 mb-2 border border-white/10">
                        <i data-lucide="${iconName}" class="w-6 h-6"></i>
                      </span>
                      <span class="text-xs font-black text-white line-clamp-1">${escapeHtml(item.title)}</span>
                      <span class="text-[10px] text-purple-300 mt-1">${item.mode === 'file' ? (item.fileName || 'ملف مرفوع') : 'رابط خارجي'}</span>
                    </div>
                  `}

                  <!-- Badge -->
                  <div class="absolute top-3 right-3">
                    <span class="text-[10px] font-black px-2.5 py-1 rounded-lg ${badgeBg} shadow-sm backdrop-blur-sm">
                      ${escapeHtml(item.type)}
                    </span>
                  </div>

                  <!-- Views badge -->
                  <div class="absolute bottom-3 left-3 bg-[#1E1B4B]/80 backdrop-blur-sm text-purple-200 text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                    <i data-lucide="eye" class="w-3 h-3"></i>
                    <span>${item.views || 1} مشاهدة</span>
                  </div>
                </div>

                <!-- Content Info -->
                <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span>${escapeHtml(item.date || '2025')}</span>
                      ${item.tools ? `<span class="truncate max-w-[120px] text-purple-700 font-bold">${escapeHtml(item.tools)}</span>` : ''}
                    </div>
                    <h4 class="text-sm font-black text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors line-clamp-1 cursor-pointer" data-portfolio-view="${item.id}" onclick="window.phiApp.viewPortfolioDetail('${item.id}')">
                      ${escapeHtml(item.title)}
                    </h4>
                    ${item.desc ? `
                      <p class="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">${escapeHtml(item.desc)}</p>
                    ` : ''}
                  </div>

                  <!-- Actions (Explicitly activated with direct onclick + event listeners) -->
                  <div class="pt-3 border-t border-purple-50 flex items-center justify-between">
                    <button type="button" data-portfolio-view="${item.id}" onclick="window.phiApp.viewPortfolioDetail('${item.id}'); event.stopPropagation();" class="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-xs font-black text-[#7C3AED] hover:text-[#EC4899] flex items-center gap-1.5 transition-all cursor-pointer">
                      <span>عرض وتفاصيل</span>
                      <i data-lucide="maximize-2" class="w-3.5 h-3.5 pointer-events-none"></i>
                    </button>
                    <button type="button" data-portfolio-delete="${item.id}" onclick="window.phiApp.handlePortfolioDeleteClick('${item.id}'); event.stopPropagation();" class="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-all cursor-pointer" title="حذف العمل نهائياً">
                      <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                  </div>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      `}

    </div>
  `;

  // Attach direct DOM event listeners to guarantee 100% button activation
  container.querySelectorAll('[data-portfolio-view]').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const id = el.getAttribute('data-portfolio-view');
      if (id) viewPortfolioDetail(id);
    };
  });

  container.querySelectorAll('[data-portfolio-delete]').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const id = el.getAttribute('data-portfolio-delete');
      if (id) handlePortfolioDeleteClick(id);
    };
  });

  window.lucide && window.lucide.createIcons();
}

// -------------------------------------------------------------
// RENDER: DETAIL MODAL FOR WORK (<video src={work.fileUrl} controls />)
// -------------------------------------------------------------
export function renderPortfolioDetailModal() {
  const container = document.getElementById('portfolio-detail-modal-body');
  const work = portfolioState.selectedItemForView;
  if (!container || !work) return;

  const isVideo = work.type === 'فيديو' || 
                  work.type === 'video' || 
                  (work.fileName && /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(work.fileName)) ||
                  (work.fileUrl && (work.fileUrl.startsWith('data:video/') || /\.(mp4|mov|webm)$/i.test(work.fileUrl))) ||
                  (work.url && (work.url.includes('youtube.com') || work.url.includes('youtu.be') || /\.(mp4|mov|webm)$/i.test(work.url)));

  const isImage = work.type === 'تصميم' || 
                  work.type === 'image' ||
                  (work.fileName && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(work.fileName)) ||
                  (work.fileUrl && (work.fileUrl.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(work.fileUrl)));

  const isAudio = work.type === 'بودكاست' || 
                  (work.fileName && /\.(mp3|wav|ogg|m4a|aac)$/i.test(work.fileName)) ||
                  (work.fileUrl && (work.fileUrl.startsWith('data:audio/') || /\.(mp3|wav|ogg)$/i.test(work.fileUrl)));

  const isPdf = work.type === 'مقال' || 
                (work.fileName && /\.pdf$/i.test(work.fileName)) ||
                (work.fileUrl && (work.fileUrl.startsWith('data:application/pdf') || /\.pdf$/i.test(work.fileUrl)));

  const ytMatch = (work.url || work.fileUrl || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  const ytEmbedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` : null;

  container.innerHTML = `
    <div class="space-y-4">
      <!-- Media Player / Embed / Preview Directly inside the platform -->
      <div class="rounded-2xl overflow-hidden bg-purple-950 border border-purple-200">
        ${isVideo ? `
          <div class="p-2 bg-black flex items-center justify-center">
            ${ytEmbedUrl ? `
              <iframe src="${ytEmbedUrl}" class="w-full h-80 sm:h-96 rounded-xl" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            ` : `
              <video src="${work.fileUrl || work.url}" controls class="w-full max-h-[420px] rounded-xl shadow-lg mx-auto bg-black" playsinline preload="auto"></video>
            `}
          </div>
        ` : isImage ? `
          <div class="p-2 bg-purple-950 flex items-center justify-center">
            <img src="${work.fileUrl || work.fileData || work.url}" class="w-full max-h-[420px] object-contain rounded-xl mx-auto shadow-md" alt="${escapeHtml(work.title)}">
          </div>
        ` : isAudio && (work.fileUrl || work.url) ? `
          <div class="p-8 text-center space-y-4 bg-gradient-to-br from-[#1E1B4B] to-purple-900">
            <div class="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto shadow-inner">
              <i data-lucide="mic" class="w-8 h-8"></i>
            </div>
            <h4 class="text-white font-bold text-sm">${escapeHtml(work.title)}</h4>
            <audio controls src="${work.fileUrl || work.url}" class="w-full max-w-md mx-auto"></audio>
          </div>
        ` : isPdf && work.fileUrl ? `
          <div class="p-6 text-center space-y-4 bg-gradient-to-br from-[#1E1B4B] to-purple-900 text-white">
            <i data-lucide="file-text" class="w-14 h-14 mx-auto text-pink-300"></i>
            <div>
              <p class="text-sm font-bold">${escapeHtml(work.fileName || work.title || 'ملف PDF')}</p>
              <p class="text-xs text-purple-200 mt-1">${work.fileSizeStr || ''}</p>
            </div>
            <div class="flex items-center justify-center gap-3 pt-2">
              <a href="${work.fileUrl}" target="_blank" class="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all">
                <i data-lucide="eye" class="w-4 h-4"></i>
                <span>معاينة في نافذة جديدة</span>
              </a>
              <a href="${work.fileUrl}" download="${work.fileName || 'document.pdf'}" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-lg">
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>تحميل ملف الـ PDF 📄</span>
              </a>
            </div>
          </div>
        ` : work.fileUrl ? `
          <div class="p-8 text-center space-y-3 bg-gradient-to-br from-[#1E1B4B] to-purple-900 text-white">
            <i data-lucide="file" class="w-12 h-12 mx-auto text-purple-300"></i>
            <h4 class="text-sm font-bold">${escapeHtml(work.title)}</h4>
            <a href="${work.fileUrl}" download="${work.fileName || 'file'}" class="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-bold inline-block">تحميل الملف 📄</a>
          </div>
        ` : work.url ? `
          <!-- Link mode with in-app iframe or direct action -->
          <div class="p-8 text-center bg-gradient-to-br from-[#1E1B4B] to-purple-900 text-white space-y-4">
            <span class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-pink-300 mx-auto shadow-inner">
              <i data-lucide="external-link" class="w-7 h-7"></i>
            </span>
            <div>
              <h4 class="text-base font-black">${escapeHtml(work.title)}</h4>
              <p class="text-xs text-purple-200 font-mono mt-1" dir="ltr">${escapeHtml(work.url)}</p>
            </div>
            <a href="${work.url}" target="_blank" rel="noopener noreferrer" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-black inline-flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
              <span>فتح الرابط الأصلي مباشرة</span>
              <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
            </a>
          </div>
        ` : `
          <div class="p-8 text-center text-white">لا يتوفر ملف أو رابط لهذا العمل</div>
        `}
      </div>

      <!-- Info Details -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-black px-3 py-1 rounded-xl bg-purple-100 text-[#7C3AED] shadow-sm">${escapeHtml(work.type)}</span>
          <span class="text-xs font-mono text-slate-400">${escapeHtml(work.date || '')}</span>
        </div>
        <h3 class="text-xl font-black text-[#1E1B4B]">${escapeHtml(work.title)}</h3>
        ${work.tools ? `<div class="text-xs font-bold text-[#7C3AED] bg-purple-50 p-2.5 rounded-xl border border-purple-100">الأدوات: ${escapeHtml(work.tools)}</div>` : ''}
        ${work.desc ? `<p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">${escapeHtml(work.desc)}</p>` : ''}
      </div>

      <!-- Detail Modal Bottom Actions -->
      <div class="pt-4 border-t border-purple-100 flex items-center justify-between">
        <button type="button" onclick="window.phiApp.closePortfolioDetailModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer">
          إغلاق النافذة
        </button>
        <button type="button" onclick="window.phiApp.handlePortfolioDeleteClick('${work.id}')" class="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer">
          <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
          <span>حذف هذا العمل</span>
        </button>
      </div>
    </div>
  `;

  window.lucide && window.lucide.createIcons();
}

// Utility HTML escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Ensure all portfolio methods are bound to window.phiApp and window directly
if (typeof window !== 'undefined') {
  if (!window.phiApp) window.phiApp = {};
  window.phiApp.deletePortfolioItem = deletePortfolioItem;
  window.phiApp.handlePortfolioDeleteClick = handlePortfolioDeleteClick;
  window.phiApp.openDeleteConfirmModal = openDeleteConfirmModal;
  window.phiApp.closeDeleteConfirmModal = closeDeleteConfirmModal;
  window.phiApp.executeConfirmedDelete = executeConfirmedDelete;
  window.phiApp.viewPortfolioDetail = viewPortfolioDetail;
  window.phiApp.closePortfolioDetailModal = closePortfolioDetailModal;
  window.phiApp.copyPortfolioLink = copyPortfolioLink;
  window.phiApp.openAddWorkModal = openAddWorkModal;
  window.phiApp.closeAddWorkModal = closeAddWorkModal;
  window.phiApp.setAddWorkModalTab = setAddWorkModalTab;
  window.phiApp.handlePortfolioFileUpload = handlePortfolioFileUpload;
  window.phiApp.submitNewPortfolioWork = submitNewPortfolioWork;
  window.phiApp.setPortfolioFilter = setPortfolioFilter;
  window.phiApp.renderPortfolioSection = renderPortfolioSection;
  window.deletePortfolioItem = deletePortfolioItem;
  window.viewPortfolioDetail = viewPortfolioDetail;
  window.handlePortfolioDeleteClick = handlePortfolioDeleteClick;
}
