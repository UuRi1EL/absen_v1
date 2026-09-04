import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import {
  Settings,
  Lock,
  MapPin,
  Menu,
  CheckCircle2,
  HelpCircle,
  Camera,
  Upload,
  Edit3,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/axios.instance';
import { getSelfieUrl } from '../../utils/url.util';
import { toast } from '../../store/toastStore';

interface SettingsPageProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function SettingsPage({ activeTab = 'settings', setActiveTab }: SettingsPageProps) {
  const { user, login } = useAuth();
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Avatar Upload State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // School GPS & System Config State (Admin Only Edit)
  const [schoolData, setSchoolData] = useState<any>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('150');
  const [operatorPhone, setOperatorPhone] = useState('085298499891');

  const isAdminRole = user?.role === 'ADMIN';

  const fetchSchoolData = async () => {
    try {
      const res = await api.get('/school');
      const school = res.data.data;
      setSchoolData(school);
      if (school) {
        setLatitude(school.latitude?.toString() || '-5.1061803');
        setLongitude(school.longitude?.toString() || '119.5345679');
        setRadiusMeters(school.radiusMeters?.toString() || '150');
        setOperatorPhone(school.operatorPhone || '085298499891');
      }
    } catch (err) {
      console.error('Gagal mengambil data sekolah:', err);
    }
  };

  useEffect(() => {
    fetchSchoolData();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const [userNip, setUserNip] = useState(user?.nip || '');
  const [userFullName, setUserFullName] = useState(user?.fullName || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user) {
      setUserNip(user.nip || '');
      setUserFullName(user.fullName || '');
      setUserEmail(user.email || '');
    }
  }, [user]);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaveConfirm(true);
  };

  const handleSaveAll = async () => {
    setShowSaveConfirm(false);
    setSavedSuccess(false);

    try {
      let newAvatarUrl = user?.avatarUrl;

      if (avatarFile) {
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const avatarRes = await api.post('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        newAvatarUrl = avatarRes.data.data.avatarUrl;
      }

      // Update user NIP, Name, Email
      const profileRes = await api.patch('/users/profile', {
        nip: userNip.trim(),
        fullName: userFullName.trim(),
        email: userEmail.trim()
      });

      const updatedUserFromBackend = profileRes.data.data;

      if (isAdminRole) {
        await api.patch('/school', {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radiusMeters: parseFloat(radiusMeters),
          operatorPhone: operatorPhone.trim()
        });
        await fetchSchoolData();
      }

      if (user) {
        login(localStorage.getItem('accessToken') || '', {
          ...user,
          nip: updatedUserFromBackend?.nip || userNip.trim(),
          fullName: updatedUserFromBackend?.fullName || userFullName.trim(),
          email: updatedUserFromBackend?.email || userEmail.trim(),
          avatarUrl: newAvatarUrl
        });
      }

      setSavedSuccess(true);
      toast.success('Informasi profil & akun Anda berhasil diperbarui!');
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Gagal menyimpan profil:', err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan profil. Periksa NIP Anda.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await api.post('/auth/change-password', {
        oldPassword,
        newPassword
      });
      const succMsg = res.data.message || 'Password Anda berhasil diperbarui!';
      setPasswordSuccess(succMsg);
      toast.success(succMsg);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Gagal mengubah password. Periksa kembali password lama Anda.';
      setPasswordError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab || (() => {})}
        isOpenMobile={isOpenMobileSidebar}
        setIsOpenMobile={setIsOpenMobileSidebar}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpenMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-500">
              PENGATURAN AKUN & PERANGKAT • UPT SPF SD INPRES PAJJAIANG 2
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-brand-500" /> Pengaturan Akun
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Kelola profil pribadi, foto profil, dan keamanan password Anda
            </p>
          </div>

          {savedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Perubahan profil dan data sekolah berhasil disimpan!
            </div>
          )}

          {/* SECTION 1: PROFIL & FOTO */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Camera className="w-4 h-4 text-brand-500" /> Profil & Foto Pengguna
            </h2>

            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
              <div className="relative">
                <img
                  src={avatarPreview ? getSelfieUrl(avatarPreview) : user?.avatarUrl ? getSelfieUrl(user.avatarUrl) : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                  alt="Avatar User"
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-500 text-white shadow-lg hover:bg-brand-600 transition"
                  title="Ganti Foto Profil"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-extrabold text-slate-900 text-sm">{user?.fullName}</h3>
                <p className="text-xs font-mono text-slate-500">NIP: {user?.nip} • Role: {user?.role}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 mx-auto sm:mx-0 border border-slate-200"
                >
                  <Upload className="w-3.5 h-3.5 text-brand-500" /> Pilih Foto Profil Baru
                </button>
              </div>
            </div>

            <form onSubmit={handleOpenConfirm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>NIP / Nomor Induk Pegawai</span>
                    <span className="text-[10px] text-brand-600 font-bold">✏️ Dapat Diedit</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userNip}
                    onChange={(e) => setUserNip(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={userFullName}
                    onChange={(e) => setUserFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-brand-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Email Resmi Sekolah</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:border-brand-500 transition"
                />
              </div>

              {/* SCHOOL GPS GEOFENCING SECTION */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-500" /> Parameter Titik Koordinat GPS Sekolah
                  </h3>
                  {!isAdminRole && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Read-Only (Hanya Admin)
                    </span>
                  )}
                </div>

                {isAdminRole ? (
                  <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl space-y-3">
                    <div className="text-[11px] text-brand-700 font-bold flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> Pengaturan Operator: Anda dapat memperbarui koordinat GPS Sekolah
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Latitude</label>
                        <input
                          type="text"
                          required
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Longitude</label>
                        <input
                          type="text"
                          required
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Radius Validasi (Meter)</label>
                        <input
                          type="number"
                          required
                          value={radiusMeters}
                          onChange={(e) => setRadiusMeters(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-brand-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 mt-3">
                      <label className="font-bold text-slate-700 flex items-center justify-between">
                        <span>No. WhatsApp Bantuan Operator Login</span>
                        <span className="text-[10px] text-brand-600 font-bold">💬 Tampil di Halaman Login Guru</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={operatorPhone}
                        onChange={(e) => setOperatorPhone(e.target.value)}
                        placeholder="Contoh: 085298499891"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-brand-600 font-extrabold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-slate-600">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">LATITUDE SEKOLAH</div>
                      <div className="font-mono font-bold text-xs">{schoolData?.latitude || '-5.1061803'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">LONGITUDE SEKOLAH</div>
                      <div className="font-mono font-bold text-xs">{schoolData?.longitude || '119.5345679'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">RADIUS GEOFENCE</div>
                      <div className="font-bold text-xs text-brand-600">{schoolData?.radiusMeters || 150} Meter</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">WA BANTUAN OPERATOR</div>
                      <div className="font-bold text-xs text-emerald-600">{schoolData?.operatorPhone || '085298499891'}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition shadow-md shadow-brand-500/20"
                >
                  Simpan Perubahan Profil
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: GANTI PASSWORD MANDIRI */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="w-4 h-4 text-brand-500" /> Ubah Password Saya
            </h2>

            {passwordSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Password Lama / Saat Ini</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password lama Anda"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password baru"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition shadow-md shadow-brand-500/20 disabled:opacity-50"
                >
                  {isChangingPassword ? 'Memperbarui...' : 'Perbarui Password Saya'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* CONFIRMATION MODAL */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center relative">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Simpan Profil
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menyimpan data profil Anda?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAll}
                disabled={isUploadingAvatar}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition shadow-md shadow-brand-500/20"
              >
                {isUploadingAvatar ? 'Mengunggah...' : 'Ya, Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
