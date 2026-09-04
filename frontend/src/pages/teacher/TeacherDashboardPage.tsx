import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/axios.instance';
import Sidebar from '../../components/Sidebar';
import NotificationDropdown from '../../components/NotificationDropdown';
import UserProfileDropdown from '../../components/UserProfileDropdown';
import { toast } from '../../store/toastStore';
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  Plus,
  MapPin,
  Camera,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Menu,
  FileText,
  Paperclip,
  HelpCircle,
  UserCheck,
  ShieldCheck,
  Link,
  Edit3
} from 'lucide-react';
import { AttendanceRecord } from '../../types/auth.types';

interface DashboardPageProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function TeacherDashboardPage({ activeTab = 'dashboard', setActiveTab }: DashboardPageProps) {
  const { user, login } = useAuth();
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // Time & Date State
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateString, setCurrentDateString] = useState('');

  // Attendance & Leave State
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [myLeaveRequests, setMyLeaveRequests] = useState<any[]>([]);

  // Check-In Modal & Camera/GPS State
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<'SHIFT_1' | 'SHIFT_2'>('SHIFT_1');
  const [scheduledShift, setScheduledShift] = useState<'SHIFT_1' | 'SHIFT_2'>('SHIFT_1');
  const [overrideReason, setOverrideReason] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);
  const [schoolData, setSchoolData] = useState<any>(null);

  // Check-Out Confirmation Modal State
  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false);
  const [earlyCheckoutReason] = useState('');

  // Leave Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveFile, setLeaveFile] = useState<File | null>(null);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveSuccess, setLeaveSuccess] = useState<string | null>(null);

  // Check-Out State
  const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState(false);

  // Edit Dapodik & SIMPKB Modal State
  const [showDapodikModal, setShowDapodikModal] = useState(false);
  const [dapodikForm, setDapodikForm] = useState({
    employmentStatus: user?.teacherProfile?.employmentStatus || 'Status Aktif (PPPK)',
    ukgId: user?.teacherProfile?.ukgId || '202300256861',
    nuptk: user?.teacherProfile?.nuptk || user?.nip || '4551777678130053',
    ptkDapodikId: user?.teacherProfile?.ptkDapodikId || '2B3B9FD5-5227-44BF',
    belajarId: user?.teacherProfile?.belajarId || 'andi.hasta@guru.sd.belajar.id'
  });
  const [isSubmittingDapodik, setIsSubmittingDapodik] = useState(false);

  const handleSaveDapodikInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingDapodik(true);
      const res = await api.patch('/users/profile', dapodikForm);
      if (res.data?.data) {
        login(localStorage.getItem('accessToken') || '', {
          ...user!,
          teacherProfile: {
            ...user?.teacherProfile,
            ...dapodikForm
          }
        });
      }
      setShowDapodikModal(false);
      toast.success('Informasi Dapodik & SIMPKB berhasil diperbarui!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui informasi Dapodik.');
    } finally {
      setIsSubmittingDapodik(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Realtime Clock Updater
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WITA'
      );
      setCurrentDateString(
        now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Calendar Widget Generator
  const getDynamicCalendarWidget = () => {
    const now = new Date();
    const currentMonthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const todayDate = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days: Array<{ dayNum: number | string; isToday?: boolean }> = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ dayNum: '' });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ dayNum: d, isToday: d === todayDate });
    }
    return { currentMonthLabel, days };
  };

  const calendarData = getDynamicCalendarWidget();

  // Fetch Attendance & Leave Data
  const fetchData = async () => {
    try {
      const res = await api.get('/attendance/my-history');
      const records: AttendanceRecord[] = res.data.data || [];
      setHistory(records);

      const isSameDayLocal = (d1: Date, d2: Date) => {
        return (
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate()
        );
      };
      const now = new Date();
      const todayRecord = records.find((r) => {
        const recDate = new Date(r.checkInTime || r.createdAt || r.date);
        return isSameDayLocal(recDate, now);
      });
      setTodayAttendance(todayRecord || null);

      const leaveRes = await api.get('/leave/my-requests');
      setMyLeaveRequests(leaveRes.data.data || []);

      try {
        const schoolRes = await api.get('/school');
        setSchoolData(schoolRes.data.data);
      } catch (e) {}

      // Fetch today's assigned shift schedule
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const dateNum = now.getDate();
      const currentWeek = dateNum <= 7 ? 1 : dateNum <= 14 ? 2 : dateNum <= 21 ? 3 : dateNum <= 28 ? 4 : 5;

      const schedRes = await api.get(`/schedule/my?year=${currentYear}&month=${currentMonth}&week=${currentWeek}`);
      const list = schedRes.data.data || [];
      const todayDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon, 6 is Sat
      const currentDayNum = todayDayOfWeek === 0 ? 7 : todayDayOfWeek;
      const todaySchedule = list.find((s: any) => Number(s.dayOfWeek) === currentDayNum);
      if (todaySchedule && todaySchedule.shift) {
        setSelectedShift(todaySchedule.shift);
        setScheduledShift(todaySchedule.shift);
      }
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    }
  };

  // Haversine Distance Helper (in meters)
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  useEffect(() => {
    fetchData();
    getLocation();
  }, []);

  // Get GPS Location (Strict Real-Time Geolocation)
  const getLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocation(null);
      setLocationError('Browser/HP Anda tidak mendukung fitur lokasi GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationError(null);
      },
      (err) => {
        console.warn('Akses lokasi GPS HP dibatasi/gagal:', err);
        setLocation(null);
        setLocationError(
          '❌ Akses lokasi GPS HP tidak terdeteksi. Harap izinkan akses lokasi (GPS) di browser HP Anda dan gunakan koneksi HTTPS / Cloudflare Tunnel.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleOpenCheckInModal = async () => {
    setCheckInError(null);
    setCheckInSuccess(null);
    setSelfieFile(null);
    setSelfiePreview(null);
    getLocation();
    setShowCheckInModal(true);

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const dateNum = now.getDate();
      const currentWeek = dateNum <= 7 ? 1 : dateNum <= 14 ? 2 : dateNum <= 21 ? 3 : dateNum <= 28 ? 4 : 5;

      const res = await api.get(`/schedule/my?year=${currentYear}&month=${currentMonth}&week=${currentWeek}`);
      const list = res.data.data || [];
      const todayDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon, 6 is Sat
      const currentDayNum = todayDayOfWeek === 0 ? 7 : todayDayOfWeek;
      const todaySchedule = list.find((s: any) => Number(s.dayOfWeek) === currentDayNum);
      if (todaySchedule && todaySchedule.shift) {
        setSelectedShift(todaySchedule.shift);
        setScheduledShift(todaySchedule.shift);
      }
    } catch (err) {
      console.warn('Gagal membaca jadwal shift otomatis:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const submitCheckIn = async () => {
    if (!location) {
      setCheckInError('❌ Lokasi GPS HP tidak terdeteksi. Silakan aktifkan GPS & muat ulang lokasi.');
      return;
    }

    const targetRadius = schoolData?.radiusMeters || 150;
    const currentDistance = (location && schoolData?.latitude && schoolData?.longitude)
      ? calculateDistanceMeters(location.latitude, location.longitude, schoolData.latitude, schoolData.longitude)
      : null;

    if (currentDistance !== null && currentDistance > targetRadius) {
      setCheckInError(
        `❌ Presensi Gagal! Anda berada di luar radius sekolah (${currentDistance}m dari lokasi sekolah, batas maksimal ${targetRadius}m).`
      );
      return;
    }

    if (!selfieFile) {
      setCheckInError('Foto selfie presensi wajib diunggah.');
      return;
    }
    if (selectedShift !== scheduledShift && (!overrideReason || overrideReason.trim().length < 5)) {
      setCheckInError('Shift yang Anda pilih tidak sesuai jadwal resmi. Anda Wajib mengisi Alasan Alih Shift (minimal 5 karakter).');
      return;
    }

    setIsSubmittingCheckIn(true);
    setCheckInError(null);

    const formData = new FormData();
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    formData.append('selectedShift', selectedShift);
    if (overrideReason) formData.append('overrideReason', overrideReason);
    formData.append('selfie', selfieFile);

    try {
      await api.post('/attendance/check-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCheckInSuccess('Presensi masuk berhasil dicatat!');
      setTimeout(() => {
        setShowCheckInModal(false);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setCheckInError(err.response?.data?.message || 'Gagal melakukan presensi masuk.');
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  const submitCheckOut = async () => {
    setShowCheckOutConfirm(false);
    setIsSubmittingCheckOut(true);
    const sendCheckOut = async (lat: number, lng: number) => {
      try {
        await api.post('/attendance/check-out', {
          latitude: lat,
          longitude: lng,
          earlyCheckoutReason
        });
        toast.success('Presensi Pulang (Check-Out) berhasil diverifikasi!');
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal melakukan presensi pulang.');
      } finally {
        setIsSubmittingCheckOut(false);
      }
    };

    if (!navigator.geolocation) {
      sendCheckOut(-5.1061803, 119.5345679);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => sendCheckOut(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.warn('GPS Error on check-out, using school fallback:', err);
        sendCheckOut(-5.1061803, 119.5345679);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleOpenLeaveModal = () => {
    setLeaveError(null);
    setLeaveSuccess(null);
    setStartDate('');
    setEndDate('');
    setReason('');
    setLeaveFile(null);
    setShowLeaveModal(true);
  };

  const submitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveError(null);
    setLeaveSuccess(null);
    setIsSubmittingLeave(true);

    const formData = new FormData();
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('reason', reason);
    if (leaveFile) {
      formData.append('attachment', leaveFile);
    }

    try {
      await api.post('/leave/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLeaveSuccess('Pengajuan izin berhasil dikirim ke Kepala Sekolah!');
      setTimeout(() => {
        setShowLeaveModal(false);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setLeaveError(err.response?.data?.message || 'Gagal membuat pengajuan izin.');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 11 ? 'Selamat Pagi' : currentHour < 15 ? 'Selamat Siang' : 'Selamat Sore';

  const presentCount = history.filter((r) => r.status === 'PRESENT').length;
  const lateCount = history.filter((r) => r.status === 'LATE').length;

  const displayName = user?.fullName === 'Slamet Riyadi, S.Pd.' || user?.nip === '3001'
    ? 'SLAMET RIYADI DJIDE, S.Pd.'
    : user?.fullName;

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
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsOpenMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition"
              title="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.schoolpro.id/public-registration/1782136552284-18747eee3e1c432291f9002be1c93df8.webp"
                alt="Logo Sekolah"
                className="w-7 h-7 object-contain drop-shadow-xs"
              />
              <div>
                <span className="text-xs font-black text-slate-900 leading-tight block">
                  SD INPRES PAJJAIANG 2
                </span>
                <span className="text-[9px] font-bold text-brand-600 block sm:hidden">
                  Presensi Guru Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <UserProfileDropdown />
          </div>
        </header>

        <main className="p-4 sm:p-8 pb-24 sm:pb-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* VIEW 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {greeting}, {displayName}
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-brand-500" />
                    <span>{currentDateString}</span>
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-brand-600 font-bold text-sm shadow-xs self-start sm:self-auto">
                  <Clock className="w-4 h-4 text-brand-500" />
                  <span>{currentTime}</span>
                </div>
              </div>

              {/* OFFICIAL DAPODIK & SIMPKB VERIFIED CARD */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 rounded-3xl text-white shadow-xl space-y-3 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">
                        INTEGRASI VERIFIKASI RESMI DAPODIK & SIMPKB
                      </span>
                      <h3 className="text-base font-extrabold text-white">{displayName}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold w-fit">
                      ✓ {user?.teacherProfile?.employmentStatus || 'Status Aktif (PPPK)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDapodikModal(true)}
                      className="px-3 py-1 rounded-full bg-brand-500/30 hover:bg-brand-500/50 text-brand-200 border border-brand-400/40 text-xs font-extrabold transition flex items-center gap-1"
                      title="Edit Informasi Dapodik & SIMPKB"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Info
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-medium">No. UKG / SIMPKB-ID</div>
                    <div className="font-mono font-bold text-amber-300">
                      {user?.teacherProfile?.ukgId || '202300256861'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-medium">NUPTK Resmi</div>
                    <div className="font-mono font-bold text-brand-300">
                      {user?.teacherProfile?.nuptk || user?.nip || '4551777678130053'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-medium">PTK DAPODIK ID</div>
                    <div className="font-mono font-bold text-emerald-300 truncate">
                      {user?.teacherProfile?.ptkDapodikId || '2B3B9FD5-5227-44BF'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-medium">Akun Pembelajaran</div>
                    <div className="font-bold text-emerald-400 flex items-center gap-1 truncate" title={user?.teacherProfile?.belajarId || 'andi.hasta@guru.sd.belajar.id'}>
                      <Link className="w-3 h-3 shrink-0" />
                      <span className="truncate">{user?.teacherProfile?.belajarId || 'Taut belajar.id'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RICH MONTHLY STATS OVERVIEW CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">HADIR TEPAT WAKTU</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-600">{presentCount} Hari</div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Bulan Ini</div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((presentCount / 22) * 100, 100)}%` }} />
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">KETERLAMBATAN</span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-amber-600">{lateCount} Hari</div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Lewat Jam Shift</div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((lateCount / 22) * 100, 100)}%` }} />
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">SURAT IZIN SAYA</span>
                    <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-brand-600">{myLeaveRequests.length} Izin</div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Tercatat di Sistem</div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${myLeaveRequests.length > 0 ? 100 : 0}%` }} />
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase">KEDISIPLINAN</span>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-indigo-600">
                      {presentCount + lateCount > 0 ? Math.round((presentCount / (presentCount + lateCount)) * 100) : 100}%
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Rasio Tepat Waktu</div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${presentCount + lateCount > 0 ? Math.round((presentCount / (presentCount + lateCount)) * 100) : 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Grid Status & Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        STATUS KEHADIRAN HARI INI
                      </div>
                      <div className="flex items-center gap-2">
                        {todayAttendance ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> SUDAH PRESENSI ({todayAttendance.status})
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> SIAP ABSEN
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-right font-medium text-slate-500">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">INFORMASI JAM KERJA SHIFT</div>
                      <div className="font-bold text-brand-600">
                        {todayAttendance && (todayAttendance as any).selectedShift === 'SHIFT_2'
                          ? 'Shift 2: 10:00 - 17:00 WITA'
                          : 'Shift 1: 07:30 - 15:00 WITA'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-100 text-center space-y-1">
                      <div className="inline-flex p-2 rounded-xl bg-brand-100 text-brand-600 mb-1">
                        <LogInIcon className="w-5 h-5" />
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        JAM MASUK
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-brand-600">
                        {todayAttendance?.checkInTime
                          ? new Date(todayAttendance.checkInTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '--:--'}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                      <div className="inline-flex p-2 rounded-xl bg-slate-200 text-slate-600 mb-1">
                        <LogOutIcon className="w-5 h-5" />
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        JAM PULANG
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-slate-700">
                        {todayAttendance?.checkOutTime
                          ? new Date(todayAttendance.checkOutTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '--:--'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={handleOpenCheckInModal}
                      disabled={!!todayAttendance?.checkInTime}
                      className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold text-sm transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
                    >
                      <LogInIcon className="w-4 h-4" />
                      <span>Absen Masuk (GPS & Selfie)</span>
                    </button>

                    <button
                      onClick={() => setShowCheckOutConfirm(true)}
                      disabled={!todayAttendance?.checkInTime || !!todayAttendance?.checkOutTime || isSubmittingCheckOut}
                      className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-40 text-slate-700 font-bold text-sm transition flex items-center justify-center gap-2"
                    >
                      {isSubmittingCheckOut ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                      ) : (
                        <>
                          <LogOutIcon className="w-4 h-4" />
                          <span>Absen Pulang</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span>Kalender {calendarData.currentMonthLabel}</span>
                      <span className="text-[10px] text-brand-500 font-bold">Hari Ini</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 py-1 border-b border-slate-100">
                      <span>S</span><span>S</span><span>R</span><span>K</span><span>J</span><span>S</span><span className="text-red-500">M</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-700">
                      {calendarData.days.map((item, idx) => (
                        <div key={idx} className="h-7 flex items-center justify-center">
                          {item.dayNum ? (
                            item.isToday ? (
                              <span className="w-7 h-7 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center shadow-md">
                                {item.dayNum}
                              </span>
                            ) : (
                              <span>{item.dayNum}</span>
                            )
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Pengajuan Izin</h3>
                        <p className="text-[10px] text-slate-400">Sakit atau keperluan dinas</p>
                      </div>
                      <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>

                    <button
                      onClick={handleOpenLeaveModal}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-700 font-bold text-xs transition border border-slate-200 flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Buat Pengajuan Izin
                    </button>
                  </div>
                </div>
              </div>

              {/* Riwayat Absensi Terbaru */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Riwayat Absensi Terbaru</h3>
                  <button
                    onClick={() => setActiveTab && setActiveTab('reports')}
                    className="text-xs font-bold text-brand-500 hover:underline"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-y border-slate-100">
                        <th className="p-3.5 rounded-l-xl">TANGGAL</th>
                        <th className="p-3.5">MASUK</th>
                        <th className="p-3.5">PULANG</th>
                        <th className="p-3.5 rounded-r-xl">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.length > 0 ? (
                        history.slice(0, 5).map((record) => (
                          <tr key={record.id} className="hover:bg-slate-50/50 transition font-medium">
                            <td className="p-3.5 text-slate-900 font-bold">
                              {new Date(record.checkInTime || record.createdAt || record.date).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="p-3.5 text-slate-700">
                              {record.checkInTime
                                ? new Date(record.checkInTime).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '-'}
                            </td>
                            <td className="p-3.5 text-slate-700">
                              {record.checkOutTime
                                ? new Date(record.checkOutTime).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '-'}
                            </td>
                            <td className="p-3.5">
                              {record.status === 'PRESENT' ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[10px]">
                                  Tepat Waktu
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[10px]">
                                  Terlambat
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400">
                            Belum ada riwayat presensi yang dicatat.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: PRESENSI HARI INI */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-brand-500" /> Presensi Hari Ini
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Pusat Kontrol Presensi Masuk (Check-In GPS & Selfie) & Presensi Pulang (Check-Out)
                </p>
              </div>

              {/* Status Box */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">LOKASI VALIDASI ABSEN</span>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-4 h-4 text-brand-500" /> {schoolData?.name || 'UPT SPF SD INPRES PAJJAIANG 2'}
                    </h3>
                    <p className="text-xs text-slate-500">{schoolData?.address || 'Jl. Luwu Raya No.2 Perumnas Sudiang, Kec. Biringkanaya, Makassar'}</p>
                  </div>

                  {(() => {
                    const targetRadius = schoolData?.radiusMeters || 150;
                    const currentDistance = (location && schoolData?.latitude && schoolData?.longitude)
                      ? calculateDistanceMeters(location.latitude, location.longitude, schoolData.latitude, schoolData.longitude)
                      : null;

                    if (currentDistance === null) {
                      return (
                        <div className="px-3.5 py-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 animate-spin" />
                          <span>🔵 Menghubungkan GPS... (Batas {targetRadius}m)</span>
                        </div>
                      );
                    }

                    if (currentDistance <= targetRadius) {
                      return (
                        <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>🟢 Dalam Radius Sekolah ({currentDistance}m / {targetRadius}m)</span>
                        </div>
                      );
                    }

                    return (
                      <div className="px-3.5 py-1.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>🔴 Di Luar Radius ({currentDistance}m / {targetRadius}m)</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-brand-50/50 border border-brand-100 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold uppercase text-slate-500">JAM MASUK HARI INI</div>
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-extrabold border border-brand-200">
                        {scheduledShift === 'SHIFT_1' ? 'Shift 1 (07:30 - 15:00)' : 'Shift 2 (10:00 - 17:00)'}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-brand-600">
                      {todayAttendance?.checkInTime
                        ? new Date(todayAttendance.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
                        : 'Belum Absen Masuk'}
                    </div>
                    <button
                      onClick={handleOpenCheckInModal}
                      disabled={!!todayAttendance?.checkInTime}
                      className="w-full mt-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2"
                    >
                      <LogInIcon className="w-4 h-4" /> Klik Absen Masuk (GPS & Selfie)
                    </button>
                  </div>

                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="text-xs font-bold uppercase text-slate-500">JAM PULANG HARI INI</div>
                    <div className="text-2xl font-black text-slate-800">
                      {todayAttendance?.checkOutTime
                        ? new Date(todayAttendance.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
                        : 'Belum Absen Pulang'}
                    </div>
                    <button
                      onClick={() => setShowCheckOutConfirm(true)}
                      disabled={!todayAttendance?.checkInTime || !!todayAttendance?.checkOutTime || isSubmittingCheckOut}
                      className="w-full mt-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                    >
                      <LogOutIcon className="w-4 h-4" /> Klik Absen Pulang
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: PENGAJUAN & RIWAYAT IZIN */}
          {activeTab === 'leave' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-brand-500" /> Pengajuan & Riwayat Izin Saya
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Kelola pengajuan permohonan izin/cuti dan pantau status persetujuan Kepala Sekolah.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setLeaveError(null);
                    setLeaveSuccess(null);
                    setShowLeaveModal(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-2 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Buat Pengajuan Izin Baru
                </button>
              </div>

              {/* Leave History Table */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Daftar Pengajuan Izin Saya</h3>
                  <span className="text-xs font-bold text-slate-500">Total: {myLeaveRequests.length} Pengajuan</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Periode Tanggal</th>
                        <th className="py-3 px-3">Alasan Izin</th>
                        <th className="py-3 px-3">Dokumen Lampiran</th>
                        <th className="py-3 px-3">Status Persetujuan</th>
                        <th className="py-3 px-3">Ditinjau Oleh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {myLeaveRequests.length > 0 ? (
                        myLeaveRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-3 font-semibold text-slate-900">
                              {new Date(req.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(req.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3.5 px-3 text-slate-700 max-w-xs truncate font-medium">
                              {req.reason}
                            </td>
                            <td className="py-3.5 px-3">
                              {req.attachment ? (
                                <a
                                  href={req.attachment}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-600 font-bold hover:underline flex items-center gap-1"
                                >
                                  <Paperclip className="w-3.5 h-3.5" /> Lihat Surat
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">Tanpa Lampiran</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              {req.status === 'APPROVED' && (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                  ✓ DISETUJUI (APPROVED)
                                </span>
                              )}
                              {req.status === 'REJECTED' && (
                                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                                  ✕ DITOLAK (REJECTED)
                                </span>
                              )}
                              {req.status === 'PENDING' && (
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                                  ⏳ PENDING (DITINJAU KEPSEK)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-slate-600 font-medium">
                              {req.approvedBy?.fullName || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 text-xs italic">
                            Belum ada riwayat permohonan izin yang diajukan.
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

      {/* CHECK-OUT CONFIRMATION MODAL */}
      {showCheckOutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center relative">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Absen Pulang
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin mencatat <strong>Presensi Pulang (Check-Out)</strong> sekarang?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCheckOutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={submitCheckOut}
                disabled={isSubmittingCheckOut}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition shadow-md shadow-brand-500/20"
              >
                {isSubmittingCheckOut ? 'Memproses...' : 'Ya, Presensi Pulang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECK-IN MODAL */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Verifikasi Presensi Masuk</h3>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkInError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {checkInError}
              </div>
            )}

            {checkInSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {checkInSuccess}
              </div>
            )}

            {/* Shift Selector */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700">Pilih Shift Mengajar Hari Ini:</label>
                <span className="text-[10px] font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                  Jadwal Resmi: {scheduledShift === 'SHIFT_1' ? 'Shift 1 (Pagi)' : 'Shift 2 (Siang)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedShift('SHIFT_1')}
                  className={`p-3 rounded-2xl border text-left transition relative ${
                    selectedShift === 'SHIFT_1'
                      ? 'border-brand-500 bg-brand-50/70 text-brand-600 font-extrabold shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400">SHIFT 1 (PAGI)</div>
                    {scheduledShift === 'SHIFT_1' && (
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">
                        ✓ RESMI
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">07:30 - 15:00</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedShift('SHIFT_2')}
                  className={`p-3 rounded-2xl border text-left transition relative ${
                    selectedShift === 'SHIFT_2'
                      ? 'border-brand-500 bg-brand-50/70 text-brand-600 font-extrabold shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400">SHIFT 2 (SIANG)</div>
                    {scheduledShift === 'SHIFT_2' && (
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">
                        ✓ RESMI
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">10:00 - 17:00</div>
                </button>
              </div>
            </div>

            {/* Warning Alert & Mandatory Override Reason Box when Shift !== ScheduledShift */}
            {selectedShift !== scheduledShift && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-xs animate-shake">
                <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  PERINGATAN KEDINASAN: ALIH SHIFT DETEKSI!
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Shift yang Anda pilih (<strong>{selectedShift === 'SHIFT_1' ? 'Shift 1' : 'Shift 2'}</strong>) berbeda dari Penugasan Resmi Sekolah (<strong>{scheduledShift === 'SHIFT_1' ? 'Shift 1' : 'Shift 2'}</strong>). Anda <strong>WAJIB</strong> mengisi alasan alih shift di bawah.
                </p>

                <div className="pt-1 space-y-1">
                  <label className="font-extrabold text-amber-900 text-[11px] flex items-center gap-1">
                    Alasan Perubahan Shift <span className="text-rose-600 font-black">* (Wajib Diisi)</span>
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Contoh: Bertukar jam piket/mengajar dengan Ibu Hasniah..."
                    rows={2}
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-500" /> Lokasi GPS Sekolah
                </span>
                <button
                  onClick={getLocation}
                  className="text-brand-500 text-[11px] font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Segarkan
                </button>
              </div>

              {location ? (
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>Lat: <span className="font-mono text-slate-900">{location.latitude}</span></div>
                  <div>Lng: <span className="font-mono text-slate-900">{location.longitude}</span></div>
                  <div className="text-emerald-600 font-bold text-[10px] pt-1">
                    ✓ Koordinat Berhasil Terdeteksi
                  </div>
                </div>
              ) : locationError ? (
                <div className="text-red-500 text-[11px]">{locationError}</div>
              ) : (
                <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  Mendeteksi lokasi GPS...
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-brand-500" /> Foto Selfie Presensi
              </label>

              <input
                type="file"
                accept="image/*"
                capture="user"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              {selfiePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 aspect-video max-h-44 flex items-center justify-center">
                  <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1 bg-slate-900/80 text-white text-[11px] font-bold rounded-lg border border-slate-600 backdrop-blur"
                  >
                    Ganti Foto
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl bg-slate-50 text-slate-500 hover:text-brand-600 flex flex-col items-center justify-center gap-2 transition"
                >
                  <Camera className="w-7 h-7 text-slate-400" />
                  <span className="text-xs font-bold">Ambil Foto Selfie</span>
                </button>
              )}
            </div>

            <button
              onClick={submitCheckIn}
              disabled={isSubmittingCheckIn || !location || !selfieFile}
              className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2"
            >
              {isSubmittingCheckIn ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Kirim Absen Masuk
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-500" /> Form Pengajuan Izin / Sakit
              </h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {leaveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {leaveError}
              </div>
            )}

            {leaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {leaveSuccess}
              </div>
            )}

            <form onSubmit={submitLeaveRequest} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Alasan Permohonan Izin / Sakit</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan alasan izin / sakit Anda..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-brand-500" /> Upload Dokumen / Surat Dokter (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setLeaveFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingLeave}
                className="w-full mt-2 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2"
              >
                {isSubmittingLeave ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Kirim Pengajuan Izin
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DAPODIK & SIMPKB INFO MODAL */}
      {showDapodikModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 relative animate-modal-pop">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-500" /> Edit Informasi Dapodik & SIMPKB
              </h3>
              <button
                onClick={() => setShowDapodikModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDapodikInfo} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Status Pegawai / Kepegawaian</label>
                <select
                  value={dapodikForm.employmentStatus}
                  onChange={(e) => setDapodikForm({ ...dapodikForm, employmentStatus: e.target.value })}
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
                  <label className="font-bold text-slate-700">No. UKG / SIMPKB-ID</label>
                  <input
                    type="text"
                    required
                    value={dapodikForm.ukgId}
                    onChange={(e) => setDapodikForm({ ...dapodikForm, ukgId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-amber-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">NUPTK Resmi</label>
                  <input
                    type="text"
                    required
                    value={dapodikForm.nuptk}
                    onChange={(e) => setDapodikForm({ ...dapodikForm, nuptk: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-brand-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">PTK DAPODIK ID</label>
                <input
                  type="text"
                  required
                  value={dapodikForm.ptkDapodikId}
                  onChange={(e) => setDapodikForm({ ...dapodikForm, ptkDapodikId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Akun Pembelajaran (belajar.id)</label>
                <input
                  type="text"
                  required
                  value={dapodikForm.belajarId}
                  onChange={(e) => setDapodikForm({ ...dapodikForm, belajarId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingDapodik}
                className="w-full mt-2 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2"
              >
                {isSubmittingDapodik ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Simpan Informasi Dapodik
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE APP FLOATING QUICK BOTTOM BAR (VISIBLE ONLY ON MOBILE) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            if (todayAttendance) {
              toast.info('Anda sudah melakukan presensi masuk hari ini!');
            } else {
              handleOpenCheckInModal();
            }
          }}
          className="flex flex-col items-center gap-1 text-slate-700 active:scale-95 transition"
        >
          <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black text-slate-800">Presensi</span>
        </button>

        <button
          onClick={() => {
            if (!todayAttendance) {
              toast.warning('Anda belum melakukan presensi masuk hari ini!');
            } else if (todayAttendance.checkOutTime) {
              toast.info('Anda sudah melakukan presensi pulang hari ini!');
            } else {
              setShowCheckOutConfirm(true);
            }
          }}
          className="flex flex-col items-center gap-1 text-slate-700 active:scale-95 transition"
        >
          <div className="p-2 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200 shadow-sm">
            <LogOutIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black text-slate-800">Pulang</span>
        </button>

        <button
          onClick={() => handleOpenLeaveModal()}
          className="flex flex-col items-center gap-1 text-slate-700 active:scale-95 transition"
        >
          <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black text-slate-800">Izin</span>
        </button>

        <button
          onClick={() => setActiveTab && setActiveTab('schedule')}
          className="flex flex-col items-center gap-1 text-slate-700 active:scale-95 transition"
        >
          <div className="p-2 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black text-slate-800">Jadwal</span>
        </button>
      </div>
    </div>
  );
}
