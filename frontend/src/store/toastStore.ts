import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message, title, duration = 4500) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, title, duration }]
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  }
}));

export const toast = {
  success: (message: string, title?: string) => {
    const cleanMsg = message.replace(/^[✓✔]\s*/, '');
    useToastStore.getState().addToast('success', cleanMsg, title || 'Berhasil');
  },
  error: (message: string, title?: string) => {
    const cleanMsg = message.replace(/^[❌✖!]\s*/, '');
    useToastStore.getState().addToast('error', cleanMsg, title || 'Terjadi Kendala');
  },
  warning: (message: string, title?: string) => {
    const cleanMsg = message.replace(/^[⚠️!]\s*/, '');
    useToastStore.getState().addToast('warning', cleanMsg, title || 'Peringatan');
  },
  info: (message: string, title?: string) => {
    useToastStore.getState().addToast('info', message, title || 'Informasi');
  }
};

// Seamless global alert override so ANY alert() automatically displays styled theme toast
if (typeof window !== 'undefined') {
  window.alert = (message?: any) => {
    const str = String(message || '');
    if (str.startsWith('✓') || str.toLowerCase().includes('berhasil')) {
      toast.success(str);
    } else if (str.startsWith('❌') || str.toLowerCase().includes('gagal') || str.toLowerCase().includes('error')) {
      toast.error(str);
    } else if (str.startsWith('⚠️') || str.toLowerCase().includes('peringatan') || str.toLowerCase().includes('terkunci')) {
      toast.warning(str);
    } else {
      toast.info(str);
    }
  };
}
