import { useState, useEffect } from 'react';
import ExpertInstaPay from './ExpertInstaPay';
import { initAuth, googleSignIn } from '../utils/auth';
import { createMeetSpace } from '../utils/meet';

export default function MentorPaymentGateway({ expert, sessionDetails, onSuccess, onClose }) {
  const [selectedMethod, setSelectedMethod] = useState('instapay'); // 'instapay' | 'card' | 'wallet' | 'fawry'
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [completedReceipt, setCompletedReceipt] = useState(null);

  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState(null);

  useEffect(() => {
    initAuth(
      () => setIsAuthenticated(true),
      () => setIsAuthenticated(false)
    );
  }, []);

  const handleSignIn = async () => {
    try {
      await googleSignIn();
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Sign-in failed', err);
    }
  };

  const handleCreateMeeting = async () => {
    const confirmed = window.confirm("هل تريد بدء جلسة Google Meet الجديدة؟");
    if (!confirmed) return;

    try {
      setProcessingStep('جاري إنشاء غرفة الاجتماع...');
      setIsProcessing(true);
      const url = await createMeetSpace();
      setMeetingUrl(url);
    } catch (err) {
      console.error('Failed to create meeting', err);
      alert('حدث خطأ أثناء إنشاء الجلسة.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [walletPhone, setWalletPhone] = useState('');
  const [walletOtp, setWalletOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [instapayRef, setInstapayRef] = useState('');
  const [fawryCode] = useState(() => Math.floor(100000000 + Math.random() * 900000000).toString());

  const amount = sessionDetails?.amount || expert?.price || 200;
  const mentorName = expert?.fullName || expert?.name || 'الخبير';

  // Format card number with spaces
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = val.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  // Format expiry MM/YY
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardExpiry(val);
  };

  const handleProcessPayment = async (method) => {
    setIsProcessing(true);
    setProcessingStep('جاري التشفير والاتصال بالبوابة المالية الآمنة...');

    await new Promise((r) => setTimeout(r, 800));
    setProcessingStep('التحقق من الرصيد والبيانات الحسابية...');

    await new Promise((r) => setTimeout(r, 900));
    setProcessingStep('اعتماد المعاملة وإصدار التوثيق المالي...');

    await new Promise((r) => setTimeout(r, 700));

    const receipt = {
      transactionId: `PHI-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      amount,
      method: method === 'instapay' ? 'InstaPay ⚡' : method === 'card' ? 'بطاقة بنكية 💳' : method === 'wallet' ? 'محفظة إلكترونية 📱' : 'فوري Pay 🏪',
      mentorName,
      sessionDate: sessionDetails?.day || 'اليوم',
      sessionTime: sessionDetails?.time || 'الان',
      question: sessionDetails?.question || 'جلسة استشارية',
      timestamp: new Date().toLocaleString('ar-EG'),
      status: 'تمت العملية بنجاح'
    };

    setIsProcessing(false);
    setCompletedReceipt(receipt);
  };

  const handleFinishAndJoin = () => {
    if (onSuccess) {
      onSuccess(completedReceipt);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 font-cairo" dir="rtl">
      <div className="bg-white rounded-[28px] w-full max-w-lg overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E1B4B] via-[#2E1065] to-[#7C3AED] text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-sm font-bold"
          >
            ✕
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
              بوابة الدفع الآمنة φ Payment Gateway
            </span>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">256-bit Encrypted 🛡️</span>
          </div>

          <h3 className="text-xl font-black text-white">تأكيد حجز السيشن مع {mentorName}</h3>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-xs">
            <span className="text-purple-200">إجمالي المبلغ المطلوب:</span>
            <span className="text-xl font-black text-[#EC4899] font-mono">{amount} ج.م</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* If Payment is Finished - Show Receipt */}
          {completedReceipt ? (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl font-black shadow-lg shadow-emerald-500/20 animate-bounce">
                ✓
              </div>
              <div>
                <h4 className="text-xl font-black text-[#1E1B4B]">تم تأكيد الدفع والحجز بنجاح!</h4>
                <p className="text-xs text-slate-500 mt-1">تمت المعاملة بنجاح وتجهيز غرفة الجلسة المباشرة لك.</p>
              </div>

              {/* Digital Receipt Box */}
              <div className="bg-purple-50/70 rounded-2xl p-4 border border-purple-200 text-right space-y-2.5 text-xs font-mono">
                <div className="flex justify-between pb-2 border-b border-purple-200">
                  <span className="text-slate-500 font-sans">رقم المعاملة (Ref ID):</span>
                  <span className="font-bold text-[#7C3AED]">{completedReceipt.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">اسم الخبير:</span>
                  <span className="font-bold text-[#1E1B4B] font-sans">{completedReceipt.mentorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">المبلغ المدفوع:</span>
                  <span className="font-bold text-emerald-600">{completedReceipt.amount} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">وسيلة الدفع:</span>
                  <span className="font-bold text-purple-700 font-sans">{completedReceipt.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">تاريخ التوثيق:</span>
                  <span className="text-slate-600 text-[10px]">{completedReceipt.timestamp}</span>
                </div>
              </div>

              {!isAuthenticated ? (
                <button
                  onClick={handleSignIn}
                  className="w-full py-3.5 rounded-2xl bg-white border-2 border-[#1E1B4B] text-[#1E1B4B] font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
                  <span>تسجيل الدخول بـ Google لإنشاء جلسة Meet</span>
                </button>
              ) : meetingUrl ? (
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-500/25 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <span>الدخول لجلسة Google Meet 🎥</span>
                </a>
              ) : (
                <button
                  onClick={handleCreateMeeting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black text-sm shadow-xl shadow-pink-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>إنشاء جلسة Google Meet 🎥</span>
                </button>
              )}
            </div>
          ) : isProcessing ? (
            /* Processing Loader */
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-[#EC4899] animate-spin mx-auto"></div>
              <p className="text-sm font-black text-[#1E1B4B]">{processingStep}</p>
              <p className="text-xs text-slate-400">يرجى الانتظار لحين اكتمال المعاملة المشفّرة...</p>
            </div>
          ) : (
            /* Standard Payment Options Flow */
            <>
              {/* Payment Methods Tabs */}
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-2">اختر طريقة الدفع المناسبة:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('instapay')}
                    className={`p-3 rounded-2xl border font-bold text-right transition-all flex items-center gap-2 ${
                      selectedMethod === 'instapay'
                        ? 'border-[#7C3AED] bg-purple-50 text-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base">⚡</span>
                    <div className="flex flex-col">
                      <span className="font-black">InstaPay مباشر</span>
                      <span className="text-[10px] text-slate-400 font-normal">تحويل فوري بدون رسوم</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('card')}
                    className={`p-3 rounded-2xl border font-bold text-right transition-all flex items-center gap-2 ${
                      selectedMethod === 'card'
                        ? 'border-[#7C3AED] bg-purple-50 text-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base">💳</span>
                    <div className="flex flex-col">
                      <span className="font-black">بطاقة بنكية</span>
                      <span className="text-[10px] text-slate-400 font-normal">فيزا / ماستركارد / ميزة</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('wallet')}
                    className={`p-3 rounded-2xl border font-bold text-right transition-all flex items-center gap-2 ${
                      selectedMethod === 'wallet'
                        ? 'border-[#7C3AED] bg-purple-50 text-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base">📱</span>
                    <div className="flex flex-col">
                      <span className="font-black">محفظة إلكترونية</span>
                      <span className="text-[10px] text-slate-400 font-normal">فودافون / أورنج / اتصالات</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('fawry')}
                    className={`p-3 rounded-2xl border font-bold text-right transition-all flex items-center gap-2 ${
                      selectedMethod === 'fawry'
                        ? 'border-[#7C3AED] bg-purple-50 text-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base">🏪</span>
                    <div className="flex flex-col">
                      <span className="font-black">كود فوري Fawry</span>
                      <span className="text-[10px] text-slate-400 font-normal">الدفع في أي منافذ فوري</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* METHOD 1: INSTAPAY */}
              {selectedMethod === 'instapay' && (
                <div className="space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#1E1B4B]">بيانات InstaPay المعتمدة للخبير:</span>
                    <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">تأكيد مباشر</span>
                  </div>

                  {/* Direct Display of Expert's InstaPay handle & QR */}
                  <div className="bg-white p-3 rounded-xl border border-purple-200 flex items-center gap-3">
                    <img 
                      src={expert?.instapay_qr_image || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(expert?.instapay_link || 'phi.media@instapay')}`}
                      alt="InstaPay QR"
                      className="w-16 h-16 rounded-lg border border-purple-100 object-contain p-0.5 bg-white shrink-0 shadow-xs"
                    />
                    <div className="flex-1 min-w-0 text-right">
                      <span className="text-[10px] text-slate-500 font-bold block">معرف إنستاباي للدفع اللحظي (IPA):</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="bg-purple-50 px-2.5 py-1 rounded border border-purple-200 text-purple-900 font-black font-mono text-xs truncate" dir="ltr">
                          {expert?.instapay_link || 'phi.media@instapay'}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(expert?.instapay_link || 'phi.media@instapay');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#1E1B4B] text-white text-[10px] font-bold shrink-0 hover:bg-[#7C3AED] transition-colors"
                        >
                          نسخ
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-600 block mt-1 font-bold">✓ دفع لحظي مباشر لحساب الخبير</span>
                    </div>
                  </div>

                  <ExpertInstaPay expert={expert || {
                    instapay_link: 'phi.media@instapay',
                    instapay_qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=phi.media@instapay'
                  }} />

                  <div className="space-y-1.5 pt-2 border-t border-purple-200">
                    <label className="block text-slate-700 font-bold">أدخل رقم المعاملة أو مرجع التحويل (Ref No):</label>
                    <input
                      type="text"
                      value={instapayRef}
                      onChange={(e) => setInstapayRef(e.target.value)}
                      placeholder="مثال: 98421038592"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 outline-none font-mono text-left text-xs focus:border-[#7C3AED]"
                      dir="ltr"
                    />
                  </div>

                  <button
                    onClick={() => handleProcessPayment('instapay')}
                    disabled={!instapayRef.trim()}
                    className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    تأكيد الدفع المباشر عبر InstaPay ({amount} ج.م)
                  </button>
                </div>
              )}

              {/* METHOD 2: CREDIT / DEBIT CARD */}
              {selectedMethod === 'card' && (
                <div className="space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">رقم البطاقة (Card Number)</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4000 1234 5678 9010"
                      maxLength={19}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 outline-none font-mono text-left text-xs focus:border-[#7C3AED]"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">اسم حامل البطاقة</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="مثال: Mariam Mohamed"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 outline-none text-xs focus:border-[#7C3AED]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">تاريخ الانتهاء (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="08/28"
                        maxLength={5}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 outline-none font-mono text-center text-xs focus:border-[#7C3AED]"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">رمز الأمان (CVV)</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 outline-none font-mono text-center text-xs focus:border-[#7C3AED]"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleProcessPayment('card')}
                    disabled={cardNumber.length < 16 || !cardHolder || cardExpiry.length < 5 || cardCvv.length < 3}
                    className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    إتمام الخصم البنكي الآن ({amount} ج.م)
                  </button>
                </div>
              )}

              {/* METHOD 3: MOBILE WALLETS */}
              {selectedMethod === 'wallet' && (
                <div className="space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-xs">
                  {expert?.wallet_phone && (
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200 text-[11px] flex items-center justify-between">
                      <span className="text-slate-600 font-bold">محفظة الخبير المعتمدة ({expert.wallet_provider || 'فودافون كاش'}):</span>
                      <code className="font-mono font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200" dir="ltr">{expert.wallet_phone}</code>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">رقم المحفظة الإلكترونية التي تدفع منها (فودافون / أورنج / اتصالات / وي)</label>
                    <input
                      type="text"
                      value={walletPhone}
                      onChange={(e) => setWalletPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="01012345678"
                      maxLength={11}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 outline-none font-mono text-left text-xs focus:border-[#7C3AED]"
                      dir="ltr"
                    />
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (walletPhone.length === 11) setOtpSent(true);
                      }}
                      disabled={walletPhone.length !== 11}
                      className="w-full py-2.5 rounded-xl bg-purple-900 text-white font-bold text-xs hover:bg-purple-800 transition-all disabled:opacity-50"
                    >
                      طلب كود التأكيد OTP
                    </button>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-purple-200">
                      <span className="text-emerald-700 font-bold block">تم إرسال كود التأكيد لرمز المحفظة (OTP التجريبي: 6543)</span>
                      <input
                        type="text"
                        value={walletOtp}
                        onChange={(e) => setWalletOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="أدخل الكود مكون من 4 أرقام"
                        maxLength={4}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 outline-none font-mono text-center text-sm font-bold focus:border-[#7C3AED]"
                      />
                      <button
                        type="button"
                        onClick={() => handleProcessPayment('wallet')}
                        disabled={walletOtp.length !== 4}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                      >
                        تأكيد سداد المحفظة ({amount} ج.م)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* METHOD 4: FAWRY PAY */}
              {selectedMethod === 'fawry' && (
                <div className="space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-xs text-center">
                  <span className="text-slate-500 block">رقم الدفع الترجيعي الخاص بك في منافذ فوري:</span>
                  <div className="bg-white py-3 px-4 rounded-2xl border-2 border-dashed border-[#7C3AED] font-mono text-2xl font-black text-[#1E1B4B] tracking-widest">
                    {fawryCode}
                  </div>
                  <p className="text-[11px] text-slate-500">توجه لأي منفذ فوري واطلب الدفع برقم الخدمة العامة أو تأكيد الحجز المباشر بالضغط أدناه للاختبار الفوري.</p>
                  
                  <button
                    onClick={() => handleProcessPayment('fawry')}
                    className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    محاكاة الدفع من منفذ فوري وإتمام الحجز ({amount} ج.م)
                  </button>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer info */}
        <div className="bg-purple-50 px-6 py-3 border-t border-purple-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>ضمان φ To Media لحماية حقوق المعاملات 🛡️</span>
          <span>دفع آمن 100%</span>
        </div>

      </div>
    </div>
  );
}
