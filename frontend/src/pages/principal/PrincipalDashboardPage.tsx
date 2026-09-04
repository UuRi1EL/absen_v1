import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/axios.instance';
import Sidebar from '../../components/Sidebar';
import NotificationDropdown from '../../components/NotificationDropdown';
import UserProfileDropdown from '../../components/UserProfileDropdown';
import { getSelfieUrl } from '../../utils/url.util';
import {
  AlertTriangle,
  FileCheck,
  Menu,
  Check,
  X,
  FileText,
  HelpCircle,
  Camera,
  UserCheck,
  Crown,
  Award,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface DashboardPageProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function PrincipalDashboardPage({ activeTab = 'dashboard', setActiveTab }: DashboardPageProps) {
  const { user } = useAuth();
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [todayAttendances, setTodayAttendances] = useState<any[]>([]);
  const [totalTeachersCount, setTotalTeachersCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [leaveSubTab, setLeaveSubTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    id: string | null;
    teacherName: string;
    action: 'APPROVED' | 'REJECTED';
  }>({
    show: false,
    id: null,
    teacherName: '',
    action: 'APPROVED'
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [leaveRes, reportRes, usersRes] = await Promise.all([
        api.get('/leave'),
        api.get(`/reports/monthly?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
        api.get('/users')
      ]);

      setLeaveRequests(leaveRes.data.data || []);
      const users = usersRes.data.data || [];
      
      // Filter EXCLUSIVELY for TEACHER role (excluding Admin & Principal)
      const teacherOnly = users.filter((u: any) => u.role === 'TEACHER');
      setTotalTeachersCount(teacherOnly.length);

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
        return isSameDayLocal(recDate, now) && (r.user?.role === 'TEACHER' || !r.user?.role);
      });
      setTodayAttendances(todayOnly);
    } catch (err) {
      console.error('Gagal mengambil data Kepala Sekolah:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openConfirmation = (id: string, teacherName: string, action: 'APPROVED' | 'REJECTED') => {
    setConfirmModal({
      show: true,
      id,
      teacherName,
      action
    });
  };

  const handleConfirmDecision = async () => {
    if (!confirmModal.id) return;
    setProcessingId(confirmModal.id);
    try {
      await api.patch(`/leave/${confirmModal.id}/status`, { status: confirmModal.action });
      setConfirmModal({ show: false, id: null, teacherName: '', action: 'APPROVED' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah status izin.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = leaveRequests.filter((r) => r.status === 'PENDING');
  const historyRequests = leaveRequests.filter((r) => r.status !== 'PENDING');
  const lateAttendanceCount = todayAttendances.filter((r) => r.status === 'LATE').length;
  const presentAttendanceCount = todayAttendances.length;
  const attendancePercentage = totalTeachersCount > 0
    ? Math.round((presentAttendanceCount / totalTeachersCount) * 100)
    : 0;

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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                PORTAL KEPALA SEKOLAH • UPT SPF SD INPRES PAJJAIANG 2
              </span>
              {isLoading && (
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full animate-pulse border border-brand-200">
                  Memuat...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <UserProfileDropdown customAvatarClass="w-9 h-9 rounded-full object-cover border-2 border-emerald-500 shadow-md" />
          </div>
        </header>

        <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
                   {/* VIEW 1: EXECUTIVE PRINCIPAL DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* EXECUTIVE HERO HEADER BANNER */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 rounded-3xl text-white shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-inner">
                      <Crown className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          PORTAL KEPEMIMPINAN & PENGAWASAN EKSEKUTIF
                        </span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                        Selamat Datang, {user?.fullName || 'Kepala Sekolah'}
                      </h1>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Status Sistem: Aktif Real-Time</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-[10px] text-slate-300 font-medium uppercase">SATUAN PENDIDIKAN</div>
                    <div className="font-bold text-white text-xs truncate">UPT SPF SD INPRES PAJJAIANG 2</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-[10px] text-slate-300 font-medium uppercase">TOTAL GURU TERDAFTAR</div>
                    <div className="font-bold text-amber-300 text-xs">{totalTeachersCount} Guru Aktif</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-[10px] text-slate-300 font-medium uppercase">RASIO KEHADIRAN HARI INI</div>
                    <div className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> {attendancePercentage}% Kehadiran
                    </div>
                  </div>
                </div>
              </div>

              {/* RICH METRIC STAT CARDS WITH PROGRESS BARS */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">GURU HADIR</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">{presentAttendanceCount} / {totalTeachersCount} Guru</div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-0.5">✓ {attendancePercentage}% Kehadiran</div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(attendancePercentage, 100)}%` }} />
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">TEPAT WAKTU</span>
                    <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-brand-600">{Math.max(presentAttendanceCount - lateAttendanceCount, 0)} Guru</div>
                    <div className="text-[11px] text-brand-600 font-bold mt-0.5">Presensi Sesuai Shift</div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${totalTeachersCount > 0 ? Math.round((Math.max(presentAttendanceCount - lateAttendanceCount, 0) / totalTeachersCount) * 100) : 0}%` }} />
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">TERLAMBAT</span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-amber-600">{lateAttendanceCount} Guru</div>
                    <div className="text-[11px] text-amber-600 font-bold mt-0.5">Lewat Toleransi Jam</div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${totalTeachersCount > 0 ? Math.round((lateAttendanceCount / totalTeachersCount) * 100) : 0}%` }} />
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">IZIN PENDING</span>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-indigo-600">{pendingRequests.length} Surat</div>
                    <div className="text-[11px] text-indigo-600 font-bold mt-0.5">Butuh Keputusan Kepsek</div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${pendingRequests.length > 0 ? 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              {/* LIVE PRESENSI FEED TABLE WITH SELFIE PREVIEW & GPS VALIDATION */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-brand-500" /> Live Feed Kehadiran Guru Hari Ini
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Pantau jam masuk, foto selfie, status jam shift, dan validasi radius GPS sekolah secara real-time.
                    </p>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold self-start sm:self-auto">
                    {todayAttendances.length} Guru Hadir Hari Ini
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-100 rounded-2xl">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-100 text-[10px]">
                        <th className="p-3.5">NAMA GURU PEMOHON</th>
                        <th className="p-3.5">NIP</th>
                        <th className="p-3.5">JAM MASUK</th>
                        <th className="p-3.5">JAM PULANG</th>
                        <th className="p-3.5">STATUS DISIPLIN</th>
                        <th className="p-3.5 text-center">FOTO SELFIE ABSEN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {todayAttendances.length > 0 ? (
                        todayAttendances.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-3.5">
                              <div className="font-extrabold text-slate-900">{rec.user?.fullName}</div>
                              <div className="text-[10px] text-slate-500 font-semibold">{rec.user?.teacherProfile?.position || 'Guru Kelas'}</div>
                            </td>
                            <td className="p-3.5 font-mono text-slate-600 font-bold">{rec.user?.nip}</td>
                            <td className="p-3.5 font-bold text-emerald-600">
                              {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA' : '-'}
                            </td>
                            <td className="p-3.5 font-bold text-slate-700">
                              {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA' : '-'}
                            </td>
                            <td className="p-3.5">
                              {rec.status === 'PRESENT' ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10px]">
                                  ✓ Tepat Waktu
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[10px]">
                                  ⚠ Terlambat
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {rec.selfieUrl || rec.selfiePhotoUrl ? (
                                <div className="flex items-center justify-center gap-2">
                                  <img
                                    src={getSelfieUrl(rec.selfieUrl || rec.selfiePhotoUrl)}
                                    alt={`Foto Selfie ${rec.user?.fullName}`}
                                    className="w-10 h-10 rounded-2xl object-cover border-2 border-brand-200 shadow-sm transition hover:scale-105"
                                  />
                                  <a
                                    href={getSelfieUrl(rec.selfieUrl || rec.selfiePhotoUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 border border-slate-200 transition"
                                    title="Buka Berkas Foto Asli"
                                  >
                                    <Camera className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">Tanpa Foto</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 text-xs italic">
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

          {/* VIEW 2: PERSETUJUAN & RIWAYAT PERMOHONAN IZIN GURU */}
          {activeTab === 'leave' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-7 h-7 text-brand-500" /> Persetujuan & Riwayat Permohonan Izin Guru
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Portal Resmi Kepala Sekolah Untuk Memeriksa, Menyetujui, dan Memantau Riwayat Surat Izin Guru
                </p>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex gap-2 border-b border-slate-200 pb-3">
                <button
                  onClick={() => setLeaveSubTab('PENDING')}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                    leaveSubTab === 'PENDING'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ⏳ Menunggu Persetujuan ({pendingRequests.length})
                </button>
                <button
                  onClick={() => setLeaveSubTab('HISTORY')}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                    leaveSubTab === 'HISTORY'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📜 Riwayat Persetujuan ({historyRequests.length})
                </button>
              </div>

              {leaveSubTab === 'PENDING' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-500" /> Surat Izin Menunggu Persetujuan Anda
                      </h3>
                      <p className="text-xs text-slate-400">Klik Setujui atau Tolak untuk memproses permohonan izin guru</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                      {pendingRequests.length} Menunggu
                    </span>
                  </div>

                  {pendingRequests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingRequests.map((req) => (
                        <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-extrabold text-slate-900 text-sm">{req.teacher?.fullName}</div>
                              <div className="text-xs text-slate-500">NIP: {req.teacher?.nip}</div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold">
                              PENDING
                            </span>
                          </div>

                          <div className="text-xs space-y-1 text-slate-600 border-y border-slate-200/60 py-2">
                            <div><strong>Periode Izin:</strong> {new Date(req.startDate).toLocaleDateString('id-ID')} s/d {new Date(req.endDate).toLocaleDateString('id-ID')}</div>
                            <div><strong>Alasan:</strong> {req.reason}</div>
                            {req.attachment && (
                              <div>
                                <a
                                  href={req.attachment}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-brand-500 underline font-semibold flex items-center gap-1 mt-1"
                                >
                                  📄 Lihat Surat Dokter / Dinas
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => openConfirmation(req.id, req.teacher?.fullName, 'APPROVED')}
                              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition shadow-md shadow-emerald-600/20"
                            >
                              <Check className="w-4 h-4" /> Setujui
                            </button>
                            <button
                              onClick={() => openConfirmation(req.id, req.teacher?.fullName, 'REJECTED')}
                              className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition shadow-md shadow-rose-600/20"
                            >
                              <X className="w-4 h-4" /> Tolak
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      Tidak ada permohonan izin yang menunggu persetujuan saat ini.
                    </div>
                  )}
                </div>
              )}

              {leaveSubTab === 'HISTORY' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900">Riwayat Surat Izin Yang Telah Diproses</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                          <th className="p-3">Guru Pemohon</th>
                          <th className="p-3">Periode Izin</th>
                          <th className="p-3">Alasan</th>
                          <th className="p-3">Dokumen Surat</th>
                          <th className="p-3">Status Keputusan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyRequests.length > 0 ? (
                          historyRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-bold text-slate-900">
                                <div>{req.teacher?.fullName}</div>
                                <div className="text-[10px] text-slate-500 font-mono">NIP: {req.teacher?.nip}</div>
                              </td>
                              <td className="p-3 font-semibold text-slate-700">
                                {new Date(req.startDate).toLocaleDateString('id-ID')} s/d {new Date(req.endDate).toLocaleDateString('id-ID')}
                              </td>
                              <td className="p-3 text-slate-600 max-w-xs truncate">{req.reason}</td>
                              <td className="p-3">
                                {req.attachment ? (
                                  <a href={req.attachment} target="_blank" rel="noreferrer" className="text-brand-600 font-bold underline">
                                    Lihat Surat
                                  </a>
                                ) : '-'}
                              </td>
                              <td className="p-3">
                                {req.status === 'APPROVED' ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[10px]">
                                    ✓ Disetujui
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[10px]">
                                    ✕ Ditolak
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                              Belum ada riwayat permohonan izin yang diproses.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: PRESENSI HARI INI (LIVE FEED KEPSEK) */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-brand-500" /> Presensi Hari Ini (Monitoring Kehadiran Guru)
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Monitoring Kehadiran Guru Hari Ini: <span className="text-slate-900 font-bold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Daftar Live Presensi Guru Hari Ini</h3>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    {todayAttendances.length} Guru Hadir
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-100 rounded-2xl">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="p-3.5">NAMA GURU</th>
                        <th className="p-3.5">NIP</th>
                        <th className="p-3.5">JAM MASUK</th>
                        <th className="p-3.5">JAM PULANG</th>
                        <th className="p-3.5">STATUS</th>
                        <th className="p-3.5 text-center">FOTO SELFIE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {todayAttendances.length > 0 ? (
                        todayAttendances.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3.5 font-bold text-slate-900">{rec.user?.fullName}</td>
                            <td className="p-3.5 font-mono text-slate-600">{rec.user?.nip}</td>
                            <td className="p-3.5 font-bold text-emerald-600">
                              {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="p-3.5 font-bold text-slate-700">
                              {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="p-3.5">
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
                            <td className="p-3 text-center">
                              {rec.selfieUrl || rec.selfiePhotoUrl ? (
                                <div className="flex items-center justify-center gap-2">
                                  <img
                                    src={getSelfieUrl(rec.selfieUrl || rec.selfiePhotoUrl)}
                                    alt={`Foto Selfie ${rec.user?.fullName}`}
                                    className="w-11 h-11 rounded-2xl object-cover border-2 border-slate-200 shadow-sm transition hover:scale-105"
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
                          <td colSpan={6} className="p-8 text-center text-slate-400">
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

        </main>
      </div>

      {/* DECISION CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center relative">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Keputusan
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin <strong className={confirmModal.action === 'APPROVED' ? 'text-emerald-600' : 'text-rose-600'}>{confirmModal.action === 'APPROVED' ? 'MENYETUJUI' : 'MENOLAK'}</strong> surat izin dari <strong>{confirmModal.teacherName}</strong>?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmModal({ show: false, id: null, teacherName: '', action: 'APPROVED' })}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={!!processingId}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition shadow-md ${
                  confirmModal.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                {processingId ? 'Memproses...' : 'Ya, Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
