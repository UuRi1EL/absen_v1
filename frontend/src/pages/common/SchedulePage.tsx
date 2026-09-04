import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/axios.instance';
import { toast } from '../../store/toastStore';
import {
  Calendar,
  Clock,
  Menu,
  CheckCircle2,
  CheckSquare,
  Square,
  Zap,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface SchedulePageProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function SchedulePage({ activeTab = 'schedule', setActiveTab }: SchedulePageProps) {
  const { user } = useAuth();
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [schedulesMap, setSchedulesMap] = useState<Record<string, Record<number, 'SHIFT_1' | 'SHIFT_2'>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Multi-Select Teachers State for Batch Operations
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [activeHeaderMenuDay, setActiveHeaderMenuDay] = useState<number | null>(null);

  const getRealTimeDateState = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    const dateNum = now.getDate();
    let week = 1;
    if (dateNum <= 7) week = 1;
    else if (dateNum <= 14) week = 2;
    else if (dateNum <= 21) week = 3;
    else if (dateNum <= 28) week = 4;
    else week = 5;

    return { year, month, week };
  };

  const realTimeState = getRealTimeDateState();
  const [selectedMonth, setSelectedMonth] = useState(realTimeState.month);
  const [selectedYear, setSelectedYear] = useState(realTimeState.year);
  const [selectedWeek, setSelectedWeek] = useState(realTimeState.week);

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];

  const currentMonthLabel = months.find((m) => m.value === selectedMonth)?.label || '';

  const weeks = [
    { value: 1, label: `Pekan 1 (1 - 7 ${currentMonthLabel})` },
    { value: 2, label: `Pekan 2 (8 - 14 ${currentMonthLabel})` },
    { value: 3, label: `Pekan 3 (15 - 21 ${currentMonthLabel})` },
    { value: 4, label: `Pekan 4 (22 - 28 ${currentMonthLabel})` },
    { value: 5, label: `Pekan 5 (29 - 31 ${currentMonthLabel})` }
  ];

  const getDynamicDaysOfWeek = (year: number, month: number, week: number) => {
    const midDays = [4, 11, 18, 25, 30];
    const targetDayNum = midDays[week - 1] || 11;
    const maxDaysInMonth = new Date(year, month, 0).getDate();
    const validDayNum = Math.min(targetDayNum, maxDaysInMonth);

    const targetDate = new Date(year, month - 1, validDayNum);
    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const mondayDate = new Date(targetDate);
    mondayDate.setDate(targetDate.getDate() + diffToMon);

    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    return dayNames.map((name, index) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + index);
      const dateNum = d.getDate();
      const monthName = monthAbbrs[d.getMonth()];
      const isToday =
        d.getFullYear() === new Date().getFullYear() &&
        d.getMonth() === new Date().getMonth() &&
        d.getDate() === new Date().getDate();

      return {
        id: index + 1,
        name,
        isToday,
        dateFormatted: `${dateNum} ${monthName}`,
        cardLabel: `${name}, ${dateNum} ${monthName}`
      };
    });
  };

  const isTeacherCheckedInOnDay = (teacher: any, dateFormatted: string) => {
    if (!teacher || !teacher.attendances || !Array.isArray(teacher.attendances)) return false;
    const dayNum = Number(dateFormatted.split(' ')[0]);
    if (!dayNum) return false;

    return teacher.attendances.some((att: any) => {
      const attDate = new Date(att.checkInTime || att.createdAt || att.date);
      return (
        attDate.getFullYear() === selectedYear &&
        attDate.getMonth() + 1 === selectedMonth &&
        attDate.getDate() === dayNum
      );
    });
  };

  const daysOfWeek = getDynamicDaysOfWeek(selectedYear, selectedMonth, selectedWeek);

  const isTeacherRole = user?.role === 'TEACHER';
  const isAdminRole = user?.role === 'ADMIN' || user?.role === 'PRINCIPAL';

  const fetchData = async () => {
    try {
      if (isAdminRole) {
        let list: any[] = [];
        try {
          const res = await api.get(`/schedule?month=${selectedMonth}&year=${selectedYear}&week=${selectedWeek}`);
          list = res.data.data || [];
        } catch (e) {
          console.warn('/schedule error, falling back to /users:', e);
        }

        if (!list || list.length === 0) {
          const userRes = await api.get('/users');
          const allUsers = userRes.data.data || [];
          list = allUsers.filter((u: any) => u.role === 'TEACHER');
        }

        setTeachersList(list);

        const initialMap: Record<string, Record<number, 'SHIFT_1' | 'SHIFT_2'>> = {};
        list.forEach((t: any) => {
          initialMap[t.id] = { 1: 'SHIFT_1', 2: 'SHIFT_1', 3: 'SHIFT_1', 4: 'SHIFT_1', 5: 'SHIFT_1', 6: 'SHIFT_1' };
          if (t.shiftSchedules && t.shiftSchedules.length > 0) {
            t.shiftSchedules.forEach((s: any) => {
              initialMap[t.id][Number(s.dayOfWeek)] = s.shift;
            });
          }
        });
        setSchedulesMap(initialMap);
      } else {
        const res = await api.get(`/schedule/my?month=${selectedMonth}&year=${selectedYear}&week=${selectedWeek}`);
        const list = res.data.data || [];
        const myMap: Record<number, 'SHIFT_1' | 'SHIFT_2'> = { 1: 'SHIFT_1', 2: 'SHIFT_1', 3: 'SHIFT_1', 4: 'SHIFT_1', 5: 'SHIFT_1', 6: 'SHIFT_1' };
        list.forEach((s: any) => {
          myMap[Number(s.dayOfWeek)] = s.shift;
        });
        setSchedulesMap({ my: myMap, [user?.id || 'me']: myMap });
      }
    } catch (err) {
      console.error('Gagal mengambil data jadwal shift:', err);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedTeacherIds([]);
  }, [selectedMonth, selectedYear, selectedWeek]);

  const handleShiftChange = (teacherId: string, dayOfWeek: number, shift: 'SHIFT_1' | 'SHIFT_2') => {
    setSchedulesMap((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        [dayOfWeek]: shift
      }
    }));
  };

  // MULTI-SELECT HELPERS
  const isAllTeachersSelected =
    teachersList.length > 0 && selectedTeacherIds.length === teachersList.length;

  const handleToggleSelectAll = () => {
    if (isAllTeachersSelected) {
      setSelectedTeacherIds([]);
    } else {
      setSelectedTeacherIds(teachersList.map((t: any) => t.id));
    }
  };

  const handleToggleSelectTeacher = (id: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // BATCH SHIFT ASSIGNMENT HELPERS
  const applyBatchShiftToSelected = (targetShift: 'SHIFT_1' | 'SHIFT_2') => {
    const targetIds = selectedTeacherIds.length > 0
      ? selectedTeacherIds
      : teachersList.map((t: any) => t.id);

    setSchedulesMap((prev) => {
      const updated = { ...prev };
      targetIds.forEach((tId) => {
        const teacher = teachersList.find((t: any) => t.id === tId);
        const currentMap = { ...(updated[tId] || { 1: 'SHIFT_1', 2: 'SHIFT_1', 3: 'SHIFT_1', 4: 'SHIFT_1', 5: 'SHIFT_1', 6: 'SHIFT_1' }) };

        daysOfWeek.forEach((d) => {
          if (!isTeacherCheckedInOnDay(teacher, d.dateFormatted)) {
            currentMap[d.id] = targetShift;
          }
        });
        updated[tId] = currentMap;
      });
      return updated;
    });

    setSaveSuccessMsg(`⚡ Berhasil menetapkan ${targetShift === 'SHIFT_1' ? 'Shift 1 (Pagi)' : 'Shift 2 (Siang)'} untuk ${targetIds.length} guru terpilih!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const applyColumnBatchShift = (dayId: number, targetShift: 'SHIFT_1' | 'SHIFT_2') => {
    const targetIds = selectedTeacherIds.length > 0
      ? selectedTeacherIds
      : teachersList.map((t: any) => t.id);

    const dayObj = daysOfWeek.find((d) => d.id === dayId);

    setSchedulesMap((prev) => {
      const updated = { ...prev };
      targetIds.forEach((tId) => {
        const teacher = teachersList.find((t: any) => t.id === tId);
        const currentMap = { ...(updated[tId] || { 1: 'SHIFT_1', 2: 'SHIFT_1', 3: 'SHIFT_1', 4: 'SHIFT_1', 5: 'SHIFT_1', 6: 'SHIFT_1' }) };

        if (dayObj && !isTeacherCheckedInOnDay(teacher, dayObj.dateFormatted)) {
          currentMap[dayId] = targetShift;
        }
        updated[tId] = currentMap;
      });
      return updated;
    });

    setActiveHeaderMenuDay(null);
    setSaveSuccessMsg(`⚡ Hari ${dayObj?.name}: Berhasil mengatur ${targetShift === 'SHIFT_1' ? 'Shift 1' : 'Shift 2'} untuk ${targetIds.length} guru!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const applyPresetPattern = (pattern: 'ALL_SHIFT_1' | 'ALL_SHIFT_2' | 'ALTERNATING') => {
    setSchedulesMap((prev) => {
      const updated = { ...prev };
      teachersList.forEach((t: any, idx: number) => {
        let assignedShift: 'SHIFT_1' | 'SHIFT_2' = 'SHIFT_1';
        if (pattern === 'ALL_SHIFT_2') assignedShift = 'SHIFT_2';
        if (pattern === 'ALTERNATING') assignedShift = idx % 2 === 0 ? 'SHIFT_1' : 'SHIFT_2';

        const currentMap = { ...(updated[t.id] || { 1: 'SHIFT_1', 2: 'SHIFT_1', 3: 'SHIFT_1', 4: 'SHIFT_1', 5: 'SHIFT_1', 6: 'SHIFT_1' }) };
        daysOfWeek.forEach((d) => {
          if (!isTeacherCheckedInOnDay(t, d.dateFormatted)) {
            currentMap[d.id] = assignedShift;
          }
        });
        updated[t.id] = currentMap;
      });
      return updated;
    });

    setSaveSuccessMsg('✨ Template preset penugasan shift berhasil diterapkan ke seluruh matriks!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSaveSchedules = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      const payload: Array<{ userId: string; year: number; month: number; week: number; dayOfWeek: number; shift: 'SHIFT_1' | 'SHIFT_2' }> = [];
      Object.keys(schedulesMap).forEach((userId) => {
        if (userId === 'my' || userId === 'me') return;
        const userMap = schedulesMap[userId];
        if (userMap) {
          Object.keys(userMap).forEach((dayStr) => {
            const dayOfWeek = Number(dayStr);
            payload.push({
              userId,
              year: selectedYear,
              month: selectedMonth,
              week: selectedWeek,
              dayOfWeek,
              shift: userMap[dayOfWeek]
            });
          });
        }
      });

      await api.post('/schedule/batch', {
        schedules: payload,
        year: selectedYear,
        month: selectedMonth,
        week: selectedWeek
      });
      const monthName = months.find(m => m.value === selectedMonth)?.label;
      const weekName = weeks.find(w => w.value === selectedWeek)?.label;
      const succMsg = `Penugasan Shift ${monthName} ${selectedYear} (${weekName}) Berhasil Disimpan!`;
      setSaveSuccessMsg(`✓ ${succMsg}`);
      toast.success(succMsg);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan penugasan shift.');
    } finally {
      setIsSaving(false);
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
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpenMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-500">
              {isTeacherRole ? 'JADWAL SHIFT MINGGUAN SAYA' : 'MATRIKS PENUGASAN SHIFT MINGGUAN GURU'} • UPT SPF SD INPRES PAJJAIANG 2
            </span>
          </div>

          {isAdminRole && (
            <button
              onClick={handleSaveSchedules}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Simpan Penugasan Shift
                </>
              )}
            </button>
          )}
        </header>

        <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {saveSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-bold flex items-center gap-2 shadow-xs animate-modal-pop">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> {saveSuccessMsg}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-3xl shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-500" />
                  {isTeacherRole ? 'Jadwal Penugasan Shift Saya' : 'Matriks Penugasan Shift Mingguan Guru'}
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {isTeacherRole
                  ? `Jadwal Shift Kerja & Mengajar Mingguan Khusus ${user?.fullName}`
                  : 'Pengaturan Penugasan Shift 1 (07:30-15:00) & Shift 2 (10:00-17:00) Seluruh Guru UPT SPF SD INPRES PAJJAIANG 2'}
              </p>
            </div>

            {/* Month, Year & Week Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    📅 Bulan: {m.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
              >
                <option value={2026}>Tahun 2026</option>
                <option value={2025}>Tahun 2025</option>
              </select>

              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="bg-brand-50 border border-brand-200 text-brand-700 rounded-xl px-3 py-2 text-xs font-black focus:outline-none"
              >
                {weeks.map((w) => (
                  <option key={w.value} value={w.value}>
                    📌 {w.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  const nowState = getRealTimeDateState();
                  setSelectedYear(nowState.year);
                  setSelectedMonth(nowState.month);
                  setSelectedWeek(nowState.week);
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1"
                title="Reset ke Bulan & Pekan Real-Time Hari Ini"
              >
                ⚡ Hari Ini
              </button>
            </div>
          </div>

          {/* BATCH ASSIGNMENT & PRESET TOOLBAR FOR ADMIN */}
          {isAdminRole && (
            <div className="bg-white border border-brand-200/80 rounded-3xl p-4 shadow-sm space-y-3 bg-gradient-to-r from-brand-50/40 via-purple-50/20 to-white">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-brand-100/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      Batch Shift Assignment & Quick Presets
                      <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-black">
                        Fitur Cepat
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Atur penugasan shift massal untuk banyak guru sekaligus dalam hitungan detik.
                    </p>
                  </div>
                </div>

                {/* 1-Click Preset Templates */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-extrabold text-slate-400 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Preset 1-Klik:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPresetPattern('ALL_SHIFT_1')}
                    className="px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 text-[11px] font-bold transition"
                  >
                    ☀️ Semua Shift 1 (07:30-15:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetPattern('ALL_SHIFT_2')}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-[11px] font-bold transition"
                  >
                    🌙 Semua Shift 2 (10:00-17:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetPattern('ALTERNATING')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 text-[11px] font-bold transition"
                  >
                    🔄 Rotasi Ganjil / Genap
                  </button>
                </div>
              </div>

              {/* Multi-Select Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-2 font-extrabold text-slate-700 hover:text-brand-600 transition"
                  >
                    {isAllTeachersSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {isAllTeachersSelected
                        ? 'Batal Pilih Semua Guru'
                        : `Pilih Semua Guru (${teachersList.length})`}
                    </span>
                  </button>

                  {selectedTeacherIds.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-500 text-white text-[11px] font-black shadow-xs">
                      {selectedTeacherIds.length} Guru Dicentang
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-slate-500">Terapkan ke Guru Dicentang:</span>
                  <button
                    type="button"
                    onClick={() => applyBatchShiftToSelected('SHIFT_1')}
                    className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1"
                  >
                    ☀️ Set Shift 1 (Pagi)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBatchShiftToSelected('SHIFT_2')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1"
                  >
                    🌙 Set Shift 2 (Siang)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TEACHER ROLE VIEW */}
          {isTeacherRole && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {daysOfWeek.map((day) => {
                const myTeacherMap = schedulesMap.my || (user?.id ? schedulesMap[user.id] : undefined) || schedulesMap.me || {};
                const shift = myTeacherMap[day.id] || 'SHIFT_1';
                const isShift1 = shift === 'SHIFT_1';
                return (
                  <div key={day.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-brand-500" /> {day.cardLabel}
                        {day.isToday && (
                          <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[9px] font-black">
                            HARI INI
                          </span>
                        )}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          isShift1
                            ? 'bg-brand-50 text-brand-700 border-brand-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isShift1 ? 'Shift 1 (Pagi)' : 'Shift 2 (Siang)'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">WAKTU MENGUASAI SHIFT</div>
                      <div className="text-lg font-black text-slate-800">
                        {isShift1 ? '07:30 - 15:00 WITA' : '10:00 - 17:00 WITA'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Beban Kerja Harian: <strong>{isShift1 ? '7 Jam 30 Menit' : '7 Jam'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ADMIN & PRINCIPAL MATRIX VIEW WITH BATCH SELECTION & COLUMN ACTIONS */}
          {isAdminRole && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase border-b border-slate-200">
                      <th className="p-3 border-r border-slate-200 w-12 text-center">
                        <button
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="hover:scale-110 transition inline-block"
                          title={isAllTeachersSelected ? 'Deselect All' : 'Select All Teachers'}
                        >
                          {isAllTeachersSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-600 mx-auto" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 mx-auto" />
                          )}
                        </button>
                      </th>
                      <th className="p-3 border-r border-slate-200">NAMA GURU / NIP</th>
                      {daysOfWeek.map((d) => (
                        <th
                          key={d.id}
                          className={`p-3 border-r border-slate-200 text-center min-w-[145px] relative ${
                            d.isToday ? 'bg-brand-50 text-brand-700 font-black ring-2 ring-brand-400 ring-inset' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{d.name.toUpperCase()} {d.isToday && '📌'}</span>
                            <button
                              type="button"
                              onClick={() => setActiveHeaderMenuDay(activeHeaderMenuDay === d.id ? null : d.id)}
                              className="p-1 rounded-md hover:bg-slate-200/80 text-slate-500 hover:text-slate-900 transition"
                              title={`Batch Action Kolom Hari ${d.name}`}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[10px] text-brand-600 font-bold lowercase tracking-normal">
                            ({d.dateFormatted})
                          </div>

                          {/* Column Header Dropdown Menu */}
                          {activeHeaderMenuDay === d.id && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 text-left space-y-1 animate-modal-pop">
                              <div className="text-[10px] font-extrabold text-slate-400 px-2 py-1 uppercase border-b border-slate-100">
                                Set Kolom Hari {d.name}:
                              </div>
                              <button
                                type="button"
                                onClick={() => applyColumnBatchShift(d.id, 'SHIFT_1')}
                                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-brand-50 text-brand-700 text-[11px] font-bold text-left flex items-center gap-1.5 transition"
                              >
                                ☀️ Set Semua Shift 1
                              </button>
                              <button
                                type="button"
                                onClick={() => applyColumnBatchShift(d.id, 'SHIFT_2')}
                                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-amber-50 text-amber-800 text-[11px] font-bold text-left flex items-center gap-1.5 transition"
                              >
                                🌙 Set Semua Shift 2
                              </button>
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {teachersList.length > 0 ? (
                      teachersList.map((t: any) => {
                        const teacherShifts = schedulesMap[t.id] || {};
                        const isSelected = selectedTeacherIds.includes(t.id);

                        return (
                          <tr
                            key={t.id}
                            className={`transition ${isSelected ? 'bg-brand-50/50 hover:bg-brand-50/80' : 'hover:bg-slate-50'}`}
                          >
                            <td className="p-3 text-center border-r border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleToggleSelectTeacher(t.id)}
                                className="hover:scale-110 transition inline-block"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-brand-600 mx-auto" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 mx-auto" />
                                )}
                              </button>
                            </td>
                            <td className="p-3 border-r border-slate-200">
                              <div className="font-extrabold text-slate-900">{t.fullName}</div>
                              <div className="font-mono text-[10px] text-slate-500">NIP: {t.nip}</div>
                            </td>
                            {daysOfWeek.map((d) => {
                              const currentShift = teacherShifts[d.id] || 'SHIFT_1';
                              const isLocked = isTeacherCheckedInOnDay(t, d.dateFormatted);

                              return (
                                <td
                                  key={d.id}
                                  className={`p-2 border-r border-slate-200 text-center ${
                                    isLocked ? 'bg-slate-100/70' : ''
                                  }`}
                                >
                                  {isLocked ? (
                                    <div
                                      className="w-full text-center px-2 py-1.5 rounded-xl border border-slate-300 bg-slate-200/90 text-slate-700 text-[10px] font-black flex items-center justify-center gap-1 shadow-xs cursor-not-allowed"
                                      title="🔒 Terkunci: Guru ini sudah melakukan presensi masuk pada tanggal ini."
                                    >
                                      <span>🔒</span>
                                      <span>{currentShift === 'SHIFT_1' ? 'Shift 1' : 'Shift 2'} (Absen)</span>
                                    </div>
                                  ) : (
                                    <select
                                      value={currentShift}
                                      onChange={(e) =>
                                        handleShiftChange(t.id, d.id, e.target.value as 'SHIFT_1' | 'SHIFT_2')
                                      }
                                      className={`w-full text-center px-2 py-1.5 rounded-xl border text-[11px] font-black transition focus:outline-none ${
                                        currentShift === 'SHIFT_1'
                                          ? 'bg-brand-50 text-brand-700 border-brand-300 hover:border-brand-500'
                                          : 'bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-500'
                                      }`}
                                    >
                                      <option value="SHIFT_1">Shift 1 (07:30-15:00)</option>
                                      <option value="SHIFT_2">Shift 2 (10:00-17:00)</option>
                                    </select>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          Memuat data daftar guru dari database...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
