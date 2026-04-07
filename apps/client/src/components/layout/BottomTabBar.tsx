import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/reminders', label: 'Reminders', icon: '🔔' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function BottomTabBar() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 flex z-40 border-t border-white/30"
      style={{
        paddingBottom: 'var(--safe-bottom)',
        background: 'rgba(255, 255, 255, 0.75)',
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
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors active:opacity-60 ${
              isActive ? 'text-primary-600' : 'text-gray-400'
            }`
          }
        >
          <span className="text-2xl leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
