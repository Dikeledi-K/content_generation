import { useEffect, useState } from 'react';
import { Button, Spinner } from '@fluentui/react-components';
import { Flow24Regular, Play20Regular } from '@fluentui/react-icons';
import { api } from '../api';
import EmptyState from '../components/EmptyState';
import Notice from '../components/Notice';
import StatusBadge from '../components/StatusBadge';

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

  const executedName = workflows.find((workflow) => workflow.id === execution?.workflowId)?.name;

  return (
    <section className="card" aria-labelledby="workflows-heading">
      <h2 id="workflows-heading" className="section-title" style={{ marginBottom: '1rem' }}>Available workflows</h2>
      <div className="stack">
        <Notice>{error}</Notice>
        {execution && <Notice intent="success">{executedName ? `${executedName}: ` : ''}{execution.outputs.result}</Notice>}

        {loading ? (
          <Spinner size="small" label="Loading workflows..." />
        ) : !error && workflows.length === 0 ? (
          <EmptyState icon={Flow24Regular} title="No workflows available" />
        ) : (
          <ul className="list">
            {workflows.map((workflow) => (
              <li key={workflow.id} className="list-item">
                <div>
                  <span className="list-item-title">{workflow.name}</span>
                  <span className="hint">{workflow.steps} steps</span>
                </div>
                <div className="row">
                  <StatusBadge status={workflow.status} />
                  <Button
                    appearance="primary"
                    icon={runningId === workflow.id ? <Spinner size="tiny" /> : <Play20Regular />}
                    onClick={() => handleExecute(workflow.id)}
                    disabled={Boolean(runningId)}
                  >
                    {runningId === workflow.id ? 'Running...' : 'Run'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
