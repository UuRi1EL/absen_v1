import { useState, useEffect } from 'react';
import { api } from '../../utils/axios.instance';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Printer, Menu, AlertCircle, RefreshCw } from 'lucide-react';

interface ReportsPageProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onBackToDashboard?: () => void;
}

export default function ReportsPage({ activeTab = 'reports', setActiveTab, onBackToDashboard }: ReportsPageProps) {
  const { user } = useAuth();
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const res = await api.get(`/reports/monthly?month=${selectedMonth}&year=${selectedYear}`);
      setReportData(res.data?.data || null);
    } catch (err: any) {
      console.error('Gagal mengambil laporan:', err);
      setFetchError(err.response?.data?.message || 'Gagal memuat data laporan dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  const handlePrint = () => {
    window.print();
  };

  const isTeacherRole = user?.role === 'TEACHER';

  // Safe summary filter for teacher role
  const rawSummary = Array.isArray(reportData?.summary) ? reportData.summary : [];
  const displaySummary = isTeacherRole
    ? rawSummary.filter((item: any) => {
      if (!item) return false;
      const matchNip = user?.nip && String(item.nip || '').trim() === String(user.nip || '').trim();
      const matchId = user?.id && String(item.id || '') === String(user.id || '');
      const matchName = user?.fullName && String(item.fullName || '').trim() === String(user.fullName || '').trim();
      return matchNip || matchId || matchName;
    })
    : rawSummary;

  const currentMonthLabel = months.find((m) => m.value === Number(selectedMonth))?.label || 'Bulan';

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">

      {/* Print Styles */}
      <style>{`
        @media print {
          aside, header, .no-print {
            display: none !important;
          }
          main {
            padding-left: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-area {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (setActiveTab) {
            setActiveTab(tab);
          } else if (tab === 'dashboard' && onBackToDashboard) {
            onBackToDashboard();
          }
        }}
        isOpenMobile={isOpenMobileSidebar}
        setIsOpenMobile={setIsOpenMobileSidebar}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">

        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpenMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-500">
              {isTeacherRole ? 'LAPORAN PRESENSI PRIBADI GURU' : 'REKAPITULASI PRESENSI MASTER'} • UPT SPF SD INPRES PAJJAIANG 2
            </span>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-brand-500/20"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan PDF
          </button>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full print-area">

          {/* Header Kop Surat */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">

            <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-900 pb-4 gap-4 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <img
                  src="https://cdn.schoolpro.id/public-registration/1782136552284-18747eee3e1c432291f9002be1c93df8.webp"
                  alt="Logo UPT SPF SD INPRES PAJJAIANG 2"
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase">
                    PEMERINTAH KOTA MAKASSAR - DINAS PENDIDIKAN
                  </h1>
                  <h2 className="text-lg sm:text-xl font-black text-brand-600">
                    UPT SPF SD INPRES PAJJAIANG 2
                  </h2>
                  <p className="text-xs text-slate-500">
                    Jl. Luwu Raya No.2 Perumnas Sudiang, Kel. Sudiang Raya, Kec. Biringkanaya, Kota Makassar (90552)
                  </p>
                </div>
              </div>

              {/* Filter Controls (Hidden in Print) */}
              <div className="flex items-center gap-2 no-print self-center sm:self-auto">
                {isLoading && (
                  <div className="w-3.5 h-3.5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mr-1" />
                )}
                <select
                  disabled={isLoading}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 disabled:opacity-50"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <select
                  disabled={isLoading}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 disabled:opacity-50"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center pt-2 space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                {isTeacherRole
                  ? `LAPORAN REKAPITULASI PRESENSI PRIBADI GURU`
                  : `LAPORAN REKAPITULASI PRESENSI GURU BULANAN`}
              </h3>
              <p className="text-xs font-bold text-brand-600 uppercase">
                PERIODE: {currentMonthLabel} {selectedYear}
              </p>
              {isTeacherRole && (
                <div className="text-xs font-bold text-slate-700 pt-1">
                  NAMA GURU: <span className="text-brand-600 font-extrabold">{user?.fullName || '-'}</span> (NIP: {user?.nip || '-'})
                </div>
              )}
            </div>

          </div>

          {/* Fetch Error Warning */}
          {fetchError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                onClick={fetchReport}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 transition shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
              </button>
            </div>
          )}

          {/* Table Summary */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase border-b border-slate-200">
                    <th className="p-3 border-r border-slate-200 text-center w-10">NO</th>
                    <th className="p-3 border-r border-slate-200">NIP / NAMA GURU</th>
                    <th className="p-3 border-r border-slate-200 text-center">SHIFT (1/2)</th>
                    <th className="p-3 border-r border-slate-200 text-center">TEPAT / LATE</th>
                    <th className="p-3 border-r border-slate-200 text-center">IZIN / SAKIT</th>
                    <th className="p-3 border-r border-slate-200 text-center">TOTAL HADIR</th>
                    <th className="p-3 border-r border-slate-200 text-center">TOTAL JAM PRESENSI AKTUAL</th>
                    <th className="p-3 text-center">STATUS REKAP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                          <span>Memuat rekapitulasi data presensi...</span>
                        </div>
                      </td>
                    </tr>
                  ) : displaySummary && displaySummary.length > 0 ? (
                    displaySummary.map((item: any, index: number) => (
                      <tr key={item?.id || index} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center border-r border-slate-200 font-bold">{index + 1}</td>
                        <td className="p-3 border-r border-slate-200">
                          <div className="font-bold text-slate-900">{item?.fullName || '-'}</div>
                          <div className="font-mono text-[10px] text-slate-500">{item?.nip || '-'} • {item?.position || 'Guru'}</div>
                        </td>
                        <td className="p-3 border-r border-slate-200 text-center font-bold">
                          <span className="text-brand-600">{item?.shift1Count || 0} S1</span> / <span className="text-amber-600">{item?.shift2Count || 0} S2</span>
                        </td>
                        <td className="p-3 border-r border-slate-200 text-center font-bold">
                          <span className="text-emerald-600">{item?.presentCount || 0} H</span> | <span className="text-amber-600">{item?.lateCount || 0} L</span>
                        </td>
                        <td className="p-3 border-r border-slate-200 text-center font-bold text-blue-600">
                          {item?.leaveCount || 0} Hari
                        </td>
                        <td className="p-3 border-r border-slate-200 text-center font-black text-slate-800">
                          {item?.totalHadir || 0} Hari
                        </td>
                        <td className="p-3 border-r border-slate-200 text-center font-black text-brand-600">
                          {item?.formattedTotalWork || '0 Jam 0 Menit'}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                            ✓ TERCATAT RESMI
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                        Belum ada rekapitulasi data presensi pada periode {currentMonthLabel} {selectedYear}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Signature Area */}
            <div className="pt-8 flex justify-end">
              <div className="text-center space-y-12 text-xs">
                <div>
                  Makassar, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  <div className="font-bold text-slate-900 mt-1">Kepala Sekolah UPT SPF SD INPRES PAJJAIANG 2</div>
                </div>
                <div className="pt-8">
                  <div className="font-extrabold text-slate-900 underline">HASNIAH T, S.Pd.</div>
                  <div className="text-slate-500 text-[11px]">NIP. 19740214 201101 2 001</div>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
