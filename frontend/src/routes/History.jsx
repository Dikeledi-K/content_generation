import { useEffect, useState } from 'react';
import { Title2, Text } from '@fluentui/react-components';
import { api } from '../api';
import { getLocalHistory } from '../storage';

export default function History() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getHistory()
      .then((response) => {
        if (!active) return;
        const combined = new Map([...response.history, ...getLocalHistory()].map((item) => [item.id, item]));
        setHistory([...combined.values()].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)));
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="panel card">
      <Title2 as="h2">History</Title2>
      <table className="table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.type}</td>
              <td><span className="badge">{item.status}</span></td>
              <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <Text style={{ display: 'block', marginTop: '0.75rem' }}>Loading history...</Text>}
      {error && <Text role="alert" style={{ display: 'block', marginTop: '0.75rem', color: '#f87171' }}>{error}</Text>}
      {!loading && !error && history.length === 0 && <Text style={{ display: 'block', marginTop: '0.75rem', color: '#94a3b8' }}>No generations yet.</Text>}
    </div>
  );
}
