import { NavLink } from 'react-router-dom';
import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Title3,
  Button,
  Divider,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  shell: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'Segoe UI Variable, Segoe UI, sans-serif',
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    background: 'rgba(15, 23, 42, 0.95)',
    borderBottom: '1px solid #334155',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  nav: {
    display: 'flex',
    gap: '0.85rem',
    flexWrap: 'wrap',
  },
  navLink: {
    ...shorthands.borderRadius('999px'),
    padding: '0.5rem 0.8rem',
    color: '#cbd5e1',
    textDecoration: 'none',
    fontSize: '0.92rem',
    fontWeight: 600,
    background: 'transparent',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
    ':hover': {
      borderColor: '#334155',
      background: 'rgba(148, 163, 184, 0.08)',
    },
  },
  activeLink: {
    color: '#111827',
    background: '#d4af37',
    borderColor: '#d4af37',
  },
  content: {
    padding: '1.5rem',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  actions: {
    display: 'flex',
    gap: '0.65rem',
  },
});

const navItems = [
  ['Dashboard', '/dashboard'],
  ['Generator', '/generator'],
  ['Prompt Library', '/prompts'],
  ['Prompt Optimizer', '/optimizer'],
  ['Workflow Builder', '/workflows'],
  ['History', '/history'],
  ['Saved Content', '/saved'],
  ['About', '/about'],
];

export default function AppShell({ children }) {
  const styles = useStyles();

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div>
          <Text weight="semibold" size={500} style={{ color: '#f8fafc' }}>
            CreateAI
          </Text>
        </div>
        <nav className={styles.nav}>
          {navItems.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.activeLink : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.actions}>
          <Button className="action-secondary" appearance="secondary">Export</Button>
          <Button className="action-primary" appearance="primary">New Run</Button>
        </div>
      </header>
      <main className={styles.content}>
        <div className={styles.titleRow}>
          <Title3 as="h1">Workspace</Title3>
          <Text size={300} style={{ color: '#94a3b8' }}>
            Content + code generation studio
          </Text>
        </div>
        <Divider style={{ marginBottom: '1.25rem' }} />
        {children}
      </main>
    </div>
  );
}
