import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSelfieUrl } from '../utils/url.util';
import { 
  ShieldCheck, 
  LogOut, 
  Settings, 
  X, 
  Building2, 
  Mail, 
  Award
} from 'lucide-react';

interface UserProfileDropdownProps {
  customAvatarClass?: string;
  showTextLabels?: boolean;
  onOpenSettings?: () => void;
}

export default function UserProfileDropdown({ 
  customAvatarClass, 
  showTextLabels = true,
  onOpenSettings 
}: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user) return null;

  const displayName = user.fullName || 'Pegawai';
  const displayRole = user.role === 'ADMIN' 
    ? 'Operator Layanan Operasional / Admin' 
    : user.role === 'PRINCIPAL' 
      ? 'Kepala Sekolah' 
      : (user.teacherProfile?.position || 'Guru / Tenaga Pendidik');

  const nipOrNuptk = user.teacherProfile?.nuptk || user.nip || '-';
  const ukgId = user.teacherProfile?.ukgId || '202300256861';
  const ptkDapodikId = user.teacherProfile?.ptkDapodikId || '4551777678130053';
  const belajarId = user.teacherProfile?.belajarId || `${user.nip || 'pegawai'}@guru.sd.belajar.id`;
  const employmentStatus = user.teacherProfile?.employmentStatus || (user.role === 'TEACHER' ? 'Status Aktif (PPPK)' : 'Pegawai Tetap');
  const schoolName = user.teacherProfile?.school?.name || 'UPT SPF SD INPRES PAJJAIANG 2';

  const handleGoToSettings = () => {
    setIsOpen(false);
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      window.dispatchEvent(new CustomEvent('navigateTab', { detail: 'settings' }));
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun presensi?')) {
      logout();
    }
  };

  return (
    <>
      {/* Clickable Profile Trigger Pill/Avatar in Top Right Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 pl-3 border-l border-slate-200 hover:opacity-90 active:scale-95 transition text-left cursor-pointer group rounded-xl p-1 hover:bg-slate-100/70"
        title="Klik untuk melihat Kartu Profil Dapodik & Akun"
      >
        <div className="relative">
          {user?.avatarUrl ? (
            <img
              src={getSelfieUrl(user.avatarUrl)}
              alt={displayName}
              className={customAvatarClass || "w-9 h-9 rounded-full object-cover border-2 border-brand-500 shadow-md group-hover:border-brand-600 transition-all"}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-black flex items-center justify-center text-sm shadow-md shadow-brand-500/20 border-2 border-brand-300">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" title="Status Online & Aktif" />
        </div>

        {showTextLabels && (
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight group-hover:text-brand-600 transition flex items-center gap-1">
              {displayName}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 truncate max-w-[170px]">
              NIP: {nipOrNuptk}
            </div>
          </div>
        )}
      </button>

      {/* Floating Card Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          {/* Backdrop Overlay Click to Close */}
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

          <div className="relative bg-slate-900 text-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-700/80 z-10 space-y-0 transform transition-all animate-scale-up">
            
            {/* Top Modal Header Bar */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 flex items-center justify-between border-b border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">
                    KARTU INFORMASI RESMI DAPODIK & SIMPKB
                  </span>
                  <h3 className="text-sm font-bold text-white leading-tight">Profil Pengguna Presensi</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Hero Header */}
            <div className="p-5 bg-gradient-to-b from-slate-800/90 to-slate-900 border-b border-slate-700/60 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={getSelfieUrl(user.avatarUrl)}
                      alt={displayName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white font-black text-2xl flex items-center justify-center shadow-xl border-2 border-emerald-400">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                    VERIFIED
                  </span>
                </div>

                <div className="space-y-1 overflow-hidden">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold inline-block">
                    ✓ {employmentStatus}
                  </span>
                  <h2 className="text-lg font-black text-white leading-snug truncate" title={displayName}>
                    {displayName}
                  </h2>
                  <p className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{displayRole}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{schoolName}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Verified Dapodik Grid */}
            <div className="p-5 space-y-3 bg-slate-900">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                INTEGRASI PARAMETER AKUN & SIMPKB
              </span>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 space-y-1">
                  <div className="text-[10px] text-slate-400 font-medium">NIP / NUPTK Resmi</div>
                  <div className="font-mono font-bold text-emerald-400 truncate" title={nipOrNuptk}>
                    {nipOrNuptk}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 space-y-1">
                  <div className="text-[10px] text-slate-400 font-medium">No. UKG / SIMPKB-ID</div>
                  <div className="font-mono font-bold text-amber-300 truncate" title={ukgId}>
                    {ukgId}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 space-y-1">
                  <div className="text-[10px] text-slate-400 font-medium">PTK DAPODIK ID</div>
                  <div className="font-mono font-bold text-sky-400 truncate" title={ptkDapodikId}>
                    {ptkDapodikId}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 space-y-1">
                  <div className="text-[10px] text-slate-400 font-medium">Email / Akun Pembelajaran</div>
                  <div className="font-bold text-emerald-300 truncate flex items-center gap-1" title={belajarId}>
                    <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{belajarId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 bg-slate-800/90 border-t border-slate-700/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleGoToSettings}
                className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan Akun & Profil</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
