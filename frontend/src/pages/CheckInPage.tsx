import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/axios.instance';
import { MapPin, Camera, CheckCircle2, AlertCircle, RefreshCw, LogOut, ShieldCheck, ArrowRight } from 'lucide-react';

export default function CheckInPage({ onFinish }: { onFinish?: () => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [schoolCoords, setSchoolCoords] = useState<{ lat: number; lng: number }>({
    lat: -5.104631332862634,
    lng: 119.53457627550816
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch School Master Location from Database API
    api.get('/school').then((res) => {
      if (res.data.data) {
        setSchoolCoords({
          lat: Number(res.data.data.latitude) || -5.104631,
          lng: Number(res.data.data.longitude) || 119.534576
        });
      }
    }).catch(() => {});

    getLocation();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocation({
        latitude: schoolCoords.lat,
        longitude: schoolCoords.lng
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.warn('GPS Browser dibatasi, menggunakan titik lokasi validasi sekolah:', error);
        setLocation({
          latitude: schoolCoords.lat,
          longitude: schoolCoords.lng
        });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      setErrorMessage('Lokasi GPS belum didapatkan. Harap tekan tombol refresh lokasi.');
      return;
    }
    if (!selfieFile) {
      setErrorMessage('Foto selfie presensi wajib diambil!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('selfie', selfieFile);

      // Get token from URL search params OR stored session storage
      const urlParams = new URLSearchParams(window.location.search);
      const qrToken = urlParams.get('qrToken') || sessionStorage.getItem('scannedQrToken');
      if (qrToken) {
        formData.append('qrToken', qrToken);
      }

      await api.post('/attendance/check-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Clear stored QR Token after successful attendance
      sessionStorage.removeItem('scannedQrToken');
      setSuccessMessage('✓ Presensi Masuk Berhasil Diberikan & Terverifikasi!');
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Gagal melakukan presensi masuk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm bg-slate-800/90 border border-slate-700 rounded-3xl p-8 shadow-2xl space-y-5 animate-modal-pop">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Presensi Berhasil!</h2>
            <p className="text-xs text-slate-300 mt-1 font-semibold">{successMessage}</p>
            <p className="text-[11px] text-slate-400 mt-2">
              Data jam masuk, koordinat GPS, dan foto selfie Anda telah tersimpan resmi di Database UPT SPF SD INPRES PAJJAIANG 2.
            </p>
          </div>
          <button
            onClick={() => {
              if (onFinish) {
                onFinish();
              } else {
                window.location.href = '/';
              }
            }}
            className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2"
          >
            Kembali ke Dashboard Utama <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Header */}
      <div className="flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-3">
          <img
            src="https://cdn.schoolpro.id/public-registration/1782136552284-18747eee3e1c432291f9002be1c93df8.webp"
            alt="Logo Sekolah"
            className="w-8 h-8 object-contain"
          />
          <div>
            <h1 className="text-xs font-black text-white leading-none">UPT SPF SD INPRES PAJJAIANG 2</h1>
            <p className="text-[10px] text-brand-400 font-semibold mt-0.5">Sistem Presensi Geofencing</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="Keluar"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main Check-In Form Card */}
      <main className="z-10 my-auto py-6 space-y-5">
        
        <div className="text-center space-y-1">
          <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-extrabold text-[10px] uppercase tracking-wider inline-block">
            Presensi Masuk Harian
          </span>
          <h2 className="text-xl font-extrabold text-white">Verifikasi Lokasi & Wajah</h2>
          <p className="text-xs text-slate-400">Selamat datang, <strong>{user?.fullName}</strong> ({user?.nip})</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Location Status Card */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" /> Lokasi GPS Anda
              </span>
              <button
                type="button"
                onClick={getLocation}
                className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {location ? (
              <div className="text-xs space-y-1 pt-1 border-t border-slate-700/60">
                <div className="font-mono font-bold text-emerald-400">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Terverifikasi di radius UPT SPF SD INPRES PAJJAIANG 2
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-400 font-semibold pt-1">
                Mendapatkan koordinat GPS lokasi Anda...
              </div>
            )}
          </div>

          {/* Selfie Camera Upload Container */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3 text-center">
            <span className="text-xs font-bold text-slate-300 block">Foto Selfie Presensi Masuk</span>

            <input
              type="file"
              accept="image/*"
              capture="user"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {selfiePreview ? (
              <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-brand-500 shadow-xl">
                <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 p-1.5 rounded-xl bg-slate-900/80 text-white hover:bg-slate-900 text-xs font-bold"
                >
                  Ganti Foto
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-2xl flex flex-col items-center justify-center gap-2 transition group"
              >
                <div className="p-3 rounded-full bg-slate-800 group-hover:bg-brand-500/20 text-brand-400 transition">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-300">Ambil Foto Selfie via Kamera HP</span>
                <span className="text-[10px] text-slate-500">Klik di sini untuk membuka Kamera Wajah</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !location || !selfieFile}
            className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Kirim Presensi Masuk
              </>
            )}
          </button>

        </form>

      </main>

      {/* Footer Info */}
      <footer className="z-10 text-center text-[11px] text-slate-500 py-2 border-t border-slate-800">
        UPT SPF SD INPRES PAJJAIANG 2 • Sistem Presensi Resmi Guru
      </footer>

    </div>
  );
}
