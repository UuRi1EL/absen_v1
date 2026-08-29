import { useState, useEffect } from 'react';
import { Bell, Check, ShieldCheck, X, AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/axios.instance';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsState, setNotificationsState] = useState<{ [key: string]: boolean }>({});

  const fetchDynamicNotifications = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const items: any[] = [];

      if (user.role === 'TEACHER') {
        // 1. Fetch Today's Real Attendance Record
        try {
          const attRes = await api.get('/attendance/my-history');
          const records = attRes.data?.data || [];
          const isSameDayLocal = (d1: Date, d2: Date) => {
            return (
              d1.getFullYear() === d2.getFullYear() &&
              d1.getMonth() === d2.getMonth() &&
              d1.getDate() === d2.getDate()
            );
          };
          const now = new Date();
          const todayRecord = records.find((r: any) => {
            const recDate = new Date(r.checkInTime || r.createdAt || r.date);
            return isSameDayLocal(recDate, now);
          });

          if (todayRecord) {
            const checkInTimeStr = todayRecord.checkInTime
              ? new Date(todayRecord.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
              : '';
            items.push({
              id: 'n-att-in',
              title: `Presensi Masuk ${todayRecord.status === 'PRESENT' ? 'Tepat Waktu' : 'Terlambat'}`,
              desc: `Presensi Anda terverifikasi pukul ${checkInTimeStr} di area geofencing sekolah.`,
              time: 'Hari Ini',
              unread: !notificationsState['n-att-in'],
              type: 'success'
            });

            if (todayRecord.checkOutTime) {
              const checkOutTimeStr = new Date(todayRecord.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
              items.push({
                id: 'n-att-out',
                title: 'Presensi Pulang Selesai',
                desc: `Presensi pulang Anda tercatat resmi pukul ${checkOutTimeStr}.`,
                time: 'Hari Ini',
                unread: false,
                type: 'info'
              });
            } else {
              items.push({
                id: 'n-att-rem',
                title: 'Pengingat Presensi Pulang',
                desc: 'Jangan lupa presensi pulang (Check-Out) setelah selesai tugas mengajar.',
                time: 'Hari Ini',
                unread: !notificationsState['n-att-rem'],
                type: 'warning'
              });
            }
          } else {
            items.push({
              id: 'n-att-need',
              title: 'Pengingat Presensi Masuk',
              desc: 'Anda belum melakukan presensi masuk hari ini. Silakan presensi via GPS & Selfie.',
              time: 'Hari Ini',
              unread: !notificationsState['n-att-need'],
              type: 'warning'
            });
          }
        } catch (e) {}

        // 2. Fetch Personal Leave Requests
        try {
          const leaveRes = await api.get('/leave/my-requests');
          const leaves = leaveRes.data?.data || [];
          leaves.slice(0, 2).forEach((l: any, idx: number) => {
            const dateStr = new Date(l.startDate).toLocaleDateString('id-ID');
            const statusLabel = l.status === 'APPROVED' ? 'Disetujui' : l.status === 'REJECTED' ? 'Ditolak' : 'Menunggu Approval';
            items.push({
              id: `n-leave-${idx}`,
              title: `Pengajuan Izin: ${statusLabel}`,
              desc: `Permohonan tanggal ${dateStr} (${l.reason || 'Izin Kedinasan'}).`,
              time: 'Riwayat Izin',
              unread: l.status === 'PENDING' && !notificationsState[`n-leave-${idx}`],
              type: l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'info'
            });
          });
        } catch (e) {}

      } else if (user.role === 'PRINCIPAL') {
        // Fetch Pending Leave Requests
        try {
          const leaveRes = await api.get('/leave');
          const allLeaves = leaveRes.data?.data || [];
          const pending = allLeaves.filter((l: any) => l.status === 'PENDING');

          items.push({
            id: 'p-leave',
            title: `${pending.length} Permohonan Izin Menunggu Persetujuan`,
            desc: pending.length > 0 
              ? 'Terdapat surat izin guru yang memerlukan tindakan persetujuan Kepsek.' 
              : 'Seluruh permohonan izin/sakit guru telah selesai diproses.',
            time: 'Real-time',
            unread: pending.length > 0 && !notificationsState['p-leave'],
            type: pending.length > 0 ? 'warning' : 'success'
          });
        } catch (e) {}

      } else if (user.role === 'ADMIN') {
        // Fetch Real School Geofence Data
        try {
          const schoolRes = await api.get('/school');
          const school = schoolRes.data?.data;
          items.push({
            id: 'a-geo',
            title: `Geofencing GPS ${school?.radiusMeters || 150}m Aktif`,
            desc: `Radius geofencing sekolah terproteksi di koordinat (${school?.latitude || '-5.104631'}, ${school?.longitude || '119.534576'}).`,
            time: 'Status Database',
            unread: false,
            type: 'info'
          });
        } catch (e) {}
      }

      setNotifications(items);
    } catch (err) {
      console.error('Gagal mengambil notifikasi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicNotifications();
  }, [user]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    const updated: { [key: string]: boolean } = {};
    notifications.forEach((n) => {
      updated[n.id] = true;
    });
    setNotificationsState(updated);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchDynamicNotifications();
        }}
        className="p-2 rounded-2xl bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600 border border-slate-200/80 transition relative"
        title="Notifikasi Sistem"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-4 space-y-3 animate-modal-pop">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-brand-50 text-brand-600">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">Notifikasi Real-Time</h4>
                <p className="text-[10px] text-slate-400 font-medium">Tersinkronisasi database aktivitas Anda</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={fetchDynamicNotifications}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                title="Segarkan Notifikasi"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center gap-1 transition"
                >
                  <Check className="w-3 h-3 text-emerald-600" /> Baca
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium space-y-2">
                <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" />
                <div>Memuat notifikasi aktivitas real-time...</div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl text-xs space-y-1 transition border ${
                    n.unread
                      ? 'bg-amber-50/60 border-amber-200/80 shadow-xs'
                      : 'bg-slate-50/80 border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />}
                      {n.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      {n.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      {n.type === 'info' && <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{n.desc}</p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                Belum ada notifikasi baru.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> UPT SPF SD INPRES PAJJAIANG 2 System
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
