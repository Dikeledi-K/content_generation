import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Spinner,
} from '@fluentui/react-components';
import { Add20Regular, Delete20Regular, Eye20Regular, History24Regular } from '@fluentui/react-icons';
import { api } from '../api';
import { clearLocalHistory, mergeWithLocalHistory, removeLocalHistoryItem } from '../storage';
import CopyButton from '../components/CopyButton';
import EmptyState from '../components/EmptyState';
import Notice from '../components/Notice';
import StatusBadge from '../components/StatusBadge';

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let active = true;
    api.getHistory()
      .then((response) => { if (active) setHistory(mergeWithLocalHistory(response.history)); })
      .catch((requestError) => {
        if (!active) return;
        setHistory(mergeWithLocalHistory());
        setWarning(`Server history is unavailable, so only history saved in this browser is shown. ${requestError.message}`);
      })
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
      if (serverClearError) setError(`Local history was cleared, but server history could not be cleared: ${serverClearError.message}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setConfirmClear(false);
      setUpdating(false);
    }
  }

  return (
    <section className="card" aria-labelledby="history-heading">
      <div className="card-header">
        <div>
          <h2 id="history-heading" className="section-title">All generations</h2>
          {!loading && <span className="hint">{history.length} {history.length === 1 ? 'entry' : 'entries'}</span>}
        </div>
        <Button
          appearance="secondary"
          icon={<Delete20Regular />}
          onClick={() => setConfirmClear(true)}
          disabled={updating || history.length === 0}
        >Clear history</Button>
      </div>

      <div className="stack">
        <Notice intent="warning">{warning}</Notice>
        <Notice>{error}</Notice>

        {loading ? (
          <Spinner size="small" label="Loading history..." />
        ) : history.length === 0 ? (
          <EmptyState
            icon={History24Regular}
            title="No generations yet"
            action={<Button appearance="primary" icon={<Add20Regular />} onClick={() => navigate('/generator')}>Start generating</Button>}
          >
            Everything you generate is listed here so you can find it again.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="cell-actions"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="cell-title" title={item.title}>{item.title}</td>
                    <td>{item.type}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</td>
                    <td className="cell-actions">
                      <Button
                        appearance="subtle"
                        icon={<Eye20Regular />}
                        onClick={() => setSelectedItem(item)}
                        disabled={updating}
                      >View</Button>
                      <Button
                        appearance="subtle"
                        icon={<Delete20Regular />}
                        aria-label={`Delete ${item.title}`}
                        title="Delete"
                        onClick={() => handleDelete(item)}
                        disabled={updating}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={Boolean(selectedItem)} onOpenChange={(event, data) => { if (!data.open) setSelectedItem(null); }}>
        <DialogSurface style={{ maxWidth: 760 }}>
          <DialogBody>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogContent>
              <div className="row" style={{ marginBottom: '0.75rem' }}>
                <span className="badge">{selectedItem?.type}</span>
                {selectedItem && <StatusBadge status={selectedItem.status} />}
              </div>
              {selectedItem?.content ? (
                <pre className={`output-box${selectedItem.type === 'Code' ? ' code' : ''}`}>{selectedItem.content}</pre>
              ) : (
                <p className="muted">Output wasn’t saved for this older history entry.</p>
              )}
            </DialogContent>
            <DialogActions>
              {selectedItem?.content && <CopyButton text={selectedItem.content} />}
              <Button appearance="primary" onClick={() => setSelectedItem(null)}>Close</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={confirmClear} onOpenChange={(event, data) => setConfirmClear(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Clear all history?</DialogTitle>
            <DialogContent>
              This permanently removes all {history.length} history {history.length === 1 ? 'entry' : 'entries'}. Saved outputs are not affected.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setConfirmClear(false)} disabled={updating}>Cancel</Button>
              <Button appearance="primary" onClick={handleClear} disabled={updating}>{updating ? 'Clearing...' : 'Clear history'}</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}
