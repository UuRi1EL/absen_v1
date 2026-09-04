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
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
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
          table.report-table, .report-table th, .report-table td {
            border: 1px solid black !important;
            border-collapse: collapse !important;
          }
          .report-table th {
            background-color: #f1f5f9 !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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

          {/* Filter Controls Bar (Hidden in Print) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Periode Rekapitulasi:</span>
              <select
                disabled={isLoading}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 disabled:opacity-50 cursor-pointer"
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
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 disabled:opacity-50 cursor-pointer"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-brand-600 font-bold">
                  <div className="w-3.5 h-3.5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  <span>Memuat rekap...</span>
                </div>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Lembar Dokumen
              </button>
            </div>
          </div>

          {/* Fetch Error Warning */}
          {fetchError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center justify-between no-print">
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

          {/* Official Document Sheet Container */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">

            {/* AUTENTIK KOP SURAT PEMERINTAH KOTA MAKASSAR */}
            <div className="w-full" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              <div className="flex items-center justify-between gap-2 sm:gap-4 pb-1">
                
                {/* Logo Kiri: Lambang Pemkot Makassar */}
                <div className="w-16 sm:w-24 shrink-0 flex justify-center items-center">
                  <img
                    src="/images/logo_makassar.png"
                    alt="Lambang Pemerintah Kota Makassar"
                    className="w-14 sm:w-20 h-auto object-contain"
                  />
                </div>

                {/* Teks Kop Surat Resmi (Tengah) */}
                <div className="flex-1 text-center text-black leading-tight space-y-0.5 sm:space-y-1">
                  <h1 className="text-sm sm:text-lg font-bold tracking-wide uppercase">
                    PEMERINTAH KOTA MAKASSAR
                  </h1>
                  <h2 className="text-sm sm:text-xl font-bold tracking-tight uppercase">
                    UPT SPF SEKOLAH DASAR INPRES PAJJAIANG 2
                  </h2>
                  <h3 className="text-[11px] sm:text-base font-bold tracking-normal uppercase">
                    KECAMATAN BIRINGKANAYA KELURAHAN LAIKANG
                  </h3>
                  <div className="text-[10px] sm:text-sm font-bold flex items-center justify-center gap-4 sm:gap-12 pt-0.5">
                    <span>NPSN : 40307607</span>
                    <span>NSS : 101 196 012411</span>
                  </div>
                  <div className="text-[9px] sm:text-xs italic pt-0.5">
                    <span>Jl. Luwu Raya No.2 BSP Makassar Tlp.(0411) 555 747 e-mail : </span>
                    <a 
                      href="mailto:sdipajjaiangII@gmail.com" 
                      className="text-[#0056b3] not-italic underline hover:opacity-80"
                    >
                      sdipajjaiangII@gmail.com
                    </a>
                  </div>
                </div>

                {/* Logo Kanan: Logo Tut Wuri Handayani Kemendikbud */}
                <div className="w-16 sm:w-24 shrink-0 flex justify-center items-center">
                  <img
                    src="/images/logo_tutwuri.png"
                    alt="Logo Tut Wuri Handayani"
                    className="w-14 sm:w-20 h-auto object-contain"
                  />
                </div>

              </div>

              {/* Garis Pembatas Kop Surat Resmi (Garis Tebal Atas + Garis Tipis Bawah) */}
              <div className="w-full pt-1">
                <div className="border-t-[3.5px] border-black w-full" />
                <div className="border-t-[1.5px] border-black w-full mt-[2px]" />
              </div>
            </div>

            {/* Judul Laporan Dokumen */}
            <div className="text-center pt-2 space-y-1" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              <h3 className="text-sm sm:text-base font-bold text-black uppercase tracking-tight underline">
                {isTeacherRole
                  ? `LAPORAN REKAPITULASI PRESENSI PRIBADI GURU`
                  : `LAPORAN REKAPITULASI PRESENSI GURU BULANAN`}
              </h3>
              <p className="text-xs font-bold text-black uppercase">
                PERIODE BULAN : {currentMonthLabel} {selectedYear}
              </p>
              {isTeacherRole && (
                <div className="text-xs font-bold text-slate-800 pt-1" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  NAMA GURU: <span className="text-brand-600 font-extrabold">{user?.fullName || '-'}</span> (NIP: {user?.nip || '-'})
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border-2 border-slate-700 print:border-black report-table">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-100 text-slate-900 font-extrabold uppercase text-center border-b-2 border-slate-700 print:border-black">
                    <th className="p-2.5 border border-slate-500 print:border-black text-center w-10">NO</th>
                    <th className="p-2.5 border border-slate-500 print:border-black text-left">NIP / NAMA GURU</th>
                    <th className="p-2.5 border border-slate-500 print:border-black text-center">SHIFT (1/2)</th>
                    <th className="p-2.5 border border-slate-500 print:border-black text-center">TEPAT / TERLAMBAT</th>
                    <th className="p-2.5 border border-slate-500 print:border-black text-center">IZIN / SAKIT</th>
                    <th className="p-2.5 border border-slate-500 print:border-black text-center">TOTAL HADIR</th>
                    <th className="p-2.5 border border-slate-500 print:border-black text-center">TOTAL JAM AKTUAL</th>
                    <th className="p-2.5 border border-slate-500 print:border-black text-center">STATUS REKAP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-bold border border-slate-400 print:border-black">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                          <span>Memuat rekapitulasi data presensi...</span>
                        </div>
                      </td>
                    </tr>
                  ) : displaySummary && displaySummary.length > 0 ? (
                    displaySummary.map((item: any, index: number) => (
                      <tr key={item?.id || index} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 text-center border border-slate-400 print:border-black font-bold text-slate-900">{index + 1}</td>
                        <td className="p-2.5 border border-slate-400 print:border-black">
                          <div className="font-bold text-slate-900">{item?.fullName || '-'}</div>
                          <div className="font-mono text-[10px] text-slate-600">{item?.nip || '-'} • {item?.position || 'Guru'}</div>
                        </td>
                        <td className="p-2.5 border border-slate-400 print:border-black text-center font-bold">
                          <span className="text-brand-600">{item?.shift1Count || 0} S1</span> / <span className="text-amber-600">{item?.shift2Count || 0} S2</span>
                        </td>
                        <td className="p-2.5 border border-slate-400 print:border-black text-center font-bold">
                          <span className="text-emerald-600">{item?.presentCount || 0} H</span> | <span className="text-amber-600">{item?.lateCount || 0} L</span>
                        </td>
                        <td className="p-2.5 border border-slate-400 print:border-black text-center font-bold text-blue-600">
                          {item?.leaveCount || 0} Hari
                        </td>
                        <td className="p-2.5 border border-slate-400 print:border-black text-center font-black text-slate-900">
                          {item?.totalHadir || 0} Hari
                        </td>
                        <td className="p-2.5 border border-slate-400 print:border-black text-center font-black text-brand-600">
                          {item?.formattedTotalWork || '0 Jam 0 Menit'}
                        </td>
                        <td className="p-2.5 border border-slate-400 print:border-black text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-300 print:border-none print:text-black">
                            ✓ TERCATAT RESMI
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold border border-slate-400 print:border-black">
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
