import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/axios.instance';
import Sidebar from '../components/Sidebar';
import {
  Bell,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  Plus,
  MapPin,
  Camera,
  AlertCircle,
  RefreshCw,
  X,
  Menu,
  FileText
} from 'lucide-react';
import { AttendanceRecord } from '../types/auth.types';

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // Time & Date State
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateString, setCurrentDateString] = useState('');

  // Attendance State
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [, setIsLoading] = useState(true);

  // Check-In Modal & Camera/GPS State
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);

  const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Realtime Clock Updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      setCurrentDateString(now.toLocaleDateString('id-ID', options));
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WITA');
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Attendance Data
  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/attendance/my-history');
      const records: AttendanceRecord[] = res.data.data || [];
      setHistory(records);

      // Find today's record
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = records.find(
        (r) => new Date(r.date).toISOString().split('T')[0] === todayStr
      );
      setTodayAttendance(todayRecord || null);
    } catch (err) {
      console.error('Gagal mengambil data presensi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Get GPS Location
  const getLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Browser/HP Anda tidak mendukung Geolocation.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        setLocationError('Gagal mendapatkan lokasi GPS. Harap beri izin akses lokasi di HP/Browser.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleOpenCheckInModal = () => {
    setCheckInError(null);
    setCheckInSuccess(null);
    setSelfieFile(null);
    setSelfiePreview(null);
    getLocation();
    setShowCheckInModal(true);
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
      setCheckInError('Lokasi GPS belum terdeteksi. Silakan segarkan GPS.');
      return;
    }
    if (!selfieFile) {
      setCheckInError('Foto selfie presensi wajib diunggah.');
      return;
    }

    setIsSubmittingCheckIn(true);
    setCheckInError(null);

    const formData = new FormData();
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    formData.append('selfie', selfieFile);

    try {
      await api.post('/attendance/check-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCheckInSuccess('Presensi masuk berhasil dicatat!');
      setTimeout(() => {
        setShowCheckInModal(false);
        fetchAttendanceData();
      }, 1500);
    } catch (err: any) {
      setCheckInError(err.response?.data?.message || 'Gagal melakukan presensi masuk.');
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  const submitCheckOut = async () => {
    if (!location) {
      getLocation();
    }
    const lat = location?.latitude || -5.106281;
    const lng = location?.longitude || 119.534695;

    setIsSubmittingCheckOut(true);
    try {
      await api.post('/attendance/check-out', { latitude: lat, longitude: lng });
      fetchAttendanceData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal melakukan presensi pulang.');
    } finally {
      setIsSubmittingCheckOut(false);
    }
  };

  // Determine Greeting based on hour
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 11 ? 'Selamat Pagi' : currentHour < 15 ? 'Selamat Siang' : 'Selamat Sore';

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">
      
      {/* Sidebar Component */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isOpenMobileSidebar}
        setIsOpenMobile={setIsOpenMobileSidebar}
      />

      {/* Main Right Content Layout */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Navbar Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpenMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-slate-500">
                UPT SPF SD INPRES PAJJAIANG 2
              </span>
            </div>
          </div>

          {/* User Right Badge & Notifications */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition relative">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-brand-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-brand-500/20">
                {user?.fullName.charAt(0) || 'G'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.fullName}
                </div>
                <div className="text-[10px] font-semibold text-slate-500">
                  NIP: {user?.nip} • Guru Kelas
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Welcome Banner Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {greeting}, {user?.fullName}
              </h1>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
                <CalendarIcon className="w-3.5 h-3.5 text-brand-500" />
                <span>{currentDateString}</span>
              </p>
            </div>

            {/* Realtime Clock Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-brand-600 font-bold text-sm shadow-xs self-start sm:self-auto">
              <Clock className="w-4 h-4 text-brand-500" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Grid Layout: Status Absen (Left) + Widgets (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT CARD: Status Kehadiran Hari Ini */}
            <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
              
              {/* Card Header */}
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
                  <div className="text-[10px] font-bold text-slate-400 uppercase">INFORMASI JAM KERJA</div>
                  <div className="font-bold text-slate-700">07:00 - 15:00 WITA</div>
                </div>
              </div>

              {/* Two Time Stat Boxes */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* JAM MASUK Box */}
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

                {/* JAM PULANG Box */}
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

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={handleOpenCheckInModal}
                  disabled={!!todayAttendance?.checkInTime}
                  className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold text-sm transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
                >
                  <LogInIcon className="w-4 h-4" />
                  <span>Absen Masuk</span>
                </button>

                <button
                  onClick={submitCheckOut}
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

            {/* RIGHT COLUMN: Widgets (Kalender & Pengajuan Izin) */}
            <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
              
              {/* Kalender Kecil Widget */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>Kalender Juli 2026</span>
                  <span className="text-[10px] text-brand-500 font-bold">Hari Ini</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 py-1 border-b border-slate-100">
                  <span>S</span><span>S</span><span>R</span><span>K</span><span>J</span><span>S</span><span className="text-red-500">M</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-700">
                  <span className="text-slate-300">26</span><span className="text-slate-300">27</span>
                  <span>21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span>
                  <span className="w-7 h-7 mx-auto rounded-full bg-brand-500 text-white font-bold flex items-center justify-center shadow-md">
                    28
                  </span>
                  <span>29</span><span>30</span><span>31</span>
                </div>
              </div>

              {/* Pengajuan Izin Widget */}
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
                  onClick={() => alert('Fitur Pengajuan Izin Surat Dokumen telah siap dikembangkan!')}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-700 font-bold text-xs transition border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Buat Pengajuan Izin
                </button>
              </div>

            </div>

          </div>

          {/* BOTTOM CARD: Riwayat Absensi Terbaru */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Riwayat Absensi Terbaru</h3>
              <button className="text-xs font-bold text-brand-500 hover:underline">Lihat Semua</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="p-3 border border-slate-300">TANGGAL</th>
                    <th className="p-3 border border-slate-300">MASUK</th>
                    <th className="p-3 border border-slate-300">PULANG</th>
                    <th className="p-3 border border-slate-300">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length > 0 ? (
                    history.slice(0, 5).map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/70 transition font-medium">
                        <td className="p-3 border border-slate-300 text-slate-900 font-bold">
                          {new Date(record.date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-3 border border-slate-300 text-slate-700">
                          {record.checkInTime
                            ? new Date(record.checkInTime).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </td>
                        <td className="p-3 border border-slate-300 text-slate-700">
                          {record.checkOutTime
                            ? new Date(record.checkOutTime).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </td>
                        <td className="p-3 border border-slate-300">
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
                      <td colSpan={4} className="p-6 text-center text-slate-400 border border-slate-300">
                        Belum ada riwayat presensi yang dicatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
          © 2026 UPT SPF SD INPRES PAJJAIANG 2 • Primary School Attendance System
        </footer>

      </div>

      {/* CHECK-IN MODAL (GPS & Camera Selfie Verification) */}
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

            {/* Error / Success Alerts */}
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

            {/* GPS Location Box */}
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

            {/* Selfie Photo Upload Box */}
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

            {/* Submit Button */}
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

    </div>
  );
}
