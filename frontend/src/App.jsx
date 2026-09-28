import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './routes/Dashboard';
import Generator from './routes/Generator';
import Prompts from './routes/Prompts';
import Optimizer from './routes/Optimizer';
import Workflows from './routes/Workflows';
import History from './routes/History';
import Saved from './routes/Saved';
import About from './routes/About';
import AppShell from './components/AppShell';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/optimizer" element={<Optimizer />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/history" element={<History />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </AppShell>
  );
}
