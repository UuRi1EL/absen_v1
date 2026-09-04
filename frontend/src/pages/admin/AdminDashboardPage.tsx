import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/axios.instance';
import Sidebar from '../../components/Sidebar';
import NotificationDropdown from '../../components/NotificationDropdown';
import UserProfileDropdown from '../../components/UserProfileDropdown';
import SchoolMapPicker from '../../components/SchoolMapPicker';
import { toast } from '../../store/toastStore';
import { getSelfieUrl } from '../../utils/url.util';
import {
  Users,
  Plus,
  Search,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserX,
  MapPin,
  Clock,
  Edit3,
  Calendar,
  Camera,
  HelpCircle,
  Lock,
  Crown,
  Award,
  Eye,
  User,
  KeyRound,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  FileText,
  Paperclip,
  Trash2
} from 'lucide-react';

interface DashboardPageProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function AdminDashboardPage({ activeTab = 'dashboard', setActiveTab }: DashboardPageProps) {
  const { user } = useAuth();
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  const [teachers, setTeachers] = useState<any[]>([]);
  const [todayAttendances, setTodayAttendances] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selfie Photo Preview Modal State
  const [selectedSelfieModal, setSelectedSelfieModal] = useState<{ show: boolean; url: string; teacherName: string; time: string }>({ show: false, url: '', teacherName: '', time: '' });

  // School Config State
  const [schoolData, setSchoolData] = useState<any>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('150');
  const [operatorPhone, setOperatorPhone] = useState('085298499891');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [nip, setNip] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('Guru Kelas');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Master Leave Requests State for Admin
  const [allLeaveRequests, setAllLeaveRequests] = useState<any[]>([]);
  const [leaveFilterStatus, setLeaveFilterStatus] = useState<string>('ALL');

