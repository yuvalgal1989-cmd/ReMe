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
    <div
      className="flex flex-col bg-white"
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
      {/* Status bar spacer */}
      <div className="bg-white flex-shrink-0" style={{ height: 'var(--safe-top)' }} />

      {/* Header — never moves, no fixed positioning */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100 flex items-center justify-center px-4 h-11">
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      </header>

      {/* Notification banner */}
      {!permissionGranted && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <span className="text-amber-800 text-xs">Enable notifications to get reminded on time.</span>
          <button onClick={requestPermission} className="btn-secondary text-xs ml-3 flex-shrink-0">Enable</button>
        </div>
      )}

      {/* Scrollable content — only this part scrolls */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
        <div className="px-4 pt-4 pb-4 w-full max-w-2xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom tab bar — never moves */}
      <BottomTabBar />

      {/* Home indicator spacer */}
      <div className="bg-white flex-shrink-0" style={{ height: 'var(--safe-bottom)' }} />
    </div>
  );
}
