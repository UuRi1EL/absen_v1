import { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare, MoreVertical } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState<'android' | 'ios'>('android');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);
    if (isIosDevice) {
      setGuideTab('ios');
    } else {
      setGuideTab('android');
    }

    const handleOpenGlobalGuide = () => {
      setShowGuideModal(true);
    };

    window.addEventListener('open-pwa-install-guide', handleOpenGlobalGuide);

    // Check if already in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return () => window.removeEventListener('open-pwa-install-guide', handleOpenGlobalGuide);
    }

    if (isIosDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('open-pwa-install-guide', handleOpenGlobalGuide);
      };
    }

    // Android / Chrome PWA install prompt event listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install-guide', handleOpenGlobalGuide);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setGuideTab('ios');
      setShowGuideModal(true);
      return;
    }

    if (!deferredPrompt) {
      setGuideTab('android');
      setShowGuideModal(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User menerima instalasi PWA');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt && !showGuideModal) return null;

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      {showPrompt && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-in no-print">
          <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.schoolpro.id/public-registration/1782136552284-18747eee3e1c432291f9002be1c93df8.webp"
                  alt="Logo Sekolah"
                  className="w-11 h-11 object-contain bg-white/10 p-1.5 rounded-2xl border border-white/20 shrink-0"
                />
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-brand-400" />
                    Install Aplikasi Presensi SD 2
                  </h4>
                  <p className="text-[10px] text-slate-300 font-medium leading-snug mt-0.5">
                    Pasang di layar HP Anda untuk akses presensi kilat 1-klik tanpa lewat browser.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrompt(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
                title="Tutup Peringatan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-xs transition shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Install Aplikasi Sekarang</span>
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs transition"
              >
                Nanti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dual Android & iOS PWA Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-slate-800 animate-modal-pop">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-brand-500" /> Panduan Install Aplikasi HP
              </h3>
              <button onClick={() => setShowGuideModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Selector: Android vs iOS */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-extrabold text-slate-600">
              <button
                type="button"
                onClick={() => setGuideTab('android')}
                className={`py-2 rounded-xl transition ${
                  guideTab === 'android' ? 'bg-white text-brand-600 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                🤖 Android (Chrome)
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('ios')}
                className={`py-2 rounded-xl transition ${
                  guideTab === 'ios' ? 'bg-white text-brand-600 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                🍏 iPhone (iOS)
              </button>
            </div>

            {/* Tab 1: Android Guide */}
            {guideTab === 'android' && (
              <div className="space-y-3 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-7 h-7 rounded-xl bg-brand-100 text-brand-600 font-black flex items-center justify-center shrink-0">1</div>
                  <div>Tap ikon <strong>Menu (Titik Tiga ⋮)</strong> di kanan atas Chrome <MoreVertical className="w-3.5 h-3.5 inline text-brand-500" /></div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-7 h-7 rounded-xl bg-brand-100 text-brand-600 font-black flex items-center justify-center shrink-0">2</div>
                  <div>Pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong> atau <strong>"Install Aplikasi"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-brand-500" /></div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-7 h-7 rounded-xl bg-brand-100 text-brand-600 font-black flex items-center justify-center shrink-0">3</div>
                  <div>Tekan <strong>"Install / Tambah"</strong>. Aplikasi akan muncul di Home Screen HP Anda!</div>
                </div>
              </div>
            )}

            {/* Tab 2: iOS Guide */}
            {guideTab === 'ios' && (
              <div className="space-y-3 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center shrink-0">1</div>
                  <div>Tap ikon <strong>Share / Bagikan (Kotak Panah Ke Atas ⬆️)</strong> di <strong>TENGAH BAWAH LAYAR SAFARI</strong> <Share2 className="w-4 h-4 inline text-amber-600 font-bold ml-1" /><br/><span className="text-[10px] text-amber-700 font-normal">*Bukan ikon AA / Page Menu di samping URL</span></div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-7 h-7 rounded-xl bg-brand-100 text-brand-600 font-black flex items-center justify-center shrink-0">2</div>
                  <div>Gulir menu ke bawah & pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong> <PlusSquare className="w-4 h-4 inline text-brand-500 ml-1" /></div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-7 h-7 rounded-xl bg-brand-100 text-brand-600 font-black flex items-center justify-center shrink-0">3</div>
                  <div>Tap <strong>"Tambah" (Add)</strong> di pojok kanan atas layar iPhone Anda.</div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md transition"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
