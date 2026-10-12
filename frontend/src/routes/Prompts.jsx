import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Spinner } from '@fluentui/react-components';
import { ArrowRight16Regular, Library24Regular, Search20Regular } from '@fluentui/react-icons';
import { api } from '../api';
import EmptyState from '../components/EmptyState';
import Notice from '../components/Notice';

export default function Prompts() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getTemplates()
      .then((response) => { if (active) setTemplates(response.templates); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredTemplates = templates.filter((template) =>
    `${template.name} ${template.category}`.toLowerCase().includes(search.toLowerCase()),
  );

  function applyTemplate(template) {
    navigate('/generator', {
      state: {
        prompt: `${template.name}: `,
        mode: template.category === 'Engineering' ? 'code' : 'content',
      },
    });
  }

  return (
    <div className="stack">
      <Input
        contentBefore={<Search20Regular />}
        placeholder="Search templates by name or category"
        aria-label="Search templates"
        value={search}
        onChange={(event, data) => setSearch(data.value)}
        size="large"
        style={{ maxWidth: 480 }}
      />

      <Notice>{error}</Notice>

      {loading ? (
        <Spinner size="small" label="Loading templates..." />
      ) : !error && filteredTemplates.length === 0 ? (
        <div className="card">
          <EmptyState icon={Library24Regular} title="No templates found">
            {search ? `Nothing matches “${search}”. Try a different word.` : 'No templates are available yet.'}
          </EmptyState>
        </div>
      ) : (
        <div className="page-grid">
          {filteredTemplates.map((template) => (
            <article key={template.id} className="card stack" style={{ alignContent: 'space-between' }}>
              <div>
                <span className="badge badge-accent">{template.category}</span>
                <h2 className="section-title" style={{ marginTop: '0.6rem' }}>{template.name}</h2>
              </div>
              <div>
                <Button appearance="secondary" icon={<ArrowRight16Regular />} iconPosition="after" onClick={() => applyTemplate(template)}>
                  Use template
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