  // Detail & Action Eye Modal State
  const [showEyeModal, setShowEyeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit User Form State inside Eye Modal
  const [editNip, setEditNip] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('TEACHER');
  const [editPosition, setEditPosition] = useState('');
  const [editEmploymentStatus, setEditEmploymentStatus] = useState('Status Aktif (PPPK)');
  const [editUkgId, setEditUkgId] = useState('');
  const [editNuptk, setEditNuptk] = useState('');
  const [editPtkDapodikId, setEditPtkDapodikId] = useState('');
  const [editBelajarId, setEditBelajarId] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Reset Password State in Eye Modal
  const [customResetPassword, setCustomResetPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const handleResetUserPassword = async (userId: string) => {
    const trimmedPass = customResetPassword.trim();
    if (trimmedPass.length > 0 && trimmedPass.length < 6) {
      toast.warning('Password baru harus minimal 6 karakter!');
      return;
    }

    try {
      setIsResettingPassword(true);
      setResetMsg(null);
      const targetPass = trimmedPass || 'password123';
      await api.patch(`/users/${userId}/reset-password`, { newPassword: targetPass });
      toast.success(`Password berhasil di-reset menjadi: ${targetPass}`);
      setResetMsg(`Password berhasil di-reset menjadi: ${targetPass}`);
      setCustomResetPassword('');
      setTimeout(() => setResetMsg(null), 6000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mereset password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // User Action Confirmation Modal State
  const [userConfirmModal, setUserConfirmModal] = useState<{
    show: boolean;
    id: string | null;
    fullName: string;
    targetStatus: boolean;
  }>({
    show: false,
    id: null,
    fullName: '',
    targetStatus: false
  });

  // Delete User Confirmation Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    show: boolean;
    id: string | null;
    fullName: string;
  }>({
    show: false,
    id: null,
    fullName: ''
  });

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, schoolRes, reportRes, leaveRes] = await Promise.all([
        api.get('/users'),
        api.get('/school'),
        api.get(`/reports/monthly?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
        api.get('/leave')
      ]);
      setTeachers(usersRes.data.data || []);
      setAllLeaveRequests(leaveRes.data.data || []);
      const school = schoolRes.data.data;
      setSchoolData(school);
      if (school) {
        setLatitude(school.latitude?.toString() || '-5.1061803');
        setLongitude(school.longitude?.toString() || '119.5345679');
        setRadiusMeters(school.radiusMeters?.toString() || '150');
        setOperatorPhone(school.operatorPhone || '085298499891');
      }

      const isSameDayLocal = (d1: Date, d2: Date) => {
        return (
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate()
        );
      };
      const now = new Date();
      const raw = reportRes.data.data?.rawAttendances || [];
      const todayOnly = raw.filter((r: any) => {
        const recDate = new Date(r.checkInTime || r.createdAt || r.date);
        return isSameDayLocal(recDate, now);
      });
      setTodayAttendances(todayOnly);
    } catch (err) {
      console.error('Gagal mengambil data admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleOpenAddModal = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setNip('');
    setFullName('');
    setEmail('');
    setPassword('password123');
    setPhone('');
    setPosition('Guru Kelas');
    setShowAddModal(true);
  };

  const handleOpenEyeModal = (t: any) => {
    setSelectedUser(t);
    setEditNip(t.nip || '');
    setEditFullName(t.fullName || '');
    setEditEmail(t.email || '');
    setEditPhone(t.phone || '');
    setEditRole(t.role || 'TEACHER');
    setEditPosition(t.teacherProfile?.position || (t.role === 'ADMIN' ? 'Operator Layanan Operasional' : t.role === 'PRINCIPAL' ? 'Kepala Sekolah' : 'Guru Kelas'));
    setEditEmploymentStatus(t.teacherProfile?.employmentStatus || 'Status Aktif (PPPK)');
    setEditUkgId(t.teacherProfile?.ukgId || '');
    setEditNuptk(t.teacherProfile?.nuptk || '');
    setEditPtkDapodikId(t.teacherProfile?.ptkDapodikId || '');
    setEditBelajarId(t.teacherProfile?.belajarId || '');
    setIsEditMode(false);
    setShowEyeModal(true);
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      await api.post('/users', {
        nip,
        fullName,
        email,
        password,
        phone,
        position,
        department: 'Tenaga Pendidik',
        role: 'TEACHER'
      });

      setSuccessMsg(`Akun guru ${fullName} berhasil ditambahkan!`);
      setTimeout(() => {
        setShowAddModal(false);
        fetchAdminData();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menambahkan akun guru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmittingEdit(true);

    try {
      await api.patch(`/users/${selectedUser.id}`, {
        nip: editNip.trim(),
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        role: editRole,
        position: editPosition.trim(),
        employmentStatus: editEmploymentStatus,
        ukgId: editUkgId.trim(),
        nuptk: editNuptk.trim(),
        ptkDapodikId: editPtkDapodikId.trim(),
        belajarId: editBelajarId.trim()
      });

      toast.success(`Informasi akun & profil ${editFullName} berhasil diperbarui!`);
      setShowEyeModal(false);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui informasi pengguna.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmModal.id) return;
    try {
      await api.delete(`/users/${deleteConfirmModal.id}`);
      toast.success(`Akun pengguna ${deleteConfirmModal.fullName} berhasil dihapus secara permanen!`);
      setDeleteConfirmModal({ show: false, id: null, fullName: '' });
      setShowEyeModal(false);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus akun pengguna.');
    }
  };

  const handleSaveSchoolConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccessMsg(null);

    try {
      await api.patch('/school', {
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters),
        operatorPhone: operatorPhone.trim()
      });
      toast.success('Parameter Koordinat & Radius GPS Sekolah Berhasil Disimpan!');
      setConfigSuccessMsg('✓ Parameter Koordinat & Radius GPS Sekolah Berhasil Disimpan Ke Database!');
      await fetchAdminData();
      setTimeout(() => {
        setShowConfigModal(false);
      }, 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan koordinat sekolah.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const openUserConfirm = (id: string, fullName: string, currentStatus: boolean) => {
    setShowEyeModal(false);
    setUserConfirmModal({
      show: true,
      id,
      fullName,
      targetStatus: !currentStatus
    });
  };

  const handleConfirmUserToggle = async () => {
    if (!userConfirmModal.id) return;
    try {
      await api.patch(`/users/${userConfirmModal.id}/toggle-active`, { isActive: userConfirmModal.targetStatus });
      toast.success(`Status akun ${userConfirmModal.fullName} berhasil diubah!`);
      setUserConfirmModal({ show: false, id: null, fullName: '', targetStatus: false });
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status akun.');
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const teacherOnlyCount = teachers.filter((t) => t.role === 'TEACHER').length;

  // 100% REAL DYNAMIC DATABASE CALCULATION (CLEAN LABELS)
  const realPresentCount = todayAttendances.filter((r) => r.status === 'PRESENT').length;
  const realLateCount = todayAttendances.filter((r) => r.status === 'LATE').length;
  const realTotal = todayAttendances.length;
  const realAttendancePercentage = teacherOnlyCount > 0 ? Math.round((realPresentCount / teacherOnlyCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab || (() => {})}
        isOpenMobile={isOpenMobileSidebar}
        setIsOpenMobile={setIsOpenMobileSidebar}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpenMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-bold text-slate-500">
                PANEL ADMIN • UPT SPF SD INPRES PAJJAIANG 2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <UserProfileDropdown customAvatarClass="w-9 h-9 rounded-full object-cover border-2 border-amber-500 shadow-md" />
          </div>
        </header>

        <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* VIEW 1: ADMIN SYSTEM COMMAND CENTER DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* ADMIN HERO COMMAND CENTER BANNER */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 rounded-3xl text-white shadow-xl space-y-5 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-inner">
                      <Crown className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          PANEL KONTROL PUSAT OPERATOR & SYSTEM ADMIN
                        </span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                        Selamat Datang, {user?.fullName || 'Admin System'}
                      </h1>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenAddModal()}
                      className="px-3.5 py-2 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Tambah Akun Guru
                    </button>

                    <button
                      onClick={() => setShowConfigModal(true)}
                      className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-extrabold text-xs transition flex items-center gap-1.5"
                    >
                      <MapPin className="w-4 h-4 text-amber-300" /> Parameter GPS
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-[10px] text-slate-300 font-medium uppercase">TITIK PUSAT GPS SEKOLAH</div>
                    <div className="font-mono font-bold text-amber-300 text-xs truncate">
                      {schoolData?.latitude || -5.1061803}, {schoolData?.longitude || 119.5345679}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-[10px] text-slate-300 font-medium uppercase">BATAS RADIUS GEOFENCING</div>
                    <div className="font-bold text-emerald-400 text-xs">
                      ✓ {schoolData?.radiusMeters || 150} Meter Radius Valid
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-[10px] text-slate-300 font-medium uppercase">TOTAL GURU TERKONEKSI</div>
                    <div className="font-bold text-white text-xs flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-brand-300" /> {teacherOnlyCount} Guru Aktif
                    </div>
                  </div>
                </div>
              </div>

              {/* RICH ADMIN METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">GURU PENGAJAR</span>
                    <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">{teacherOnlyCount} Guru</div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-0.5">✓ 1 Kepsek & 1 Operator Baku</div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">HADIR HARI INI</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-600">{realPresentCount} Guru</div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-0.5">✓ {realAttendancePercentage}% Kehadiran</div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(realAttendancePercentage, 100)}%` }} />
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">TERLAMBAT</span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-amber-600">{realLateCount} Guru</div>
                    <div className="text-[11px] text-amber-600 font-bold mt-0.5">Lewat Toleransi Jam</div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${teacherOnlyCount > 0 ? Math.round((realLateCount / teacherOnlyCount) * 100) : 0}%` }} />
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">RADIUS GPS</span>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <MapPin className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-indigo-600">{schoolData?.radiusMeters || 150}m</div>
                    <div className="text-[11px] text-indigo-600 font-bold mt-0.5">Proteksi Geofencing</div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              {/* 100% REAL DYNAMIC GRAPH & ANALYTICS WIDGETS (CLEAN PROFESSIONAL LABELS) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* REAL SUMMARY: WEEKLY ATTENDANCE SUMMARY */}
                <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-brand-500" /> Kehadiran Real-Time Guru Hari Ini
                      </h3>
                      <p className="text-xs text-slate-400">Status transaksi kehadiran hari ini ({new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})</p>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> {realAttendancePercentage}% Kehadiran Guru
                    </span>
                  </div>

                  {/* Real Attendance Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-600">HADIR TEPAT WAKTU</span>
                      <div className="text-2xl font-black text-emerald-700">{realPresentCount} Guru</div>
                      <span className="text-[10px] text-emerald-600 font-semibold">Tercatat di Sistem</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-amber-600">TERLAMBAT</span>
                      <div className="text-2xl font-black text-amber-700">{realLateCount} Guru</div>
                      <span className="text-[10px] text-amber-600 font-semibold">Lewat 07:00 WITA</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-1 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-extrabold uppercase text-brand-600">TOTAL PRESENSI MASUK</span>
                      <div className="text-2xl font-black text-brand-700">{realTotal} Guru</div>
                      <span className="text-[10px] text-brand-600 font-semibold">Transaksi Hari Ini</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tepat Waktu (07:00 WITA)
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Terlambat
                    </div>
                  </div>
                </div>

                {/* REAL DONUT CHART & LIVE AUDIT TRAIL WIDGET */}
                <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
                  {/* Status Donut Distribution */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <PieChart className="w-4 h-4 text-brand-500" /> Distribusi Kehadiran Asli
                      </h3>
                      <span className="text-[10px] text-brand-500 font-bold">Sistem Realtime</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* SVG Donut Visual */}
                      <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100"
                            strokeWidth="4"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-emerald-500"
                            strokeDasharray={`${realAttendancePercentage}, 100`}
                            strokeWidth="4"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-extrabold text-xs text-slate-900">
                          {realAttendancePercentage}%
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-4 font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Hadir</span>
                          <strong className="text-slate-900">{realPresentCount} Guru</strong>
                        </div>
                        <div className="flex items-center justify-between gap-4 font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Terlambat</span>
                          <strong className="text-slate-900">{realLateCount} Guru</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Realtime Live Audit Activity */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> Live Audit Aktivitas
                      </h3>
                      <span className="text-[10px] text-emerald-600 font-bold">Sistem Realtime</span>
                    </div>

                    <div className="space-y-2 text-[11px] max-h-36 overflow-y-auto">
                      {todayAttendances.length > 0 ? (
                        todayAttendances.map((rec) => (
                          <div key={rec.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900">{rec.user?.fullName}</div>
                              <div className="text-[10px] text-slate-400">
                                {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WITA • Status: {rec.status}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-400 text-[11px]">
                          Belum ada transaksi presensi yang masuk hari ini.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-brand-500" /> Presensi Hari Ini (Live Real-time Feed)
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Daftar Kehadiran Guru Hari Ini: <span className="text-slate-900 font-bold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Live Feed Kehadiran Guru Hari Ini</h3>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    {todayAttendances.length} Guru Hadir
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="p-3 border border-slate-300">NAMA GURU</th>
                        <th className="p-3 border border-slate-300">NIP</th>
                        <th className="p-3 border border-slate-300">JAM MASUK</th>
                        <th className="p-3 border border-slate-300">JAM PULANG</th>
                        <th className="p-3 border border-slate-300">STATUS</th>
                        <th className="p-3 border border-slate-300 text-center">FOTO SELFIE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayAttendances.length > 0 ? (
                        todayAttendances.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 border border-slate-300 font-bold text-slate-900">{rec.user?.fullName}</td>
                            <td className="p-3 border border-slate-300 font-mono text-slate-600">{rec.user?.nip}</td>
                            <td className="p-3 border border-slate-300 font-bold text-emerald-600">
                              {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="p-3 border border-slate-300 font-bold text-slate-700">
                              {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="p-3 border border-slate-300">
                              {rec.status === 'PRESENT' ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                                  Tepat Waktu
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                                  Terlambat
                                </span>
                              )}
                            </td>
                            <td className="p-3 border border-slate-300 text-center">
                              {rec.selfieUrl || rec.selfiePhotoUrl ? (
                                <div className="flex items-center justify-center gap-2">
                                  <img
                                    src={getSelfieUrl(rec.selfieUrl || rec.selfiePhotoUrl)}
                                    alt={`Foto Selfie ${rec.user?.fullName}`}
                                    onClick={() =>
                                      setSelectedSelfieModal({
                                        show: true,
                                        url: getSelfieUrl(rec.selfieUrl || rec.selfiePhotoUrl),
                                        teacherName: rec.user?.fullName || '',
                                        time: rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''
                                      })
                                    }
                                    className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 hover:border-brand-500 hover:scale-110 shadow-sm transition cursor-pointer"
                                    title="Klik untuk memperbesar foto selfie"
                                  />
                                  <a
                                    href={getSelfieUrl(rec.selfieUrl || rec.selfiePhotoUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 border border-slate-200 transition"
                                    title="Buka Berkas Foto Asli"
                                  >
                                    <Camera className="w-4 h-4" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 border border-slate-300">
                            Belum ada guru yang melakukan presensi masuk hari ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    Kelola Pengguna & Akun Guru
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Tambah Akun Guru Baru, Edit Informasi PTK/SIMPKB, & Kelola Status Akun
                  </p>
                </div>

                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20"
                >
                  <Plus className="w-4 h-4" /> Tambah Guru Baru
                </button>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900">Daftar Seluruh Pengguna Terdaftar</h3>
                  
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari NIP atau Nama..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="p-3 border border-slate-300">NIP</th>
                        <th className="p-3 border border-slate-300">NAMA LENGKAP</th>
                        <th className="p-3 border border-slate-300">PERAN / JABATAN</th>
                        <th className="p-3 border border-slate-300">EMAIL</th>
                        <th className="p-3 border border-slate-300">STATUS</th>
                        <th className="p-3 border border-slate-300 text-center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-bold border border-slate-300">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                              <span>Memuat data pengguna...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredTeachers.length > 0 ? (
                        filteredTeachers.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 border border-slate-300 font-mono font-bold text-slate-900">{t.nip}</td>
                            <td className="p-3 border border-slate-300 font-bold text-slate-900">{t.fullName}</td>
                            <td className="p-3 border border-slate-300 text-slate-600">
                              {t.role === 'ADMIN' ? (
                                <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-extrabold text-[10px] inline-flex items-center gap-1 border border-amber-300">
                                  <Crown className="w-3 h-3 text-amber-600" /> Admin (1-of-1)
                                </span>
                              ) : t.role === 'PRINCIPAL' ? (
                                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[10px] inline-flex items-center gap-1 border border-emerald-300">
                                  <Award className="w-3 h-3 text-emerald-600" /> Kepala Sekolah (1-of-1)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                  Guru Pengajar
                                </span>
                              )}{' '}
                              <span className="text-[11px]">{t.teacherProfile?.position || ''}</span>
                            </td>
                            <td className="p-3 border border-slate-300 text-slate-500">{t.email}</td>
                            <td className="p-3 border border-slate-300">
                              {t.isActive ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                                  Aktif
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                                  Nonaktif
                                </span>
                              )}
                            </td>
                            <td className="p-3 border border-slate-300 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEyeModal(t)}
                                  className="p-2 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 border border-slate-200 transition"
                                  title="Lihat Detail & Edit Akun"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmModal({ show: true, id: t.id, fullName: t.fullName })}
                                  className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition"
                                  title="Hapus Akun Pengguna"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 border border-slate-300">
                            Tidak ada akun guru yang ditemukan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: PENGAJUAN & RIWAYAT IZIN GURU (FOR ADMIN) */}
          {activeTab === 'leave' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-brand-500" /> Master Pengajuan & Riwayat Izin Seluruh Guru
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Rekapitulasi lengkap permohonan izin/cuti resmi guru yang diajukan ke sekolah.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setLeaveFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        leaveFilterStatus === st
                          ? 'bg-brand-500 text-white shadow-md'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st === 'ALL' ? 'Semua Status' : st === 'PENDING' ? '⏳ Pending' : st === 'APPROVED' ? '✓ Disetujui' : '✕ Ditolak'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stat Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-1 shadow-sm">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">TOTAL PERMOHONAN IZIN</div>
                  <div className="text-2xl font-extrabold text-slate-900">{allLeaveRequests.length} Transaksi</div>
                </div>
                <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-3xl space-y-1 shadow-sm">
                  <div className="text-[10px] font-extrabold text-amber-600 uppercase">MENUNGGU (PENDING)</div>
                  <div className="text-2xl font-extrabold text-amber-700">{allLeaveRequests.filter(r => r.status === 'PENDING').length} Transaksi</div>
                </div>
                <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-3xl space-y-1 shadow-sm">
                  <div className="text-[10px] font-extrabold text-emerald-600 uppercase">DISETUJUI (APPROVED)</div>
                  <div className="text-2xl font-extrabold text-emerald-700">{allLeaveRequests.filter(r => r.status === 'APPROVED').length} Transaksi</div>
                </div>
                <div className="p-5 bg-rose-50/60 border border-rose-200 rounded-3xl space-y-1 shadow-sm">
                  <div className="text-[10px] font-extrabold text-rose-600 uppercase">DITOLAK (REJECTED)</div>
                  <div className="text-2xl font-extrabold text-rose-700">{allLeaveRequests.filter(r => r.status === 'REJECTED').length} Transaksi</div>
                </div>
              </div>

              {/* Master Leave Table */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Daftar Rekapitulasi Izin Guru</h3>
                  <span className="text-xs font-bold text-slate-500">Tersaring: {
                    allLeaveRequests.filter(r => leaveFilterStatus === 'ALL' || r.status === leaveFilterStatus).length
                  } Data</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider">
                        <th className="p-3 border border-slate-300">Guru Pemohon</th>
                        <th className="p-3 border border-slate-300">Periode Izin</th>
                        <th className="p-3 border border-slate-300">Alasan Izin</th>
                        <th className="p-3 border border-slate-300">Dokumen Surat</th>
                        <th className="p-3 border border-slate-300">Status</th>
                        <th className="p-3 border border-slate-300">Persetujuan Kepsek</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {allLeaveRequests.filter(r => leaveFilterStatus === 'ALL' || r.status === leaveFilterStatus).length > 0 ? (
                        allLeaveRequests
                          .filter(r => leaveFilterStatus === 'ALL' || r.status === leaveFilterStatus)
                          .map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3 border border-slate-300">
                                <div className="font-extrabold text-slate-900">{req.teacher?.fullName || 'Guru'}</div>
                                <div className="text-[10px] text-slate-500 font-mono">NIP: {req.teacher?.nip}</div>
                              </td>
                              <td className="p-3 border border-slate-300 font-semibold text-slate-800">
                                {new Date(req.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s/d {new Date(req.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="p-3 border border-slate-300 text-slate-700 max-w-xs truncate font-medium">
                                {req.reason}
                              </td>
                              <td className="p-3 border border-slate-300">
                                {req.attachment ? (
                                  <a
                                    href={req.attachment}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand-600 font-bold hover:underline flex items-center gap-1"
                                  >
                                    <Paperclip className="w-3.5 h-3.5" /> Surat Dokter/Dinas
                                  </a>
                                ) : (
                                  <span className="text-slate-400 italic">Tanpa Lampiran</span>
                                )}
                              </td>
                              <td className="p-3 border border-slate-300">
                                {req.status === 'APPROVED' && (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                    ✓ DISETUJUI
                                  </span>
                                )}
                                {req.status === 'REJECTED' && (
                                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                                    ✕ DITOLAK
                                  </span>
                                )}
                                {req.status === 'PENDING' && (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                                    ⏳ PENDING (MENUNGGU)
                                  </span>
                                )}
                              </td>
                              <td className="p-3 border border-slate-300 text-slate-600 font-medium">
                                {req.approvedBy?.fullName || '-'}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic border border-slate-300">
                            Belum ada transaksi permohonan izin yang sesuai filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DETAIL & ACTION EYE MODAL */}
      {showEyeModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 relative animate-modal-pop">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-brand-500" /> Detail & Kelola Akun
              </h3>
              <button
                onClick={() => setShowEyeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-md border-2 border-brand-500 bg-brand-500 text-white font-bold text-lg flex items-center justify-center">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={getSelfieUrl(selectedUser.avatarUrl)}
                      alt={selectedUser.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{selectedUser.fullName ? selectedUser.fullName.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{selectedUser.fullName}</h4>
                  <p className="text-slate-500 font-mono">NIP: {selectedUser.nip}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                <div><span className="text-slate-400 font-medium">Role:</span> <strong className="text-slate-800">{selectedUser.role}</strong></div>
                <div><span className="text-slate-400 font-medium">Status:</span> <strong className={selectedUser.isActive ? 'text-emerald-600' : 'text-rose-600'}>{selectedUser.isActive ? 'Aktif' : 'Nonaktif'}</strong></div>
                <div><span className="text-slate-400 font-medium">Email:</span> <span className="text-slate-700 truncate">{selectedUser.email}</span></div>
                <div><span className="text-slate-400 font-medium">Telepon:</span> <span className="text-slate-700">{selectedUser.phone || '-'}</span></div>
              </div>
            </div>

            {/* Inline Edit Form toggle */}
            {isEditMode ? (
              <form onSubmit={handleUpdateTeacher} className="space-y-3 text-xs border-t border-slate-100 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">NIP / ID Pengguna</label>
                    <input
                      type="text"
                      required
                      value={editNip}
                      onChange={(e) => setEditNip(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Peran / Hak Akses</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                    >
                      <option value="TEACHER">Guru Pengajar</option>
                      <option value="PRINCIPAL">Kepala Sekolah</option>
                      <option value="ADMIN">Admin / Operator</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Email Sekolah</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Telepon / WA</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jabatan / Tugas</label>
                  <input
                    type="text"
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status Kepegawaian</label>
                  <select
                    value={editEmploymentStatus}
                    onChange={(e) => setEditEmploymentStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  >
                    <option value="Status Aktif (PPPK)">Status Aktif (PPPK)</option>
                    <option value="Status Aktif (PNS)">Status Aktif (PNS)</option>
                    <option value="Guru Honorer Sekolah">Guru Honorer Sekolah</option>
                    <option value="GTY / GTT Resmi">GTY / GTT Resmi</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">No. UKG / SIMPKB</label>
                    <input
                      type="text"
                      value={editUkgId}
                      onChange={(e) => setEditUkgId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-amber-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">NUPTK Resmi</label>
                    <input
                      type="text"
                      value={editNuptk}
                      onChange={(e) => setEditNuptk(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-brand-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">PTK DAPODIK ID</label>
                    <input
                      type="text"
                      value={editPtkDapodikId}
                      onChange={(e) => setEditPtkDapodikId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Akun belajar.id</label>
                    <input
                      type="text"
                      value={editBelajarId}
                      onChange={(e) => setEditBelajarId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Batal Edit
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition shadow-md shadow-brand-500/20"
                  >
                    {isSubmittingEdit ? 'Memproses...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => setIsEditMode(true)}
                  className="py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 font-bold text-xs transition flex items-center justify-center gap-1"
                >
                  <Edit3 className="w-4 h-4" /> Edit Akun
                </button>

                <button
                  onClick={() => openUserConfirm(selectedUser.id, selectedUser.fullName, selectedUser.isActive)}
                  className={`py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 border ${
                    selectedUser.isActive
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                  }`}
                >
                  {selectedUser.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  {selectedUser.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>

                <button
                  onClick={() => setDeleteConfirmModal({ show: true, id: selectedUser.id, fullName: selectedUser.fullName })}
                  className="py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs transition flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              </div>
            )}

            {/* RESET PASSWORD SECTION FOR ADMIN */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-brand-500" /> Reset Password Akun Guru
              </h5>
              <p className="text-[11px] text-slate-500 font-medium">
                💡 Password baru harus <strong>minimal 6 karakter</strong>. Jika dikosongkan, password otomatis ter-reset ke default: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-brand-600 font-mono font-bold">password123</code>
              </p>
              {resetMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {resetMsg}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customResetPassword}
                  onChange={(e) => setCustomResetPassword(e.target.value)}
                  placeholder="Ketik password baru (Minimal 6 karakter, atau kosongkan)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => handleResetUserPassword(selectedUser.id)}
                  disabled={isResettingPassword}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shrink-0 shadow-xs flex items-center gap-1"
                >
                  {isResettingPassword ? 'Proses...' : '🔑 Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER STATUS CONFIRMATION MODAL */}
      {userConfirmModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center relative">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Status Akun
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin <strong className={userConfirmModal.targetStatus ? 'text-emerald-600' : 'text-rose-600'}>{userConfirmModal.targetStatus ? 'MENGAKTIFKAN' : 'MENONAKTIFKAN'}</strong> akun guru <strong>{userConfirmModal.fullName}</strong>?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setUserConfirmModal({ show: false, id: null, fullName: '', targetStatus: false })}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmUserToggle}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition shadow-md ${
                  userConfirmModal.targetStatus ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                Ya, Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center relative">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Konfirmasi Hapus Akun
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin <strong className="text-rose-600">MENGHAPUS PERMANEN</strong> akun pengguna <strong>{deleteConfirmModal.fullName}</strong>? Seluruh data presensi dan profil terkait akan dihapus secara permanen.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmModal({ show: false, id: null, fullName: '' })}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md shadow-rose-600/20"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT GPS GEOFENCING CONFIG MODAL WITH INTERACTIVE MAP PICKER */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto animate-modal-pop">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-500" /> Edit Parameter GPS Sekolah via Peta Interaktif
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Klik titik pada peta, geser marker merah, atau cari lokasi untuk menentukan koordinat presensi.
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {configSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {configSuccessMsg}
              </div>
            )}

            {/* Interactive OpenStreetMap Leaflet Map Picker Component */}
            <SchoolMapPicker
              latitude={Number(latitude) || -5.1046313}
              longitude={Number(longitude) || 119.5345762}
              radiusMeters={Number(radiusMeters) || 150}
              onChangeLocation={(lat, lng) => {
                setLatitude(lat.toString());
                setLongitude(lng.toString());
              }}
            />

            <form onSubmit={handleSaveSchoolConfig} className="space-y-3 text-xs pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Latitude Sekolah</label>
                  <input
                    type="text"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Longitude Sekolah</label>
                  <input
                    type="text"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Radius (Meter)</label>
                  <input
                    type="number"
                    required
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>

              </div>

              <button
                type="submit"
                disabled={isSavingConfig}
                className="w-full mt-3 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2"
              >
                {isSavingConfig ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Simpan Koordinat & Radius Sekolah Ke Database
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD TEACHER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" /> Tambah Akun Guru Pengajar Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-brand-50 border border-brand-200 rounded-2xl text-brand-800 text-xs font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Sistem UPT SPF SD INPRES PAJJAIANG 2 dikunci tepat 1 Kepala Sekolah & 1 Operator. Akun baru otomatis terdaftar sebagai Guru Pengajar.</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">NIP Guru</label>
                <input
                  type="text"
                  required
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: 199508122024212005 (18 Digit NIP)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Ani Suryani, S.Pd."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Email Sekolah</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: ani@sdinprespajjaiang2.sch.id"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Password</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jabatan / Tugas</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Wali Kelas 5B / Guru PJOK"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Simpan Akun Guru Pengajar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SELFIE PHOTO PREVIEW POPUP MODAL */}
      {selectedSelfieModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-modal-pop">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-brand-500" /> Bukti Foto Selfie Presensi Masuk
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedSelfieModal.teacherName} {selectedSelfieModal.time && `• Jam ${selectedSelfieModal.time} WITA`}
                </p>
              </div>
              <button
                onClick={() => setSelectedSelfieModal({ show: false, url: '', teacherName: '', time: '' })}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900 flex items-center justify-center min-h-[300px]">
              <img
                src={selectedSelfieModal.url}
                alt={`Bukti Foto Selfie ${selectedSelfieModal.teacherName}`}
                className="w-full max-h-[70vh] object-contain rounded-2xl"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-500 font-semibold truncate">
                File: {selectedSelfieModal.url.split('/').pop()}
              </span>
              <a
                href={selectedSelfieModal.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs transition shadow-md shadow-brand-500/20 flex items-center gap-1.5 shrink-0"
              >
                <Camera className="w-4 h-4" /> Buka Foto Asli
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
