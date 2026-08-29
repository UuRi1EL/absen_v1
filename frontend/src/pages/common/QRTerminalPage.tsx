import { useState, useEffect } from 'react';
import { api } from '../../utils/axios.instance';
import { ShieldCheck, Clock, ArrowLeft, Wifi } from 'lucide-react';

export default function QRTerminalPage({ onBack }: { onBack?: () => void }) {
  const [qrToken, setQrToken] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchQRToken = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/qrcode/generate');
      setQrToken(res.data.data.qrToken);
      setCountdown(30);
    } catch (err) {
      console.error('Gagal mengambil token QR:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQRToken();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchQRToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Determine effective host for mobile phone Wi-Fi connection
  // If opened via localhost on Laptop, replace with network IP '192.168.1.53' so HP can reach laptop over Wi-Fi!
  let currentHost = window.location.host;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    currentHost = `192.168.1.53:${window.location.port || '5173'}`;
  }

  const targetUrl = qrToken
    ? `${window.location.protocol}//${currentHost}/?qrToken=${encodeURIComponent(qrToken)}`
    : '';

  const qrImageUrl = targetUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}`
    : '';

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Back to Dashboard Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </button>
      )}

      {/* Terminal Card */}
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6 text-center z-10 animate-modal-pop">
        
        {/* School Header */}
        <div className="flex flex-col items-center gap-2">
          <img
            src="https://cdn.schoolpro.id/public-registration/1782136552284-18747eee3e1c432291f9002be1c93df8.webp"
            alt="Logo Sekolah"
            className="w-16 h-16 object-contain animate-float"
          />
          <h1 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
            UPT SPF SD INPRES PAJJAIANG 2
          </h1>
          <h2 className="text-lg font-black text-brand-400">
            TERMINAL KODE QR PRESENSI GURU
          </h2>
        </div>

        {/* QR Code Container */}
        <div className="p-5 bg-white rounded-3xl inline-block shadow-inner relative border-4 border-brand-500/30">
          {isLoading || !qrImageUrl ? (
            <div className="w-64 h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              <span className="text-xs font-semibold">Memuat Kode QR...</span>
            </div>
          ) : (
            <img
              src={qrImageUrl}
              alt="QR Code Terminal Presensi"
              className="w-64 h-64 object-contain rounded-xl"
            />
          )}
        </div>

        {/* Dynamic Countdown & Security Badge */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-brand-400 font-bold text-xs">
            <Clock className="w-4 h-4 text-brand-400 animate-pulse" />
            <span>Memperbarui dalam: <strong className="text-white font-mono text-sm">{countdown}d</strong></span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-700 rounded-2xl text-xs space-y-1 text-left">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span className="flex items-center gap-1.5 text-brand-400">
                <Wifi className="w-3.5 h-3.5" /> Jaringan Wi-Fi Sekolah:
              </span>
              <span className="text-[11px] font-mono text-emerald-400">{currentHost}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pastikan HP terhubung ke Wi-Fi yang sama dengan laptop (`http://{currentHost}`). Arahkan kamera HP untuk langsung presensi!
            </p>
          </div>

          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" /> Anti-Titip Absen Token Dinamis (AES 30s)
          </div>
        </div>

      </div>

    </div>
  );
}
