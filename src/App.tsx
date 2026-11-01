import React, { useState } from 'react';
import { Trophy, Star, ChevronLeft, Zap, Info, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ExpertInstaPay from './components/ExpertInstaPay';
import MentorPaymentGateway from './components/MentorPaymentGateway';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const levels = [
  { level: 12, xp: "500+", rewards: ["صندوق فضي", "100 عملة"] },
  { level: 15, rewards: ["سكن نادر"] },
  { level: 20, rewards: ["لقب الأسطورة"] },
  { level: 25, rewards: ["صندوق ذهبي"] },
  { level: 30, rewards: ["1000 جوهرة"] },
  { level: 50, rewards: ["دخول خاص لمجتمع VIP"] },
  { level: 100, rewards: ["تمثال شرف في الساحة"] },
];

export default function App() {
  const [selectedLevel, setSelectedLevel] = useState<typeof levels[0] | null>(null);
  const [demoPaymentOpen, setDemoPaymentOpen] = useState(false);
  const [activeMentor, setActiveMentor] = useState<any>(null);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 font-sans overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] -z-10" />

      <header className="mb-12 text-center max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-2xl mb-4 ring-1 ring-purple-500/20">
            <Trophy className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            مستويات التقدم
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            استكشف المكافآت والمميزات الحصرية التي ستحصل عليها عند الوصول لكل مستوى جديد. العرض هنا يتميز بالبساطة والأناقة.
          </p>
        </motion.div>
      </header>

      <main className="w-full max-w-4xl">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-4 sm:gap-6"
        >
          {levels.map((l, index) => (
            <motion.button
              key={l.level}
              whileHover={{ scale: 1.05, translateY: -5 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedLevel(l)}
              className={cn(
                "relative group flex items-center gap-3 bg-purple-900/40 hover:bg-purple-900/60",
                "backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40",
                "rounded-full px-6 py-3 transition-all duration-300 shadow-lg shadow-purple-900/10",
                selectedLevel?.level === l.level && "ring-2 ring-purple-400 bg-purple-800/80"
              )}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                <Star className="w-4 h-4 text-purple-300" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-sm font-medium text-purple-100">المستوى {l.level}</span>
                {l.xp && (
                  <span className="text-[10px] text-purple-300/70 font-mono tabular-nums tracking-wider uppercase">
                    {l.xp} XP
                  </span>
                )}
              </div>
              
              {/* Decorative light effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))}
        </motion.div>

        {/* Level Details Panel */}
        <AnimatePresence mode="wait">
          {selectedLevel ? (
            <motion.div
              key={selectedLevel.level}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mt-16 p-8 bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 ring-1 ring-white/5 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500" />
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="flex-1 space-y-4 text-center sm:text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-full text-xs font-semibold text-purple-400 border border-purple-500/20">
                    <Zap className="w-3 h-3" />
                    مكافأة المستوى
                  </div>
                  <h2 className="text-3xl font-bold text-white">
                    جوائز المستوى {selectedLevel.level}
                  </h2>
                  <p className="text-slate-400">
                    بوصولك لهذا المستوى، ستفتح أبواباً جديدة من الميزات والقدرات داخل النظام.
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full sm:w-64">
                  {selectedLevel.rewards?.map((reward, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                      <span className="text-sm font-medium text-slate-200">{reward}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-16 text-center text-slate-500 flex flex-col items-center gap-4"
            >
              <div className="p-4 rounded-full bg-slate-900/50 border border-slate-800">
                <Info className="w-6 h-6 opacity-20" />
              </div>
              <p className="text-sm">اختر مستوى لمعاينة المكافآت المتاحة</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Demo Expert Section for InstaPay Component */}
      <section className="mt-24 w-full max-w-4xl border-t border-slate-800 pt-12 text-right" dir="rtl">
        <h2 className="text-2xl font-bold text-white mb-6">خبراء متاحون للاستشارة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-xl font-bold text-purple-400">
                أ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">أحمد كمال الدين</h3>
                  <ExpertInstaPay expert={{
                    name: 'أحمد كمال الدين',
                    instapay_link: 'ahmed@instapay',
                    instapay_qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ahmed@instapay'
                  }} />
                </div>
                <p className="text-xs text-slate-400">خبير مونتاج وتصحيح ألوان</p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveMentor({
                  name: 'أحمد كمال الدين',
                  price: 250,
                  instapay_link: 'ahmed@instapay',
                  instapay_qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ahmed@instapay'
                });
                setDemoPaymentOpen(true);
              }}
              className="px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>دفع السيشن</span>
            </button>
          </div>
          
          <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-xl font-bold text-blue-400">
                س
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">سارة الشامي</h3>
                  <ExpertInstaPay expert={{
                    name: 'سارة الشامي',
                    instapay_link: 'sara@instapay'
                  }} />
                </div>
                <p className="text-xs text-slate-400">صحفية استقصائية</p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveMentor({
                  name: 'سارة الشامي',
                  price: 200,
                  instapay_link: 'sara@instapay'
                });
                setDemoPaymentOpen(true);
              }}
              className="px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>دفع السيشن</span>
            </button>
          </div>
        </div>

        {demoPaymentOpen && activeMentor && (
          <MentorPaymentGateway
            expert={activeMentor}
            sessionDetails={{
              day: 'غداً الثلاثاء',
              time: '7:00 مساءً',
              question: 'مراجعة البورتفوليو والسكريبت الإخباري',
              amount: activeMentor.price
            }}
            onSuccess={(receipt) => {
              alert(`تم تأكيد الدفع بنجاح! رقم المعاملة: ${receipt.transactionId}`);
              setDemoPaymentOpen(false);
            }}
            onClose={() => setDemoPaymentOpen(false)}
          />
        )}
      </section>

      <footer className="mt-24 text-slate-600 text-sm flex items-center gap-4">
        <span>© 2024 نظام التقدم الذكي</span>
        <span className="w-1 h-1 rounded-full bg-slate-800" />
        <a href="#" className="hover:text-purple-400 transition-colors">اتصل بنا</a>
      </footer>
    </div>
  );
}
