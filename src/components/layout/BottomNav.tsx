import type { Screen } from '../../app/App';

const items: Array<{ key: Screen; title: string }> = [
  { key: 'today', title: 'Сегодня' },
  { key: 'calendar', title: 'Календарь' },
  { key: 'medications', title: 'Приемы' },
  { key: 'symptoms', title: 'Симптомы' },
  { key: 'more', title: 'Еще' }
];

export const BottomNav = ({ screen, onChange }: { screen: Screen; onChange: (screen: Screen) => void }) => (
  <nav className="bottom-nav">
    {items.map((item) => (
      <button key={item.key} type="button" className={`nav-btn ${screen === item.key ? 'active' : ''}`} onClick={() => onChange(item.key)}>
        {item.title}
      </button>
    ))}
  </nav>
);
