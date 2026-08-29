import { useState } from 'react';
import {
  LayoutDashboard,
  UserCheck,
  FileBarChart,
  Calendar,
  Users,
  Settings,
  LogOut,
  QrCode,
  X,
  HelpCircle,
  FileText,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile?: boolean;
  setIsOpenMobile?: (open: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpenMobile, setIsOpenMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Presensi Hari Ini', icon: UserCheck },
    { id: 'leave', label: 'Pengajuan & Riwayat Izin', icon: FileText },
    { id: 'reports', label: 'Laporan Presensi', icon: FileBarChart },
    { id: 'schedule', label: 'Jadwal Mengajar', icon: Calendar },
    ...(user?.role === 'ADMIN'
      ? [{ id: 'qr-terminal', label: 'Terminal QR Sekolah', icon: QrCode }]
      : []),
    ...(user?.role === 'ADMIN' || user?.role === 'PRINCIPAL'
      ? [{ id: 'users', label: 'Kelola Pengguna', icon: Users }]
      : [])
  ];

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const content = (
    <div className="h-full flex flex-col justify-between p-4 sm:p-6 bg-white border-r border-slate-200">
      
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://cdn.schoolpro.id/public-registration/1782136552284-18747eee3e1c432291f9002be1c93df8.webp"
              alt="Logo UPT SPF SD INPRES PAJJAIANG 2"
              className="w-9 h-9 object-contain"
            />
            <div>
              <h1 className="text-xs font-extrabold text-slate-900 leading-tight">
                Absensi Guru SD
              </h1>
              <p className="text-[10px] font-semibold text-brand-500 truncate max-w-[140px]">
                SD INPRES PAJJAIANG 2
              </p>
            </div>
          </div>
          {setIsOpenMobile && (
            <button
              onClick={() => setIsOpenMobile(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 pt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (setIsOpenMobile) setIsOpenMobile(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-pwa-install-guide'));
            if (isOpenMobile) setIsOpenMobile?.(false);
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 transition-all border border-brand-200/60 mb-2"
          title="Petunjuk Install Aplikasi HP di Android & iOS"
        >
          <Smartphone className="w-4 h-4 text-brand-500 shrink-0" />
          <span>Install Aplikasi HP</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('settings');
            if (isOpenMobile) setIsOpenMobile?.(false);
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white font-bold shadow-md shadow-slate-900/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Pengaturan</span>
        </button>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Keluar Akun</span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 fixed inset-y-0 left-0 z-30">
        {content}
      </aside>

      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex">
          <div className="w-72 max-w-[80vw] h-full shadow-2xl">
            {content}
          </div>
          <div className="flex-1" onClick={() => setIsOpenMobile?.(false)} />
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center relative">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Keluar Akun
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin keluar dari akun <strong>{user?.fullName}</strong>?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md shadow-rose-600/20"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
