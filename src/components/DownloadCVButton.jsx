import { useState } from 'react';

// DownloadCVButton.jsx - معزول تماما - لا يعدل على اي سيستم
export default function DownloadCVButton({ pdfUrl, fileName = "CV_مريم_محمد.pdf", onTrigger }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (onTrigger) {
        await onTrigger();
        setLoading(false);
        return;
      }
      
      if (!pdfUrl || pdfUrl === '#') {
        setLoading(false);
        return;
      }

      // بيحمل كـ blob عشان المتصفح ميتعطلش
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // لو فشل، يفتحه في تاب جديد
      if (pdfUrl && pdfUrl !== '#') {
        window.open(pdfUrl, '_blank');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={loading}
      className={`bg-black text-white px-6 py-2 rounded-full text-sm flex items-center gap-2 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'}`}
    >
      {loading ? (
        <>
          <span className="animate-spin">⏳</span>
          جاري التحميل...
        </>
      ) : (
        'تحميل الـ CV'
      )}
    </button>
  );
}
