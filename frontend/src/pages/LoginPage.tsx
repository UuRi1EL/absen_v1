import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/axios.instance';
import {
  KeyRound,
  UserCheck,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowRight,
  MapPin,
  AlertCircle,
  Sparkles,
  Smartphone,
  MessageCircle
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatorPhone, setOperatorPhone] = useState('085298499891');

  React.useEffect(() => {
    api.get('/school')
      .then((res) => {
        if (res.data.data?.operatorPhone) {
          setOperatorPhone(res.data.data.operatorPhone);
        }
      })
      .catch((err) => console.warn('Gagal memuat kontak operator:', err));
  }, []);

  const formatWaNumber = (num: string) => {
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return cleaned || '6285298499891';
  };

  const waUrl = `https://wa.me/${formatWaNumber(operatorPhone)}?text=${encodeURIComponent(
    'Halo Operator UPT SPF SD Inpres Pajjaiang 2, saya butuh bantuan mengenai akun/login presensi guru.'
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/login', { nip: nip.trim(), password: password.trim() });
      const { accessToken, user } = res.data.data;
      login(accessToken, user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Periksa NIP dan Password Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex items-stretch">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* LEFT COLUMN - LOGIN FORM PANEL / MOBILE CARD WRAPPER */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-0 lg:p-12 bg-slate-100/80 lg:bg-white z-10 animate-modal-pop lg:shadow-2xl selection:bg-brand-500 selection:text-white">
          
          {/* DESKTOP TOP BRAND HEADER (VISIBLE ONLY ON DESKTOP) */}
          <div className="hidden lg:flex items-center gap-3 mb-6">
            <img
              src="https://cdn.schoolpro.id/public-registration/1782136552284-18747eee3e1c432291f9002be1c93df8.webp"
              alt="Logo UPT SPF SD INPRES PAJJAIANG 2"
              className="w-12 h-12 object-contain drop-shadow-md shrink-0"
            />
            <div>
              <h2 className="text-xs font-black text-slate-900 tracking-tight leading-tight uppercase">
                UPT SPF SD INPRES PAJJAIANG 2
              </h2>
              <p className="text-[10px] text-brand-600 font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand-500" /> Biringkanaya, Kota Makassar
              </p>
            </div>
          </div>

          {/* MOBILE HERO CURVED HEADER (VISIBLE ONLY ON MOBILE) */}
          <div className="lg:hidden relative bg-gradient-to-b from-slate-950 via-brand-950 to-brand-900 text-white pt-8 pb-14 px-5 rounded-b-[36px] shadow-xl overflow-hidden">
            {/* Ambient decorative glow */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 -left-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header Top Row: Logo & School Identity */}
            <div className="relative z-10 flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                <img
                  src="https://cdn.schoolpro.id/public-registration/1782136552284-18747eee3e1c432291f9002be1c93df8.webp"
                  alt="Logo UPT SPF SD INPRES PAJJAIANG 2"
                  className="w-full h-full object-contain drop-shadow"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black tracking-tight text-white uppercase leading-snug truncate">
                  UPT SPF SD INPRES PAJJAIANG 2
                </h2>
                <p className="text-[10px] text-brand-200 font-bold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" /> Biringkanaya, Kota Makassar
                </p>
              </div>
            </div>

            {/* Badges & Hero Subtitle */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-amber-300 tracking-wider bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 backdrop-blur-xs">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  PORTAL RESMI PRESENSI
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Aktif 24/7
                </span>
              </div>
              <div className="text-base font-black text-white tracking-tight leading-snug">
                Sistem Absensi Guru & Tenaga Kependidikan
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                Validasi Geofencing GPS & Selfie Wajah Kedinasan
              </p>
            </div>
          </div>

          {/* FLOATING LOGIN CARD CONTAINER */}
          <div className="w-full max-w-sm mx-auto -mt-8 px-4 relative z-20 lg:mt-0 lg:px-0 lg:max-w-sm lg:my-auto">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-300/60 border border-slate-100 p-6 sm:p-8 lg:p-0 lg:shadow-none lg:border-0 lg:rounded-none transition-all space-y-5 sm:space-y-6">
              
              {/* Header Icon & Titles */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="inline-flex p-2.5 sm:p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/30 mb-1">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Sistem Presensi Guru
                </h1>
                <p className="text-xs font-semibold text-slate-500">
                  Masuk menggunakan NIP atau Email Resmi Kedinasan
                </p>
              </div>

              {/* Professional Error Alert */}
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-start gap-2.5 animate-shake shadow-xs">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-rose-800 text-[11px]">Gagal Masuk Ke Sistem</div>
                    <div className="text-[11px] text-rose-600 font-semibold leading-relaxed">{error}</div>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* NIP / EMAIL Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    NIP / EMAIL KEDINASAAN
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      placeholder="Masukkan NIP (Contoh: 19991219...)"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 pl-10 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 transition-all shadow-xs"
                    />
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* PASSWORD Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    KATA SANDI
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan Kata Sandi"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 pl-10 pr-10 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 transition-all shadow-xs"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-bold select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 accent-brand-600"
                    />
                    <span className="text-xs">Ingat Saya</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 hover:from-brand-700 hover:to-brand-600 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-lg shadow-brand-500/30 active:scale-[0.98] flex items-center justify-center gap-2 text-xs tracking-wide"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Masuk ke Sistem <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Quick Action Buttons (Install App HP & Bantuan Operator) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install-guide'))}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-bold text-[11px] transition active:scale-[0.98]"
                    title="Petunjuk Install Aplikasi HP di iOS & Android"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <span className="truncate">Install App HP</span>
                  </button>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 font-bold text-[11px] transition active:scale-[0.98]"
                    title="Hubungi Operator Sekolah via WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Bantuan WA</span>
                  </a>
                </div>
              </form>
            </div>
          </div>

          {/* Footer Contact (Desktop) */}
          <div className="hidden lg:flex text-[11px] text-slate-400 items-center justify-between border-t border-slate-100 pt-3 font-semibold">
            <span>© 2026 UPT SPF SD INPRES PAJJAIANG 2</span>
            <span className="text-brand-500 font-bold">Resmi Kedinasan</span>
          </div>

          {/* Footer Contact (Mobile) */}
          <div className="lg:hidden py-6 px-4 text-center text-[11px] text-slate-400 font-semibold space-y-1">
            <div>© 2026 UPT SPF SD INPRES PAJJAIANG 2</div>
            <div className="text-brand-600 font-bold text-[10px]">Portal Presensi Resmi Kedinasan</div>
          </div>
        </div>

        {/* RIGHT COLUMN - SINGLE HERO BANNER (SLIDE 2: CLASSROOM ANIMATION) */}
        <div className="hidden lg:col-span-6 xl:col-span-7 lg:flex relative bg-slate-950 text-white overflow-hidden items-end p-12 lg:p-16">
          
          {/* Background School Image (Slide 2: Classroom & Teacher Animation) */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-65 transition-all duration-700"
            style={{ backgroundImage: `url('/images/school_banner_2.jpg')` }}
          />
          
          {/* Official Theme Red/Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-brand-950/80 to-brand-700/40" />

          {/* Banner Content Container */}
          <div className="relative z-10 max-w-xl space-y-6">
            
            {/* Official School Logo Badge */}
            <div className="inline-flex items-center gap-3.5 p-3 px-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl">
              <img
                src="https://cdn.schoolpro.id/public-registration/1782136552284-18747eee3e1c432291f9002be1c93df8.webp"
                alt="Logo UPT SPF SD INPRES PAJJAIANG 2"
                className="w-10 h-10 object-contain drop-shadow-md shrink-0 bg-white/20 p-1 rounded-xl border border-white/30"
              />
              <div>
                <div className="text-[11px] font-black uppercase text-amber-300 tracking-wider">
                  UPT SPF SD INPRES PAJJAIANG 2
                </div>
                <div className="text-[10px] text-white/80 font-bold">
                  Dinas Pendidikan Kota Makassar • NPSN: 40307607
                </div>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Sistem Informasi Presensi Guru UPT SPF SD INPRES PAJJAIANG 2
            </h2>

            {/* Description */}
            <p className="text-brand-100 text-xs leading-relaxed font-medium opacity-90">
              Presensi Geofencing GPS & Validasi Selfie Wajah Terintegrasi Database Resmi Kemendikbudristek Kota Makassar.
            </p>

            {/* School Info Cards */}
            <div className="pt-4 border-t border-white/15 grid grid-cols-2 gap-4 text-xs">
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 p-4 rounded-2xl">
                <div className="text-brand-200 text-[10px] uppercase font-bold tracking-wider">Identitas Sekolah</div>
                <div className="font-extrabold text-white text-[11px] mt-1">
                  NPSN: 40307607 • Makassar
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 p-4 rounded-2xl">
                <div className="text-brand-200 text-[10px] uppercase font-bold tracking-wider">Alamat Fisik</div>
                <div className="font-semibold text-white text-[11px] mt-1 truncate">
                  Jl. Luwu Raya No.2 Perumnas Sudiang
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
