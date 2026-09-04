import { useEffect } from 'react';
import { useToastStore, ToastItem, ToastType } from '../store/toastStore';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';

function ToastCard({ item }: { item: ToastItem }) {
  const { removeToast } = useToastStore();

  useEffect(() => {
    if (!item.duration) return;
    const timer = setTimeout(() => {
      removeToast(item.id);
    }, item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, removeToast]);

  const getStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          barGradient: 'from-emerald-500 via-teal-400 to-emerald-600',
          glowBorder: 'border-emerald-500/40',
          titleColor: 'text-emerald-400'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          barGradient: 'from-rose-500 via-pink-400 to-rose-600',
          glowBorder: 'border-rose-500/40',
          titleColor: 'text-rose-400'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          barGradient: 'from-amber-500 via-yellow-400 to-amber-600',
          glowBorder: 'border-amber-500/40',
          titleColor: 'text-amber-400'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
          badgeBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          barGradient: 'from-sky-500 via-blue-400 to-cyan-500',
          glowBorder: 'border-sky-500/40',
          titleColor: 'text-sky-400'
        };
    }
  };

  const style = getStyle(item.type);

  return (
    <div className={`pointer-events-auto w-full bg-slate-900/95 text-white border ${style.glowBorder} rounded-2xl shadow-2xl backdrop-blur-xl p-4 relative overflow-hidden transform transition-all duration-300 animate-slide-down`}>
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.barGradient}`} />

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl border ${style.badgeBg} shrink-0 mt-0.5`}>
          {style.icon}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          {item.title && (
            <h4 className={`text-xs font-black uppercase tracking-wider ${style.titleColor} mb-0.5`}>
              {item.title}
            </h4>
          )}
          <p className="text-xs font-medium text-slate-200 leading-relaxed break-words">
            {item.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => removeToast(item.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          title="Tutup Notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-Dismiss Progress Bar Animation */}
      {item.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
          <div 
            className={`h-full bg-gradient-to-r ${style.barGradient}`}
            style={{
              animation: `toastProgress ${item.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToastStore();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 max-w-md w-full px-4 pointer-events-none">
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes toastSlideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        .animate-slide-down {
          animation: toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} item={toast} />
      ))}
    </div>
  );
}
