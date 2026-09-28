import { useEffect, useState } from 'react';
import { Input, Title2, Text } from '@fluentui/react-components';
import { api } from '../api';

export default function Prompts() {
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

  return (
    <div className="page-grid">
      <div className="panel card" style={{ gridColumn: 'span 2' }}>
        <Title2 as="h2">Prompt Library</Title2>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', marginBottom: '1rem' }}>
          <Input placeholder="Search templates" value={search} onChange={(event, data) => setSearch(data.value)} style={{ flex: 1 }} />
        </div>
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {loading && <Text>Loading templates...</Text>}
          {error && <Text role="alert" style={{ color: '#f87171' }}>{error}</Text>}
          {!loading && !error && filteredTemplates.length === 0 && <Text>No templates found.</Text>}
          {filteredTemplates.map((template) => (
            <div key={template.id} className="panel">
              <Text weight="semibold">{template.name}</Text>
              <Text style={{ display: 'block', marginTop: '0.5rem', color: '#94a3b8' }}>{template.category}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
