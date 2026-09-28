import { useEffect, useState } from 'react';
import { Button, Title2, Title3, Text } from '@fluentui/react-components';
import { api } from '../api';
import { clearLocalHistory, getLocalHistory, removeLocalHistoryItem } from '../storage';

export default function History() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [updating, setUpdating] = useState(false);

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

  async function handleDelete(item) {
    setError('');
    setUpdating(true);
    try {
      try {
        await api.deleteHistoryItem(item.id);
      } catch (deleteError) {
        if (deleteError.status !== 404) throw deleteError;
      }
      removeLocalHistoryItem(item.id);
      setHistory((current) => current.filter((entry) => entry.id !== item.id));
      setSelectedItem((current) => current?.id === item.id ? null : current);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleClear() {
    setError('');
    setUpdating(true);
    try {
      let serverClearError = null;
      try {
        await api.clearHistory();
      } catch (requestError) {
        serverClearError = requestError;
      }
      clearLocalHistory();
      setHistory([]);
      setSelectedItem(null);
      setConfirmClear(false);
      if (serverClearError) setError(`Local history was cleared, but server history could not be cleared: ${serverClearError.message}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="panel card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <Title2 as="h2">History</Title2>
        {confirmClear ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Text>Clear all {history.length} history entries?</Text>
            <Button className="action-primary" appearance="primary" onClick={handleClear} disabled={updating}>Clear all</Button>
            <Button className="action-secondary" appearance="secondary" onClick={() => setConfirmClear(false)} disabled={updating}>Cancel</Button>
          </div>
        ) : (
          <Button
            className="action-secondary"
            appearance="secondary"
            onClick={() => setConfirmClear(true)}
            disabled={updating || history.length === 0}
          >Clear history</Button>
        )}
      </div>
      <table className="table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.type}</td>
              <td><span className="badge">{item.status}</span></td>
              <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <Button
                  className="action-secondary"
                  appearance="secondary"
                  onClick={() => setSelectedItem(item)}
                  disabled={updating}
                >View output</Button>
                <Button
                  className="action-secondary"
                  appearance="secondary"
                  style={{ marginLeft: '0.5rem' }}
                  aria-label={`Delete ${item.title}`}
                  onClick={() => handleDelete(item)}
                  disabled={updating}
                >Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedItem && (
        <div className="panel" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <Title3 as="h3">{selectedItem.title}</Title3>
            <Button className="action-secondary" appearance="secondary" onClick={() => setSelectedItem(null)}>Close</Button>
          </div>
          {selectedItem.content ? (
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: 'inherit', margin: '0.75rem 0 0' }}>{selectedItem.content}</pre>
          ) : (
            <Text style={{ display: 'block', marginTop: '0.75rem', color: '#cbd5e1' }}>Output wasn’t saved for this older history entry.</Text>
          )}
        </div>
      )}
      {loading && <Text style={{ display: 'block', marginTop: '0.75rem' }}>Loading history...</Text>}
      {error && <Text role="alert" style={{ display: 'block', marginTop: '0.75rem', color: '#f87171' }}>{error}</Text>}
      {!loading && !error && history.length === 0 && <Text style={{ display: 'block', marginTop: '0.75rem', color: '#94a3b8' }}>No generations yet.</Text>}
    </div>
  );
}
