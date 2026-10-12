import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@fluentui/react-components';
import {
  Add20Regular,
  Bookmark24Regular,
  Dismiss24Regular,
  Flow24Regular,
  History24Regular,
  Home24Regular,
  Info24Regular,
  Library24Regular,
  Navigation24Regular,
  Sparkle24Regular,
  Wand24Regular,
} from '@fluentui/react-icons';

const navGroups = [
  {
    label: 'Create',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: Home24Regular, description: 'An overview of your recent work and available workflows.' },
      { label: 'Generator', path: '/generator', icon: Sparkle24Regular, description: 'Describe what you need and generate content or code.' },
    ],
  },
  {
    label: 'Prompts',
    items: [
      { label: 'Prompt Library', path: '/prompts', icon: Library24Regular, description: 'Start from a ready-made template.' },
      { label: 'Prompt Optimizer', path: '/optimizer', icon: Wand24Regular, description: 'Make a draft prompt clearer before you generate.' },
    ],
  },
  {
    label: 'Automate',
    items: [
      { label: 'Workflows', path: '/workflows', icon: Flow24Regular, description: 'Run multi-step generation workflows.' },
    ],
  },
  {
    label: 'Library',
    items: [
      { label: 'History', path: '/history', icon: History24Regular, description: 'Every generation, newest first.' },
      { label: 'Saved', path: '/saved', icon: Bookmark24Regular, description: 'Outputs you chose to keep.' },
    ],
  },
];

const aboutItem = { label: 'About', path: '/about', icon: Info24Regular, description: 'What CreateAI is for and how to use it.' };
const allItems = [...navGroups.flatMap((group) => group.items), aboutItem];

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.path} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={onNavigate}>
      <Icon />
      <span>{item.label}</span>
    </NavLink>
  );
}

function Brand() {
  return (
    <>
      <span className="brand-mark"><Sparkle24Regular /></span>
      <span className="brand-name">CreateAI</span>
    </>
  );
}

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = allItems.find((item) => location.pathname.startsWith(item.path));

  useEffect(() => {
    document.title = current ? `${current.label} · CreateAI` : 'CreateAI';
  }, [current]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app">
      <div className="mobile-bar">
        <span className="brand"><Brand /></span>
        <Button
          appearance="subtle"
          icon={menuOpen ? <Dismiss24Regular /> : <Navigation24Regular />}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        />
      </div>

      <div className={`scrim${menuOpen ? ' open' : ''}`} onClick={closeMenu} aria-hidden="true" />

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <NavLink to="/dashboard" className="brand" onClick={closeMenu}><Brand /></NavLink>

        <Button
          className="btn-gold"
          appearance="primary"
          icon={<Add20Regular />}
          onClick={() => { closeMenu(); navigate('/generator'); }}
        >New generation</Button>

        <div className="sidebar-divider" aria-hidden="true" />

        <nav aria-label="Main" style={{ display: 'grid', gap: '1.1rem' }}>
          {navGroups.map((group) => (
            <div key={group.label} className="nav-group">
              <span className="nav-group-label">{group.label}</span>
              {group.items.map((item) => <NavItem key={item.path} item={item} onNavigate={closeMenu} />)}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer nav-group">
          <NavItem item={aboutItem} onNavigate={closeMenu} />
        </div>
      </aside>

      <main className="main">
        {current && (
          <header className="page-header">
            <div>
              <h1 className="page-title">{current.label}</h1>
              <p className="page-description">{current.description}</p>
            </div>
          </header>
        )}
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
