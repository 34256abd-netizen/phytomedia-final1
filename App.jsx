import React, { useState } from 'react';
import { 
  ChevronDown, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Users, 
  Briefcase, 
  Search, 
  CheckCircle2, 
  Tv, 
  FileText, 
  Video, 
  Brain, 
  Building2, 
  GraduationCap, 
  ExternalLink,
  X,
  Target,
  Compass,
  Zap,
  Menu
} from 'lucide-react';
import ExpertInstaPay from './src/components/ExpertInstaPay';

export default function App() {
  // Navigation / Modal States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0); // first item open by default
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [talentModalOpen, setTalentModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [activeServiceTab, setActiveServiceTab] = useState(0);
  const [joinSubmitted, setJoinSubmitted] = useState(false);
  const [searchTalentQuery, setSearchTalentQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    universityOrOrg: '',
    specialty: 'مونتاج وصحافة'
  });

  // Sample verified student talent pool for preview
  const talents = [
    {
      id: 'stud-1',
      name: 'مريم حسام شريف',
      title: 'مذيعة ومراسلة إخبارية',
      department: 'جامعة القاهرة - قسم الإذاعة والتلفزيون',
      ovr: 94,
      skills: ['إلقاء إخباري', 'مراسلة ميدانية', 'إدارة حوار'],
      verified: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      instapay_link: 'mariam@instapay',
      instapay_qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=mariam@instapay'
    },
    {
      id: 'stud-2',
      name: 'عمر شريف الشناوي',
      title: 'مونتير ومصمم موشن جرافيك',
      department: 'جامعة عين شمس - شعبة الإعلام الرقمي',
      ovr: 93,
      skills: ['Premiere Pro', 'After Effects', 'DaVinci Resolve'],
      verified: true,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      instapay_link: 'omar@instapay'
    },
    {
      id: 'stud-3',
      name: 'كريم عبد الله السويفي',
      title: 'مدير تصوير وإضاءة سينمائية',
      department: 'جامعة الإسكندرية - فنون تطبيقية وإعلام',
      ovr: 91,
      skills: ['تصوير سينمائي', 'إضاءة درامية', 'توثيق ميداني'],
      verified: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'stud-4',
      name: 'سلمى محمد النجار',
      title: 'صحفية استقصائية وباحثة بيانات',
      department: 'جامعة القاهرة - قسم الصحافة والنشر',
      ovr: 90,
      skills: ['تحقيقات استقصائية', 'صحافة بيانات', 'صياغة الخبر'],
      verified: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'stud-5',
      name: 'زياد خالد المنشاوي',
      title: 'مخطط حملات اتصالية وعلاقات عامة',
      department: 'جامعة حلوان - قسم العلاقات العامة والإعلان',
      ovr: 89,
      skills: ['إدارة الأزمات', 'تخطيط الحملات', 'سوشيال ميديا'],
      verified: true,
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
    }
  ];

  const filteredTalents = talents.filter(t => 
    t.name.includes(searchTalentQuery) || 
    t.title.includes(searchTalentQuery) || 
    t.skills.some(s => s.toLowerCase().includes(searchTalentQuery.toLowerCase()))
  );

  // Exact 5 FAQ Questions as requested
  const faqItems = [
    {
      id: 1,
      question: "من نكون؟",
      answer: `نحن φ To Media، المنظومة الإعلامية الرقمية المتكاملة والمدعومة بالذكاء الاصطناعي، وُلدنا من قلب الوسط الإعلامي المصري والعربي لنعيد تعريف العلاقة بين التعليم الأكاديمي واشتراطات سوق العمل الحقيقية.

نجمع تحت مظلة واحدة:
• طلاب وخريجي كليات وأقسام الإعلام الباحثين عن التميز الحقيقي.
• نخبة المنتورز والخبراء الممارسين من كبرى المؤسسات الصحفية والشبكات التلفزيونية العالمية.
• الشركات، المنصات الرقمية، واستوديوهات الإنتاج الراغبة في الوصول إلى كفاءات جاهزة للإنتاج الفوري.

لسنا مجرد أداة برمجية؛ نحن الحاضنة المهنية التي تصقل مهاراتك عبر التقييم الذكي، وتوثق أعمالك ببورتفوليو وسيرة ذاتية بمعايير عالمية، وتمنحك بطاقة مهارات Tima معتمدة تؤهلك للمنافسة بقوة.`
    },
    {
      id: 2,
      question: "ما هي أهدافنا؟",
      isList: true,
      points: [
        {
          num: "01",
          title: "سد الفجوة بين التعليم الأكاديمي واحتياجات السوق الحقيقية",
          desc: "تحويل المقررات النظرية إلى تدريب ميداني مستمر، وربط الطالب بأحدث أدوات الذكاء الاصطناعي وتقنيات الإنتاج الرقمي المعاصر."
        },
        {
          num: "02",
          title: "إرساء معيار تقييم كفاءة موحد وموثوق (بطاقات Tima)",
          desc: "توفير بطاقة مهارية رقمية دقيقة تقيس القدرات الواقعية للطالب في (التصوير، المونتاج، الكتابة، التقديم، العلاقات العامة، والإعلام الرقمي) بعيداً عن التقديرات الورقية المجردة."
        },
        {
          num: "03",
          title: "إتاحة التوجيه المهني الفردي المباشر (1-on-1 Mentorship)",
          desc: "تمكين الشباب من التعلم المباشر على يد كبار المتخصصين الممارسين في الصحف والقنوات الرائدة لنقل أسرار المهنة وثقافة غرف الأخبار."
        },
        {
          num: "04",
          title: "توفير منظومة توظيف عادلة وشفافة للمؤسسات والشركات",
          desc: "تمكين شركات الإنتاج والقنوات من اكتشاف المواهب وفلترتها بالذكاء الاصطناعي (φ Scout) بسرعة فائقة، وتقليص تكاليف ومخاطر التوظيف التقليدي."
        }
      ]
    },
    {
      id: 3,
      question: "ما هي رؤيتنا؟",
      isList: true,
      points: [
        {
          num: "01",
          title: "أن نكون جواز السفر المهني الأول لكل إعلامي عربي",
          desc: "أن تصبح بطاقة Tima وملف φ To Media هما المرجع المعياري المعتمد لدى جميع وكالات الأنباء، شركات الإنتاج، والمنصات الرقمية في الشرق الأوسط والعالم."
        },
        {
          num: "02",
          title: "قيادة التحول نحو الذكاء الاصطناعي الإعلامي المسؤول",
          desc: "تسخير خوارزميات التقييم والتحليل الذاتي لتمكين الإنسان المبدع وتعزيز صوته وهويته الفردية، لا استبداله أو إلغاء حسه الإنساني."
        },
        {
          num: "03",
          title: "تأسيس مجتمع إعلامي تعاوني متكامل ومستدام",
          desc: "خلق بيئة تفاعلية لا تنقطع فيها سلاسل الخبرة؛ حيث يتحول طالب اليوم إلى خبير الغد، وتتلاقى الطاقات الشابة مع المشاريع الاستثمارية والإنتاجات الكبرى."
        }
      ]
    },
    {
      id: 4,
      question: "لماذا φ To Media؟",
      answer: `لأن الأدوات تنتهي بانتهاء مهمتها السريعة، بينما "أسلوب الحياة" يرافقك في كل لحظة من مسيرتك ويبني هويتك الراسخة.

في φ To Media، لا نقدم لك مجرد قوالب جامدة أو محرر نصوص تقليدي، بل نصنع معك عاداتك وتفكيرك المهني اليومي:
• كيف تفكر كصحفي استقصائي يتحرى الحقيقة ويدقق المصادر قبل النشر.
• كيف تزن اللقطة وزوايا الإضاءة والمونتاج بحس فني ناضج وواعٍ.
• كيف تختبر أفكارك ومشاريعك في "معمل التحديات" التنافسي مع زملاء المهنة.
• كيف ترصد نمو مؤشرك الاحترافي العام (OVR) يوماً بعد يوم، وتطور نقاط ضعفك قبل خوض مقابلات العمل.

φ To Media هي هويتك ومجتمعك ومحطتك الأولى لكل تطور إعلامي – إنها ليست تطبيقاً تفتحه لدقائق، بل منظومة تعيش داخلها وتنمو معها.`
    },
    {
      id: 5,
      question: "ما هي خدماتنا؟",
      isServices: true,
      services: [
        {
          title: "صانع السيرة الذاتية الإعلامية الذكي (ATS Media CV)",
          desc: "نظام بناء سيرة ذاتية إعلامية في 8 خطوات تفاعلية، متوافق كلياً مع أنظمة الفرز الآلي الدولية ATS، ومدعوم بمقترحات الذكاء الاصطناعي لصياغة الإنجازات والمهام بأسلوب احترافي."
        },
        {
          title: "البورتفوليو الرقمي التفاعلي (Interactive Portfolio)",
          desc: "مساحة عرض سينمائية خاصة بكل طالب لتوثيق التحقيقات، الأفلام الوثائقية، البرامج الإذاعية، والتصاميم بروابط تفاعلية سريعة وتصميم راقٍ يجذب مسؤولي التوظيف."
        },
        {
          title: "معمل التحديات وبطاقات مهارات Tima المعتمدة",
          desc: "تحديات تطبيقية حقيقية تحاكي ضغط العمل الإعلامي، تُمنح بموجبها بطاقة Tima المهارية الرقمية بدرجات دقيقة (0-99 OVR) تغطي أهم 6 ركائز للمحتوى والإعلام."
        },
        {
          title: "نظام التقييم الذكي الفوري (AI Media Evaluation)",
          desc: "محرك φ المدعوم بنماذج الذكاء الاصطناعي المتقدمة لتحليل نصوص الاسكريبتات، التقارير الإخبارية، وأفكار البرامج وتقديم تقييم شامل ونقد بناء في ثوانٍ معدودة."
        },
        {
          title: "محرك استكشاف وتوظيف المواهب (Talent Discovery & φ Scout)",
          desc: "بوابة ذكية مخصصة للمؤسسات وشركات الإنتاج للبحث والفلترة الفورية بين طلاب مصر والوطن العربي، واختيار أفضل الكوادر المطابقة للاحتياج الفعلي بنقرة واحدة."
        }
      ]
    }
  ];

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setJoinSubmitted(true);
    setTimeout(() => {
      setJoinSubmitted(false);
      setJoinModalOpen(false);
    }, 2200);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#111827] text-slate-100 font-['Cairo',sans-serif] selection:bg-[#6366f1] selection:text-white relative overflow-x-hidden antialiased">
      
      {/* Ambient Linear-style Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#6366f1]/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 right-1/3 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Stand with Palestine Subtle Banner */}
      <div className="relative z-50 bg-[#090d16] border-b border-white/5 py-1.5 px-4 text-center text-xs text-slate-400 font-medium">
        <span className="inline-flex items-center gap-2">
          <span>🇵🇸</span>
          <span className="text-slate-300 font-semibold">دائماً وأبداً.. متضامنون مع فلسطين الحرة</span>
        </span>
      </div>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#111827]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo & Linear-style Icon */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6366f1] to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#6366f1]/25 border border-indigo-400/30 group-hover:scale-105 transition-transform duration-300">
              φ
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-white tracking-tight">φ To Media</span>
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  AI Platform
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                أسلوب حياة إعلامي، ليس مجرد أداة
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#hero" className="hover:text-white transition-colors">الرئيسية</a>
            <a href="#about" className="hover:text-white transition-colors">من نكون</a>
            <a href="#services" className="hover:text-white transition-colors">خدماتنا</a>
            <a href="#goals" className="hover:text-white transition-colors">الرؤية والأهداف</a>
            <a href="#faq" className="hover:text-white transition-colors">الأسئلة الشائعة</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button 
              onClick={() => setTalentModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 hover:border-indigo-500/40 rounded-xl transition-all hover:bg-white/[0.03] flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>استكشف المواهب</span>
            </button>
            <button 
              onClick={() => { setSelectedRole('student'); setJoinModalOpen(true); }}
              className="px-5 py-2 text-xs font-bold text-white bg-[#6366f1] hover:bg-indigo-500 shadow-md shadow-indigo-500/25 rounded-xl transition-all hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
            >
              <span>انضم الآن</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            aria-label="القائمة"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0d1320] border-b border-white/10 px-4 py-5 space-y-4 text-sm font-medium">
            <a 
              href="#hero" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-200 hover:text-indigo-400 py-1"
            >
              الرئيسية
            </a>
            <a 
              href="#about" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-200 hover:text-indigo-400 py-1"
            >
              من نكون
            </a>
            <a 
              href="#services" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-200 hover:text-indigo-400 py-1"
            >
              خدماتنا
            </a>
            <a 
              href="#goals" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-200 hover:text-indigo-400 py-1"
            >
              الرؤية والأهداف
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-200 hover:text-indigo-400 py-1"
            >
              الأسئلة الشائعة
            </a>
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <button 
                onClick={() => { setMobileMenuOpen(false); setTalentModalOpen(true); }}
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-200 border border-white/10 rounded-xl"
              >
                استكشف المواهب
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); setJoinModalOpen(true); }}
                className="w-full py-2.5 text-center text-xs font-bold text-white bg-[#6366f1] rounded-xl"
              >
                انضم الآن
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Flow */}
      <main className="relative z-10">

        {/* ========================================================
             1. HERO SECTION
             ======================================================== */}
        <section id="hero" className="pt-20 pb-28 lg:pt-28 lg:pb-36 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            {/* Top Linear-style Announcement Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>المنظومة الإعلامية الذكية الأولى في مصر والعالم العربي</span>
            </div>

            {/* Exact Hero Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.25] sm:leading-[1.2] mb-6">
              φ To Media
              <span className="block mt-2 bg-gradient-to-r from-indigo-200 via-indigo-400 to-purple-300 bg-clip-text text-transparent">
                أسلوب حياة إعلامي، ليس مجرد أداة
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal mb-10">
              المنصة الشاملة المدعومة بالذكاء الاصطناعي φ لتمكين طلاب وخريجي الإعلام، والخبراء، والشركات. 
              نصنع معاً هويتك المهنية عبر بطاقات مهارات Tima، والسيرة الذاتية الذكية ATS، ومعمل التحديات العملية.
            </p>

            {/* 2 CTA Buttons as explicitly requested */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
              <button 
                onClick={() => { setSelectedRole('student'); setJoinModalOpen(true); }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#6366f1] hover:bg-indigo-500 text-white font-bold text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>انضم الآن</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setTalentModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-base border border-white/10 hover:border-indigo-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4 text-indigo-400" />
                <span>استكشف المواهب</span>
              </button>
            </div>

            {/* Linear-style Interactive Feature Preview Board */}
            <div className="relative max-w-4xl mx-auto rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/90 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-right">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xl">
                    φ
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">بطاقة مهارات Tima المعتمدة بالذكاء الاصطناعي</h3>
                    <p className="text-xs text-slate-400">تقييم موحد لـ 6 ركائز أساسية يحتاجها سوق الميديا الحديث</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400 font-semibold">مباشر ومحدث</span>
                  <span>·</span>
                  <span>معتمد للشركات</span>
                </div>
              </div>

              {/* Live Metric Pills (Anti-slop, clean typographic rows) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">المونتاج</span>
                  <span className="text-lg font-extrabold text-indigo-400 font-mono">95</span>
                  <span className="text-[10px] text-slate-500 block">Premiere / DaVinci</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">التصوير</span>
                  <span className="text-lg font-extrabold text-indigo-400 font-mono">92</span>
                  <span className="text-[10px] text-slate-500 block">إضاءة / سينمائي</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">الكتابة</span>
                  <span className="text-lg font-extrabold text-indigo-400 font-mono">96</span>
                  <span className="text-[10px] text-slate-500 block">تحقيق / اسكريبت</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">التقديم</span>
                  <span className="text-lg font-extrabold text-indigo-400 font-mono">90</span>
                  <span className="text-[10px] text-slate-500 block">إذاعة / مراسلة</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">العلاقات العامة</span>
                  <span className="text-lg font-extrabold text-indigo-400 font-mono">88</span>
                  <span className="text-[10px] text-slate-500 block">اتصال / أزمات</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">الميديا الرقمية</span>
                  <span className="text-lg font-extrabold text-indigo-400 font-mono">94</span>
                  <span className="text-[10px] text-slate-500 block">سوشيال / بودكاست</span>
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* ========================================================
             2. ABOUT SECTION (من نكون - The Long Text Manifesto)
             ======================================================== */}
        <section id="about" className="py-24 border-t border-white/[0.08] relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                البيان التأسيسي
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
                من نكون؟
              </h2>
              <div className="w-12 h-1 bg-indigo-500 mx-auto rounded-full" />
            </div>

            {/* The Detailed Long Text in Clean Editorial Design */}
            <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-8 sm:p-12 text-slate-300 leading-relaxed space-y-8 text-right">
              
              <div className="border-r-2 border-indigo-500 pr-5">
                <p className="text-lg sm:text-xl font-semibold text-white leading-loose">
                  وُلدت <span className="text-indigo-400 font-bold">φ To Media</span> من قلب المعاناة الميدانية التي يعيشها طالب وخريج كليات وأقسام الإعلام في مصر والعالم العربي؛ تلك الفجوة المقلقة بين النظريات الأكاديمية الصامتة، وبين متطلبات غرف الأخبار المتسارعة واستوديوهات الإنتاج الرقمي الحديثة.
                </p>
              </div>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                لسنا مجرد أداة إلكترونية مؤقتة تُضاف إلى قائمة التطبيقات على هاتفك، بل نحن <strong className="text-white font-semibold">أسلوب حياة مهني متكامل (Lifestyle Ecosystem)</strong> يرافق صانع المحتوى، الصحفي، المونتير، المخرج، ومسؤول الاتصال منذ يومه الجامعي الأول، مروراً بمعامل التدريب الواقعي، وحتى توقيع عقود العمل الاحترافية مع كبرى القنوات والمنصات وصناع القرار.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h4 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    <span>تمكين بالذكاء الاصطناعي المسؤول</span>
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    نُسخر الذكاء الاصطناعي لتقييم المهارات التطبيقية الحقيقية عبر بطاقات مهارات Tima، دون تحيز ودون إغفال للروح الإبداعية، مع تزويد كل طالب بمؤشرات دقيقة لتطوير أدواته ومواكبة معايير السوق الدولي.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h4 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>توجيه ميداني من كبار الخبراء</span>
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    نفتح قنوات اتصال مباشرة وحية (1-on-1) بين الجيل الجديد وكبار الممارسين في الصحف العالمية، قنوات التلفزيون، واستوديوهات المونتاج لنقل خلاصة سنوات من التجربة والخبرة دون وساطة.
                  </p>
                </div>
              </div>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                نحن في φ To Media نؤمن إيماناً لا يتزعزع بأن <strong className="text-indigo-300 font-semibold">"الإعلام مش هواية.. الإعلام هوية"</strong>؛ هوية تبني الوعي الإنساني، وتصنع الفارق في المجتمع، وتحتاج إلى بيئة متكاملة تحتضن التجربة والخطأ، وتوفر التحديات المهنية، وتوثق الإنجازات بسجل موثوق يعترف به سوق العمل.
              </p>

              {/* Role Manifesto Badges */}
              <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span>للطلاب: بناء السيرة، بطاقة Tima، والتحديات</span>
                </span>
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>للخبراء: جلسات التوجيه ونقل الخبرة المهنية</span>
                </span>
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>للشركات: محرك اكتشاف المواهب والتوظيف الفوري</span>
                </span>
              </div>

            </div>

          </div>
        </section>


        {/* ========================================================
             3. SERVICES SECTION (خدماتنا الخمس)
             ======================================================== */}
        <section id="services" className="py-24 border-t border-white/[0.08] relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                أركان المنظومة
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
                خدماتنا المتكاملة
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                خمس خدمات أساسية صُممت بعناية لتغطي دورة حياة العمل الإعلامي من الفكرة إلى التوظيف.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right">
              
              {/* Service 1: CV */}
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  صانع الـ CV الذكي (ATS Media)
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  سيرة ذاتية متوافقة مع أنظمة الفرز الآلي الدولية ATS للوكالات والصحف، مع صياغة إنجازاتك الإعلامية بدقة مدعومة باقتراحات الذكاء الاصطناعي.
                </p>
                <div className="text-xs text-indigo-400 font-semibold flex items-center gap-1.5">
                  <span>8 خطوات تفاعلية + تصدير PDF فوري</span>
                </div>
              </div>

              {/* Service 2: Portfolio */}
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Tv className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  البورتفوليو الرقمي التفاعلي
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  معرض وسائط متعددة لعرض الأفلام الوثائقية، التحقيقات الصحفية، حلقات البودكاست، ومشاريع التخرج بروابط حية تليق بالمعايير العالمية.
                </p>
                <div className="text-xs text-indigo-400 font-semibold flex items-center gap-1.5">
                  <span>روابط مباشرة وتنسيق سينمائي أنيق</span>
                </div>
              </div>

              {/* Service 3: TIMA Cards & Challenge Lab */}
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-indigo-500/30 hover:border-indigo-500 transition-all hover:-translate-y-1 group relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  معمل التحديات وبطاقات Tima
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  تحديات صحفية وإنتاجية عملية تمنحك بطاقة مهارات رقمية (Tima Card) بدرجات 0-99 OVR معتمدة، تعكس مستواك الفعلي أمام جهات التوظيف.
                </p>
                <div className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5">
                  <span>تقييم مهارات 6 أركان إعلامية</span>
                </div>
              </div>

              {/* Service 4: AI Evaluation */}
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  التقييم الذكي الفوري (AI Media)
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  حلل أعمالك وسيناريوهاتك فورياً بنموذج الذكاء الاصطناعي φ، لتحصل على تقرير نقدي فوري يوضح نقاط القوة وفرص التطوير المهني.
                </p>
                <div className="text-xs text-indigo-400 font-semibold flex items-center gap-1.5">
                  <span>تحليل لغوي، سردي، ومعياري دقيق</span>
                </div>
              </div>

              {/* Service 5: Talent Discovery */}
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 transition-all hover:-translate-y-1 group md:col-span-2 lg:col-span-2">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  اكتشاف المواهب والتوظيف الذكي (φ Scout)
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  بوابة متطورة للمؤسسات الإعلامية وشركات الإنتاج والإعلانات للبحث الذكي بين مئات الطلاب والخريجين، والوصول الفوري إلى الكفاءات المناسبة للمشاريع المستعجلة والوظائف الدائمة.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => setTalentModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-600/50 text-xs font-bold transition-all"
                  >
                    عرض قاعدة المواهب الحالية
                  </button>
                  <span className="text-xs text-slate-500">فلترة سريعة حسب المهارات والـ OVR</span>
                </div>
              </div>

            </div>

          </div>
        </section>


        {/* ========================================================
             4. GOALS & VISION SECTION (الرؤية والأهداف)
             ======================================================== */}
        <section id="goals" className="py-24 border-t border-white/[0.08] relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-right">
              
              {/* Goals (4 Points) */}
              <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-8 sm:p-10 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">المسار العملي</span>
                    <h3 className="text-2xl font-extrabold text-white">أهدافنا الأربعة</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="font-mono text-indigo-400 font-bold text-sm">01</span>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">سد الفجوة بين الأكاديميا وسوق العمل</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">تحويل المقررات النظرية إلى تدريب مهني رقمي يواكب تقنيات الميديا الحديثة.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="font-mono text-indigo-400 font-bold text-sm">02</span>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">معيار تقييم كفاءة موحد (بطاقات Tima)</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">قياس المهارات التطبيقية برقم معتمد وموثوق يحل محل التقدير النظري المجرد.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="font-mono text-indigo-400 font-bold text-sm">03</span>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">التوجيه الفردي المباشر مع الخبراء</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">جلسات خاصة لنقل الخبرات الميدانية من قامات الجزيرة والمصري اليوم وغيرها.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="font-mono text-indigo-400 font-bold text-sm">04</span>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">توظيف عادل وشفاف للشركات</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">تسهيل وصول القنوات والشركات للمواهب الجاهزة للعمل الفوري دون عناء.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vision (3 Points) */}
              <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-8 sm:p-10 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">الأفق المستقبلي</span>
                    <h3 className="text-2xl font-extrabold text-white">رؤيتنا الثلاثية</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="font-mono text-purple-400 font-bold text-sm">01</span>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">جواز السفر المهني الأول للإعلام العربي</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">أن تكون بطاقة Tima وملف المنظومة هو المرجع المعترف به عربياً ودولياً.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="font-mono text-purple-400 font-bold text-sm">02</span>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">صياغة الذكاء الاصطناعي المسؤول</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">توظيف التكنولوجيا الحديثة لتعزيز الإبداع البشري بدلاً من تهميشه أو استبداله.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="font-mono text-purple-400 font-bold text-sm">03</span>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">مجتمع إعلامي تعاوني متكامل ومستدام</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">بناء شبكة تواصل دائمة تتبادل فيها الأجيال الخبرة وتفتح آفاق الإنتاج المشترك.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>


        {/* ========================================================
             5. FAQ ACCORDION SECTION (Exact 5 Questions)
             ======================================================== */}
        <section id="faq" className="py-24 border-t border-white/[0.08] relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                إجابات صريحة ومباشرة
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
                الأسئلة الشائعة
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                كل ما تحتاج لمعرفته حول منظومة φ To Media وفلسفتها وخدماتها
              </p>
            </div>

            {/* Accordion Container */}
            <div className="space-y-4">
              {faqItems.map((item, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div 
                    key={item.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden text-right ${
                      isOpen 
                        ? 'bg-slate-900/90 border-indigo-500/40 shadow-lg shadow-indigo-500/5' 
                        : 'bg-slate-900/40 border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? -1 : index)}
                      className="w-full p-6 text-right flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <span className="text-lg font-bold text-white leading-snug">
                        {item.question}
                      </span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isOpen ? 'bg-indigo-500/20 text-indigo-400 rotate-180' : 'bg-white/5 text-slate-400'
                      }`}>
                        <ChevronDown className="w-5 h-5 transition-transform duration-300" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-6 pt-2 text-slate-300 text-sm leading-relaxed border-t border-white/[0.06] space-y-4">
                        
                        {/* Standard Text Answer */}
                        {item.answer && (
                          <div className="whitespace-pre-line text-slate-300 font-normal leading-relaxed">
                            {item.answer}
                          </div>
                        )}

                        {/* List Points Answer (Objectives & Vision) */}
                        {item.isList && item.points && (
                          <div className="grid grid-cols-1 gap-3 pt-2">
                            {item.points.map((pt, pIdx) => (
                              <div key={pIdx} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-start gap-3">
                                <span className="font-mono text-indigo-400 font-bold text-xs bg-indigo-500/10 px-2 py-1 rounded-md">
                                  {pt.num}
                                </span>
                                <div>
                                  <h5 className="font-bold text-white text-sm mb-1">{pt.title}</h5>
                                  <p className="text-xs text-slate-400 leading-relaxed">{pt.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Services Breakdown Answer */}
                        {item.isServices && item.services && (
                          <div className="grid grid-cols-1 gap-3 pt-2">
                            {item.services.map((srv, sIdx) => (
                              <div key={sIdx} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <h5 className="font-bold text-indigo-300 text-sm mb-1 flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                                  <span>{srv.title}</span>
                                </h5>
                                <p className="text-xs text-slate-400 leading-relaxed pr-6">{srv.desc}</p>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>


        {/* ========================================================
             BOTTOM CTA BANNER
             ======================================================== */}
        <section className="py-20 border-t border-white/[0.08] relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              جاهز لبناء هويتك الإعلامية؟
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              انضم إلى آلاف الطلاب والخبراء والمؤسسات في مصر والعالم العربي وابدأ الآن رحلتك مع بطاقات Tima والتقييم الذكي.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => { setSelectedRole('student'); setJoinModalOpen(true); }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#6366f1] hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>انضم الآن للمنظومة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setTalentModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>تصفح المواهب المسجلة</span>
              </button>
            </div>
          </div>
        </section>

      </main>


      {/* ========================================================
           FOOTER
           ======================================================== */}
      <footer className="bg-[#0b0f19] border-t border-white/[0.08] py-12 text-slate-400 text-sm text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              φ
            </div>
            <div>
              <span className="font-bold text-white text-base">φ To Media</span>
              <p className="text-xs text-slate-500">الإعلام مش هواية. الإعلام هوية.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <a href="#about" className="hover:text-white transition-colors">من نكون</a>
            <a href="#services" className="hover:text-white transition-colors">خدماتنا</a>
            <a href="#goals" className="hover:text-white transition-colors">الأهداف والرؤية</a>
            <a href="#faq" className="hover:text-white transition-colors">الأسئلة الشائعة</a>
          </div>

          <div className="text-xs text-slate-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()} φ To Media Ecosystem
          </div>
        </div>
      </footer>


      {/* ========================================================
           JOIN MODAL (انضم الآن)
           ======================================================== */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-right">
          <div className="bg-[#171f30] border border-white/15 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button 
              onClick={() => setJoinModalOpen(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                <span>بوابة التسجيل الفوري</span>
              </div>
              <h3 className="text-2xl font-black text-white">انضم إلى φ To Media</h3>
              <p className="text-xs text-slate-400 mt-1">اختر هويتك وسجل بياناتك للانضمام فوراً للمنظومة</p>
            </div>

            {joinSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white">أهلاً بك في عالم φ To Media!</h4>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  تم استلام طلب انضمامك بنجاح. سيتم تفعيل حسابك وإرسال بيانات تسجيل الدخول إلى بريدك الإلكتروني.
                </p>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                
                {/* Role Switcher */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">نوع الحساب *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'student' })}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        formData.role === 'student' 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                          : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      طالب / خريج
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'mentor' })}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        formData.role === 'mentor' 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                          : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      خبير / منتور
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'company' })}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        formData.role === 'company' 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                          : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      مؤسسة / شركة
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">الاسم بالكامل *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: مريم حسام شريف"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">البريد الإلكتروني *</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* University or Organization */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">الجامعة / جهة العمل *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.universityOrOrg}
                    onChange={(e) => setFormData({ ...formData, universityOrOrg: e.target.value })}
                    placeholder="مثال: جامعة القاهرة - كلية الإعلام"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#6366f1] hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>تأكيد التسجيل والانضمام</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}


      {/* ========================================================
           TALENT EXPLORE MODAL (استكشف المواهب)
           ======================================================== */}
      {talentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-right">
          <div className="bg-[#171f30] border border-white/15 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setTalentModalOpen(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                <span>قاعدة المواهب الإعلامية المعتمدة</span>
              </div>
              <h3 className="text-2xl font-black text-white">استكشاف كوادر إعلام مصر</h3>
              <p className="text-xs text-slate-400 mt-1">تصفح بطاقات Tima المهارية وتقييم الـ OVR للطلاب والخريجين الجاهزين للعمل الفوري</p>
            </div>

            {/* Live Search Bar */}
            <div className="relative mb-6">
              <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5" />
              <input 
                type="text"
                value={searchTalentQuery}
                onChange={(e) => setSearchTalentQuery(e.target.value)}
                placeholder="ابحث بالاسم، التخصص، أو الأداة (مثال: مونتاج، تقديم، كاميرا)..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Talents List */}
            <div className="space-y-3">
              {filteredTalents.map((talent) => (
                <div 
                  key={talent.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img 
                      src={talent.image} 
                      alt={talent.name} 
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{talent.name}</h4>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-md font-medium">موثق</span>
                        <ExpertInstaPay expert={talent} />
                      </div>
                      <p className="text-xs text-indigo-300 font-medium">{talent.title}</p>
                      <p className="text-[11px] text-slate-400">{talent.department}</p>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-medium flex gap-1 text-white">البورتفوليو <span className="text-[9px] bg-[#FEF08A] text-black px-2 rounded-full">متميز</span></span>
                          <span className="text-gray-400">95%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#F3F3F3] rounded-full overflow-hidden">
                          <div className="h-full bg-black rounded-full" style={{width:'95%'}}></div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">3 مشاريع حقيقية - خبرة سنة</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-white/[0.06]">
                    <div className="flex flex-wrap gap-1.5">
                      {talent.skills.map((sk, sIdx) => (
                        <span key={sIdx} className="text-[10px] bg-white/[0.04] text-slate-300 px-2 py-0.5 rounded-md border border-white/[0.06]">
                          {sk}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-col items-center justify-center bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-1.5 min-w-[54px]">
                      <span className="text-[9px] text-slate-400 leading-none">OVR</span>
                      <span className="text-base font-black text-indigo-400 font-mono leading-none mt-1">{talent.ovr}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>هل تبحث عن توظيف مباشر؟</span>
              <button 
                onClick={() => { setTalentModalOpen(false); setJoinModalOpen(true); }}
                className="text-indigo-400 font-bold hover:underline"
              >
                سجل حساب مؤسسة في المنظومة ←
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
