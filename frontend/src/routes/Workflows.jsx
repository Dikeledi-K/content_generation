import { useEffect, useState } from 'react';
import { Button, Title2, Text } from '@fluentui/react-components';
import { api } from '../api';

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState('');
  const [execution, setExecution] = useState(null);

  useEffect(() => {
    let active = true;
    api.getWorkflows()
      .then((response) => { if (active) setWorkflows(response.workflows); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleExecute(workflowId) {
    setRunningId(workflowId);
    setError('');
    setExecution(null);
    try {
      setExecution(await api.executeWorkflow({ workflowId, inputs: {} }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunningId('');
    }
  }

  return (
    <div className="page-grid">
      <div className="panel card" style={{ gridColumn: 'span 2' }}>
        <Title2 as="h2">Workflow Builder</Title2>
        <div style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}>
          {loading && <Text>Loading workflows...</Text>}
          {error && <Text role="alert" style={{ color: '#f87171' }}>{error}</Text>}
          {!loading && !error && workflows.length === 0 && <Text>No workflows available.</Text>}
          {workflows.map((workflow) => (
            <div key={workflow.id} className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <Text weight="semibold">{workflow.name}</Text>
                <Text style={{ display: 'block', color: '#94a3b8' }}>{workflow.steps} steps</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge">{workflow.status}</span>
                <Button className="action-primary" appearance="primary" onClick={() => handleExecute(workflow.id)} disabled={Boolean(runningId)}>
                  {runningId === workflow.id ? 'Running...' : 'Run'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        {execution && <Text role="status" style={{ display: 'block', marginTop: '1rem' }}>{execution.outputs.result}</Text>}
      </div>
    </div>
  );
}
