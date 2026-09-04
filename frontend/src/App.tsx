import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';
import PrincipalDashboardPage from './pages/principal/PrincipalDashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ReportsPage from './pages/common/ReportsPage';
import QRTerminalPage from './pages/common/QRTerminalPage';
import SchedulePage from './pages/common/SchedulePage';
import SettingsPage from './pages/common/SettingsPage';
import { toast } from './store/toastStore';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Handle QR Scan from HP Camera App (Clean URL Query String Immediately)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const scannedToken = urlParams.get('qrToken');
    if (scannedToken) {
      // Store token in session memory so Android camera app reload won't lose it
      sessionStorage.setItem('scannedQrToken', scannedToken);
      // Clean query string from browser URL address bar seamlessly
      window.history.replaceState({}, document.title, window.location.pathname);
      setActiveTab('attendance');
    }

    const handleNavigateTab = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('navigateTab', handleNavigateTab);
    return () => window.removeEventListener('navigateTab', handleNavigateTab);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          <span className="text-xs font-medium">Memuat Sistem Presensi UPT SPF SD INPRES PAJJAIANG 2...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Global View Navigation Router matching Sidebar items
  if (activeTab === 'reports') {
    return <ReportsPage activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  // RESTRICTED ACCESS: Terminal QR Page is ONLY accessible by ADMIN!
  if (activeTab === 'qr-terminal') {
    if (user.role === 'ADMIN') {
      return <QRTerminalPage onBack={() => setActiveTab('dashboard')} />;
    } else {
      toast.warning('Akses Terkunci: Halaman Terminal Display QR hanya dapat dibuka oleh Admin Sekolah.');
      setActiveTab('dashboard');
    }
  }

  if (activeTab === 'schedule') {
    return <SchedulePage activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  if (activeTab === 'settings') {
    return <SettingsPage activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  if (activeTab === 'users' && (user.role === 'ADMIN' || user.role === 'PRINCIPAL')) {
    return <AdminDashboardPage activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  // Default Role-Based Dashboard Router (dashboard / attendance)
  switch (user.role) {
    case 'PRINCIPAL':
      return <PrincipalDashboardPage activeTab={activeTab} setActiveTab={setActiveTab} />;
    case 'ADMIN':
      return <AdminDashboardPage activeTab={activeTab} setActiveTab={setActiveTab} />;
    case 'TEACHER':
    default:
      return <TeacherDashboardPage activeTab={activeTab} setActiveTab={setActiveTab} />;
  }
}

import PwaInstallPrompt from './components/PwaInstallPrompt';
import ToastContainer from './components/ToastContainer';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <PwaInstallPrompt />
        <ToastContainer />
      </AuthProvider>
    </ErrorBoundary>
  );
}
