import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-black">Terjadi Kesalahan Tampilan</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Aplikasi mengalami kendala pemuatan sementara. Silakan segarkan halaman untuk memuat ulang sistem presensi.
              </p>
              {this.state.error?.message && (
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-500 font-mono overflow-x-auto text-left">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-brand-500/20"
            >
              <RefreshCw className="w-4 h-4" /> Muat Ulang Sistem
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
