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
      className="flex-shrink-0 flex border-t border-gray-200"
      style={{
        height: '56px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
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
  );
}
