import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/reminders', label: 'Reminders', icon: '🔔' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function BottomTabBar() {
  return (
    <>
      {/* White fill behind the home indicator — no black bar at bottom */}
      <div
        className="fixed bottom-0 inset-x-0 bg-white z-40"
        style={{ height: 'var(--safe-bottom)' }}
      />

      {/* Tab bar — sits just above the home indicator */}
      <nav
        className="fixed inset-x-0 flex z-40 border-t border-gray-200"
        style={{
          bottom: 'var(--safe-bottom)',
          height: '56px',
          paddingLeft: 'var(--safe-left)',
          paddingRight: 'var(--safe-right)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
        }}
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors active:opacity-60 ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`
            }
          >
            <span className="text-2xl leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
