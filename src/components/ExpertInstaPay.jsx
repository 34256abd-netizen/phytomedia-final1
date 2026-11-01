import { useState } from 'react';

export default function ExpertInstaPay({ expert }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // لو الخبير مش حاطط حاجة، الكومبوننت يختفي تماما ومش هيأثر على التصميم
  if (!expert?.instapay_link && !expert?.instapay_qr_image) {
    return null;
  }

  const handleCopy = () => {
    if (expert.instapay_link) {
      navigator.clipboard.writeText(expert.instapay_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* زرار صغير - حطه جنب اسم الخبير */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f6f6f6] hover:bg-black hover:text-white transition-all text-xs font-medium"
        title="ادفع مباشر للخبير"
      >
        <span>⚡</span> Instapay
      </button>

      {/* المودال - فوق الصفحة - مش بيغير اي حاجة في الصفحة */}
      {open && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div 
            className="bg-white rounded-[24px] p-6 w-full max-w-[340px] shadow-2xl text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">ادفع مباشر للخبير</h3>
              <button onClick={() => setOpen(false)} className="text-xl text-gray-500 hover:text-black">×</button>
            </div>

            {expert.instapay_qr_image && (
              <img 
                src={expert.instapay_qr_image} 
                alt="InstaPay QR"
                className="w-full h-auto rounded-xl border mb-4"
              />
            )}

            {expert.instapay_link && (
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={expert.instapay_link}
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-xs truncate font-mono text-left"
                  dir="ltr"
                />
                <button 
                  onClick={handleCopy}
                  className="bg-black text-white rounded-full px-4 py-2 text-xs transition-colors shrink-0"
                >
                  {copied ? 'تم النسخ!' : 'نسخ'}
                </button>
              </div>
            )}
            
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              الدفع يتم مباشرة للخبير خارج نظام المنصة
            </p>
          </div>
        </div>
      )}
    </>
  );
}
