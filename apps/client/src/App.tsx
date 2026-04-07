import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import RemindersPage from './pages/RemindersPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { App as CapApp } from '@capacitor/app';
import { isNative } from './utils/platform';

const qc = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  if (loading) return (
    <div className="flex items-center justify-center text-gray-400" style={{ height: '100dvh' }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Handles deep links coming back from Google OAuth on iOS
function CapacitorUrlHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isNative) return;
    const sub = CapApp.addListener('appUrlOpen', (data) => {
      const url = new URL(data.url);
      navigate(url.pathname + url.search);
    });
    return () => { sub.then((h) => h.remove()); };
  }, [navigate]);
  return null;
}

export default function App() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <CapacitorUrlHandler />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth-success" element={<AuthCallbackPage />} />
          <Route
            element={
              <AuthGuard>
                <AppShell />
              </AuthGuard>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
