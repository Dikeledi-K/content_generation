import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Input, Spinner, Textarea } from '@fluentui/react-components';
import { ArrowRight16Regular, Wand24Regular } from '@fluentui/react-icons';
import { api } from '../api';
import CopyButton from '../components/CopyButton';
import EmptyState from '../components/EmptyState';
import Notice from '../components/Notice';

export default function Optimizer() {
  const navigate = useNavigate();
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
    <div className="split">
      <section className="card" aria-labelledby="draft-heading">
        <h2 id="draft-heading" className="section-title" style={{ marginBottom: '1rem' }}>Your draft</h2>
        <form onSubmit={handleOptimize} className="stack">
          <Field label="Draft prompt" required>
            <Textarea
              value={prompt}
              onChange={(event, data) => setPrompt(data.value)}
              placeholder="e.g. Write an email about our new feature"
              resize="vertical"
              rows={5}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <Field label="Goal (optional)"><Input value={goal} onChange={(event, data) => setGoal(data.value)} placeholder="e.g. sign-ups" /></Field>
            <Field label="Audience (optional)"><Input value={audience} onChange={(event, data) => setAudience(data.value)} placeholder="e.g. new customers" /></Field>
            <Field label="Tone (optional)"><Input value={tone} onChange={(event, data) => setTone(data.value)} placeholder="e.g. warm" /></Field>
          </div>
          <div className="row row-end">
            <Button
              appearance="primary"
              type="submit"
              icon={loading ? <Spinner size="tiny" /> : <Wand24Regular />}
              disabled={loading || !prompt.trim()}
            >{loading ? 'Improving...' : 'Improve prompt'}</Button>
          </div>
        </form>
      </section>

      <section className="card" aria-labelledby="improved-heading" aria-live="polite">
        <h2 id="improved-heading" className="section-title" style={{ marginBottom: '1rem' }}>Improved prompt</h2>
        <Notice>{error}</Notice>
        {result ? (
          <div className="stack">
            <pre className="output-box">{result.optimizedPrompt}</pre>
            <p className="hint" style={{ margin: 0 }}>{result.rationale}</p>
            <div className="row">
              <CopyButton text={result.optimizedPrompt} />
              <Button
                appearance="primary"
                icon={<ArrowRight16Regular />}
                iconPosition="after"
                onClick={() => navigate('/generator', { state: { prompt: result.optimizedPrompt } })}
              >Use in Generator</Button>
            </div>
            {result.alternateVariants?.length > 0 && (
              <div>
                <h3 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Other directions to try</h3>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }} className="muted">
                  {result.alternateVariants.map((variant) => <li key={variant}>{variant}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : !error && (
          <EmptyState icon={Wand24Regular} title="No suggestions yet">
            Enter a draft prompt and select Improve prompt.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
