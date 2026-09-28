import { useEffect, useState } from 'react';
import { Text, Title2, Title3 } from '@fluentui/react-components';
import { api } from '../api';
import { getLocalHistory } from '../storage';

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api.getHistory(), api.getWorkflows()])
      .then(([historyResponse, workflowResponse]) => {
        if (!active) return;
        const combined = new Map([...historyResponse.history, ...getLocalHistory()].map((item) => [item.id, item]));
        setHistory([...combined.values()].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)));
        setWorkflows(workflowResponse.workflows);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = [
    { label: 'Generation history', value: history.length },
    { label: 'Available workflows', value: workflows.length },
    { label: 'Completed generations', value: history.filter((item) => item.status === 'Completed').length },
  ];

  return (
    <div>
      <div className="page-grid" style={{ marginBottom: '1rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="panel card">
            <Text size={400} weight="semibold" style={{ color: '#94a3b8' }}>{stat.label} : {stat.value}</Text>
          </div>
        ))}
      </div>

      <div className="page-grid">
        <div className="panel card" style={{ gridColumn: 'span 2' }}>
          <Title3 as="h3">Recent generation</Title3>
          <table className="table" style={{ marginTop: '0.75rem' }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.type}</td>
                  <td><span className="badge">{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <Text style={{ display: 'block', marginTop: '0.75rem' }}>Loading dashboard...</Text>}
          {error && <Text role="alert" style={{ display: 'block', marginTop: '0.75rem', color: '#f87171' }}>{error}</Text>}
          {!loading && !error && history.length === 0 && <Text style={{ display: 'block', marginTop: '0.75rem', color: '#94a3b8' }}>No generations yet.</Text>}
        </div>
        <div className="panel card">
          <Title3 as="h3">Available workflows</Title3>
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            {workflows.map((workflow) => (
              <div key={workflow.id} className="panel">
                <Text>{workflow.name}</Text>
                <div style={{ marginTop: '0.25rem' }}><span className="badge">{workflow.status}</span></div>
              </div>
            ))}
            {!loading && !error && workflows.length === 0 && <Text>No workflows available.</Text>}
          </div>
        </div>
      </div>
    </div>
  );
}
