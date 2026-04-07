import { Outlet, useLocation } from 'react-router-dom';
import BottomTabBar from './BottomTabBar';
import { useNotifications } from '../../hooks/useNotifications';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/reminders': 'Reminders',
  '/calendar': 'Calendar',
  '/settings': 'Settings',
};

export default function AppShell() {
  const { requestPermission, permissionGranted } = useNotifications();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'ReMe';

  return (
    <div className="flex flex-col w-full bg-gray-50" style={{ minHeight: '100dvh' }}>

      {/* Status bar fill — white block behind the notch/Dynamic Island */}
      <div className="fixed top-0 inset-x-0 bg-white z-50"
        style={{ height: 'var(--safe-top)' }} />

      {/* Top header — sits just below the status bar fill */}
      <header
        className="sticky z-40 bg-white border-b border-gray-100 flex items-center justify-center px-4 w-full"
        style={{ top: 'var(--safe-top)', height: '44px' }}
      >
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      </header>

      {/* Notification permission banner */}
      {!permissionGranted && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <span className="text-amber-800 text-xs">Enable notifications to get reminded on time.</span>
          <button onClick={requestPermission} className="btn-secondary text-xs ml-3 flex-shrink-0">Enable</button>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 overflow-auto w-full">
        <div
          className="px-4 pt-4 w-full max-w-2xl mx-auto"
          style={{ paddingBottom: 'calc(var(--safe-bottom) + 72px)' }}
        >
          <Outlet />
        </div>
      </main>

      <BottomTabBar />
    </div>
  );
}
