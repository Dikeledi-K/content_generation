import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@fluentui/react-components';
import { Add20Regular, Bookmark24Regular, BookmarkOff20Regular } from '@fluentui/react-icons';
import { getSavedItems, removeSavedItem } from '../storage';
import CopyButton from '../components/CopyButton';
import EmptyState from '../components/EmptyState';

export default function Saved() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(getSavedItems);

  function handleRemove(id) {
    removeSavedItem(id);
    setSaved((current) => current.filter((item) => item.id !== id));
  }

  if (saved.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={Bookmark24Regular}
          title="No saved outputs yet"
          action={<Button appearance="primary" icon={<Add20Regular />} onClick={() => navigate('/generator')}>Go to Generator</Button>}
        >
          Select Save on any output in the Generator to keep it here.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="page-grid">
      {saved.map((item) => (
        <article key={item.id} className="card stack" style={{ alignContent: 'start' }}>
          <div>
            <span className="badge badge-accent">{item.type}</span>
            <h2 className="section-title" style={{ marginTop: '0.6rem' }}>{item.title}</h2>
          </div>
          <pre className={`output-box compact${item.type === 'Code' ? ' code' : ''}`}>{item.content}</pre>
          <div className="row">
            <CopyButton text={item.content} />
            <Button appearance="subtle" icon={<BookmarkOff20Regular />} onClick={() => handleRemove(item.id)}>Remove</Button>
          </div>
        </article>
      ))}
    </div>
  );
}
