import type { Screen } from '../../app/App';

const items: Array<{ key: Screen; title: string; icon: string }> = [
  { key: 'today', title: 'Сегодня', icon: '◌' },
  { key: 'calendar', title: 'Календарь', icon: '◇' },
  { key: 'medications', title: 'Приемы', icon: '▤' },
  { key: 'symptoms', title: 'Симптомы', icon: '∿' },
  { key: 'more', title: 'Еще', icon: '⋯' }
];

export const BottomNav = ({ screen, onChange }: { screen: Screen; onChange: (screen: Screen) => void }) => (
  <nav className="bottom-nav">
    {items.map((item) => (
      <button key={item.key} type="button" className={`nav-btn ${screen === item.key ? 'active' : ''}`} onClick={() => onChange(item.key)}>
        <span className="nav-icon" aria-hidden="true">{item.icon}</span>
        <span>{item.title}</span>
      </button>
    ))}
  </nav>
);
