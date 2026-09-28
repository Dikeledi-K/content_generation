import { useState } from 'react';
import { Title2, Text } from '@fluentui/react-components';
import { getSavedItems } from '../storage';

export default function Saved() {
  const [saved] = useState(getSavedItems);

  return (
    <div className="page-grid">
      {saved.length === 0 && <div className="panel card"><Text>No saved outputs yet.</Text></div>}
      {saved.map((item) => (
        <div key={item.id} className="panel card">
          <Title2 as="h3">{item.title}</Title2>
          <Text style={{ color: '#94a3b8', display: 'block', marginTop: '0.5rem' }}>{item.type}</Text>
          <Text style={{ display: 'block', marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{item.content}</Text>
        </div>
      ))}
    </div>
  );
}
