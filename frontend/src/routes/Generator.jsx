import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Field, Input, Select, Spinner, Tab, TabList, Textarea } from '@fluentui/react-components';
import {
  Attach20Regular,
  Checkmark20Regular,
  Code20Regular,
  Dismiss20Regular,
  DocumentText20Regular,
  Save20Regular,
  Sparkle24Regular,
} from '@fluentui/react-icons';
import { api } from '../api';
import { recordGeneration, saveGeneratedItem } from '../storage';
import CopyButton from '../components/CopyButton';
import EmptyState from '../components/EmptyState';
import Notice from '../components/Notice';

const MAX_ATTACHMENT_COUNT = 5;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_SIZE = 20 * 1024 * 1024;

async function encodeAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      resolve({
        name: file.name,
        type: file.type || 'application/octet-stream',
        data: dataUrl.slice(dataUrl.indexOf(',') + 1),
      });
    };
    reader.onerror = () => reject(reader.error || new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Generator() {
  const location = useLocation();
  const fileInput = useRef(null);
  const [prompt, setPrompt] = useState(location.state?.prompt || '');
  const [tone, setTone] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [format, setFormat] = useState('Landing page');
  const [mode, setMode] = useState(location.state?.mode || 'content');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');

  function handleAttachmentsSelected(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    setAttachmentError('');

    if (attachments.length + selected.length > MAX_ATTACHMENT_COUNT) {
      setAttachmentError(`Attach up to ${MAX_ATTACHMENT_COUNT} files per generation.`);
      return;
    }

    const oversized = selected.find((file) => file.size > MAX_ATTACHMENT_SIZE);
    if (oversized) {
      setAttachmentError(`${oversized.name} exceeds the 10 MB per-file limit.`);
      return;
    }

    const totalSize = [...attachments, ...selected].reduce((total, file) => total + file.size, 0);
    if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
      setAttachmentError('Attachments cannot exceed 20 MB in total.');
      return;
    }

    setAttachments((current) => [...current, ...selected]);
  }

  async function handleGenerate(event) {
    event.preventDefault();
    if (!prompt.trim() && attachments.length === 0) {
      setAttachmentError('Enter a prompt or attach a file to generate.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);
    try {
      const encodedAttachments = await Promise.all(attachments.map(encodeAttachment));
      const response = mode === 'code'
        ? await api.generateCode({ prompt, language, attachments: encodedAttachments })
        : await api.generateContent({ prompt, tone, format, attachments: encodedAttachments });
      const entry = {
        id: response.id,
        title: prompt.trim() || attachments.map((file) => file.name).join(', '),
        type: mode === 'code' ? 'Code' : 'Content',
        content: response.content || response.code,
      };
      setResult({ ...response, entry });
      recordGeneration({
        ...entry,
        status: response.mode === 'demo' ? 'Demo' : 'Completed',
        createdAt: new Date().toISOString(),
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = !loading && (prompt.trim() || attachments.length > 0);

  return (
    <div className="split">
      <section className="card" aria-labelledby="brief-heading">
        <h2 id="brief-heading" className="section-title" style={{ marginBottom: '1rem' }}>Your brief</h2>
        <form onSubmit={handleGenerate} className="stack">
          <TabList
            selectedValue={mode}
            onTabSelect={(event, data) => setMode(data.value)}
            aria-label="Generation type"
          >
            <Tab value="content" icon={<DocumentText20Regular />}>Content</Tab>
            <Tab value="code" icon={<Code20Regular />}>Code</Tab>
          </TabList>

          <Field label="What should we create?" hint="Be specific about the topic, audience and anything that must be included.">
            <Textarea
              value={prompt}
              onChange={(event, data) => setPrompt(data.value)}
              placeholder={mode === 'code' ? 'e.g. A function that validates South African ID numbers' : 'e.g. A launch announcement for our new budgeting app, aimed at students'}
              resize="vertical"
              rows={6}
            />
          </Field>

          {mode === 'code' ? (
            <Field label="Language">
              <Select value={language} onChange={(event, data) => setLanguage(data.value)}>
                <option>JavaScript</option>
                <option>Python</option>
                <option>Java</option>
                <option>SQL</option>
              </Select>
            </Field>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <Field label="Format">
                <Select value={format} onChange={(event, data) => setFormat(data.value)}>
                  <option>Landing page</option>
                  <option>Blog</option>
                  <option>Email</option>
                  <option>Social media post</option>
                  <option>X post</option>
                </Select>
              </Field>
              <Field label="Tone (optional)">
                <Input value={tone} onChange={(event, data) => setTone(data.value)} placeholder="e.g. friendly, formal" />
              </Field>
            </div>
          )}

          <Field
            label="Attachments"
            hint="Optional. Up to 5 files, 10 MB each (20 MB total): images, PDF, Office files, text and source code."
            validationMessage={attachmentError || undefined}
          >
            <div className="stack" style={{ gap: '0.6rem' }}>
              <input
                ref={fileInput}
                className="visually-hidden"
                type="file"
                multiple
                tabIndex={-1}
                aria-hidden="true"
                onChange={handleAttachmentsSelected}
              />
              <div>
                <Button
                  type="button"
                  appearance="secondary"
                  icon={<Attach20Regular />}
                  onClick={() => fileInput.current?.click()}
                  disabled={attachments.length >= MAX_ATTACHMENT_COUNT}
                >Add files</Button>
              </div>
              {attachments.length > 0 && (
                <div className="row">
                  {attachments.map((file, index) => (
                    <span key={`${file.name}-${file.lastModified}-${index}`} className="file-chip">
                      <span className="file-chip-name" title={file.name}>{file.name}</span>
                      <span className="hint">{formatSize(file.size)}</span>
                      <Button
                        type="button"
                        appearance="subtle"
                        size="small"
                        icon={<Dismiss20Regular />}
                        aria-label={`Remove ${file.name}`}
                        onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <div className="row row-end">
            <Button
              appearance="primary"
              size="large"
              type="submit"
              icon={loading ? <Spinner size="tiny" /> : <Sparkle24Regular />}
              disabled={!canGenerate}
            >{loading ? 'Generating...' : 'Generate'}</Button>
          </div>
        </form>
      </section>

      <section className="card" aria-labelledby="output-heading" aria-live="polite">
        <div className="card-header">
          <h2 id="output-heading" className="section-title">Output</h2>
          {result && (
            <span className={`badge ${result.mode === 'demo' ? 'badge-warning' : 'badge-success'}`}>
              {result.mode === 'demo' ? 'Demo output' : 'AI generated'}
            </span>
          )}
        </div>

        {error && <Notice>{error}</Notice>}

        {loading && <Spinner label="Writing your output..." style={{ padding: '2.5rem 0' }} />}

        {result && !loading && (
          <div className="stack">
            <pre className={`output-box${result.code ? ' code' : ''}`}>{result.content || result.code}</pre>
            <p className="hint" style={{ margin: 0 }}>{result.explanation}</p>
            <div className="row">
              <CopyButton text={result.content || result.code} />
              <Button
                appearance="secondary"
                icon={saved ? <Checkmark20Regular /> : <Save20Regular />}
                onClick={() => {
                  saveGeneratedItem(result.entry);
                  setSaved(true);
                }}
                disabled={saved}
              >{saved ? 'Saved' : 'Save'}</Button>
            </div>
          </div>
        )}

        {!result && !loading && !error && (
          <EmptyState icon={Sparkle24Regular} title="Nothing generated yet">
            Fill in your brief and select Generate. The result will appear here.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
