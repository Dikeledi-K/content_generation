import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Spinner } from '@fluentui/react-components';
import { Add20Regular, ArrowRight16Regular, History24Regular } from '@fluentui/react-icons';
import { api } from '../api';
import { mergeWithLocalHistory } from '../storage';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Notice from '../components/Notice';

const RECENT_LIMIT = 5;

export default function Dashboard() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.getHistory(), api.getWorkflows()])
      .then(([historyResult, workflowResult]) => {
        if (!active) return;
        setHistory(mergeWithLocalHistory(historyResult.status === 'fulfilled' ? historyResult.value.history : []));
        if (workflowResult.status === 'fulfilled') setWorkflows(workflowResult.value.workflows);
        const failure = [historyResult, workflowResult].find((result) => result.status === 'rejected');
        if (failure) setError(failure.reason.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = [
    { label: 'Total generations', value: history.length },
    { label: 'Completed with AI', value: history.filter((item) => item.status === 'Completed').length },
    { label: 'Available workflows', value: workflows.length },
  ];

  return (
    <div className="stack">
      <Notice>{error}</Notice>

      <div className="stats" style={{ marginBottom: 0 }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <span className="stat-value">{loading ? '–' : stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="split split-wide">
        <section className="card" aria-labelledby="recent-heading">
          <div className="card-header">
            <h2 id="recent-heading" className="section-title">Recent generations</h2>
            {history.length > 0 && (
              <Link to="/history" className="row" style={{ gap: '0.3rem', fontWeight: 600 }}>
                View all <ArrowRight16Regular />
              </Link>
            )}
          </div>
          {loading ? (
            <Spinner size="small" label="Loading recent work..." />
          ) : history.length === 0 ? (
            <EmptyState
              icon={History24Regular}
              title="No generations yet"
              action={<Button appearance="primary" icon={<Add20Regular />} onClick={() => navigate('/generator')}>Create your first generation</Button>}
            >
              Your generated content and code will show up here.
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, RECENT_LIMIT).map((item) => (
                    <tr key={item.id}>
                      <td className="cell-title" title={item.title}>{item.title}</td>
                      <td>{item.type}</td>
                      <td><StatusBadge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card" aria-labelledby="workflows-heading">
          <div className="card-header">
            <h2 id="workflows-heading" className="section-title">Workflows</h2>
            {workflows.length > 0 && (
              <Link to="/workflows" className="row" style={{ gap: '0.3rem', fontWeight: 600 }}>
                Open <ArrowRight16Regular />
              </Link>
            )}
          </div>
          {loading ? (
            <Spinner size="small" label="Loading workflows..." />
          ) : workflows.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No workflows available.</p>
          ) : (
            <ul className="list">
              {workflows.map((workflow) => (
                <li key={workflow.id} className="list-item">
                  <div>
                    <span className="list-item-title">{workflow.name}</span>
                    <span className="hint">{workflow.steps} steps</span>
                  </div>
                  <StatusBadge status={workflow.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
