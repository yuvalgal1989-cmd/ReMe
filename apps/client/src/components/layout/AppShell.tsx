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
    <div className="flex flex-col min-h-screen">
      {/* iOS-style top header — respects notch/Dynamic Island */}
      <header
        className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-end justify-center px-4 pb-3"
        style={{ paddingTop: 'calc(var(--safe-top) + 8px)' }}
      >
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      </header>

      {/* Notification permission banner */}
      {!permissionGranted && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-sm">
          <span className="text-amber-800 text-xs">Enable notifications to get reminded on time.</span>
          <button onClick={requestPermission} className="btn-secondary text-xs ml-3 flex-shrink-0">Enable</button>
        </div>
      )}

      {/* Page content — bottom padding clears the tab bar + home indicator */}
      <main className="flex-1 overflow-auto">
        <div
          className="p-4 max-w-2xl mx-auto"
          style={{ paddingBottom: 'calc(var(--safe-bottom) + 72px)' }}
        >
          <Outlet />
        </div>
      </main>

      <BottomTabBar />
    </div>
  );
}
