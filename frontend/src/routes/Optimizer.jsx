import { useState } from 'react';
import { Button, Field, Input, Textarea, Title2, Text } from '@fluentui/react-components';
import { api } from '../api';

export default function Optimizer() {
  const [prompt, setPrompt] = useState('');
  const [goal, setGoal] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleOptimize(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await api.optimizePrompt({ prompt, goal, audience, tone }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-grid">
      <div className="panel card">
        <Title2 as="h2">Prompt optimizer</Title2>
        <form onSubmit={handleOptimize} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          <Field label="Draft prompt">
            <Textarea value={prompt} onChange={(event, data) => setPrompt(data.value)} resize="vertical" required />
          </Field>
          <Field label="Goal"><Input value={goal} onChange={(event, data) => setGoal(data.value)} /></Field>
          <Field label="Audience"><Input value={audience} onChange={(event, data) => setAudience(data.value)} /></Field>
          <Field label="Tone"><Input value={tone} onChange={(event, data) => setTone(data.value)} /></Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button className="action-primary" appearance="primary" type="submit" disabled={loading || !prompt.trim()}>{loading ? 'Improving...' : 'Improve prompt'}</Button>
          </div>
        </form>
      </div>
      <div className="panel card">
        <Title2 as="h2">Suggestions</Title2>
        {error && <Text role="alert" style={{ display: 'block', marginTop: '1rem', color: '#f87171' }}>{error}</Text>}
        {result ? (
          <div style={{ marginTop: '1rem' }}>
            <Text style={{ display: 'block', whiteSpace: 'pre-wrap' }}>{result.optimizedPrompt}</Text>
            <Text style={{ display: 'block', marginTop: '0.75rem', color: '#94a3b8' }}>{result.rationale}</Text>
            <ul style={{ color: '#cbd5e1', lineHeight: 1.8 }}>
              {result.alternateVariants.map((variant) => <li key={variant}>{variant}</li>)}
            </ul>
          </div>
        ) : !error && <Text style={{ display: 'block', marginTop: '1rem', color: '#94a3b8' }}>Your improved prompt will appear here.</Text>}
      </div>
    </div>
  );
}
