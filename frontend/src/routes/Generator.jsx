import { useState } from 'react';
import { Button, Field, Input, Select, Text, Textarea, Title2, Title3 } from '@fluentui/react-components';
import { api } from '../api';
import { recordGeneration, saveGeneratedItem } from '../storage';

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

export default function Generator() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [format, setFormat] = useState('Landing page');
  const [mode, setMode] = useState('content');
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
      setResult(response);
      recordGeneration({
        id: response.id,
        title: prompt.trim() || attachments.map((file) => file.name).join(', '),
        type: mode === 'code' ? 'Code' : 'Content',
        status: response.mode === 'demo' ? 'Demo' : 'Completed',
        createdAt: new Date().toISOString(),
        content: response.content || response.code,
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-grid">
      <div className="panel card" style={{ gridColumn: 'span 2' }}>
        <Title2 as="h2">Generate content or code</Title2>
        <form onSubmit={handleGenerate} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          <Field label="Generation type">
            <Select value={mode} onChange={(event, data) => setMode(data.value)}>
              <option value="content">Content</option>
              <option value="code">Code</option>
            </Select>
          </Field>
          <Field label="Prompt">
            <Textarea value={prompt} onChange={(event, data) => setPrompt(data.value)} placeholder="Describe what to generate, or attach files" resize="vertical" />
          </Field>
          <Field label="Attachments">
            <input
              aria-label="Attach documents or pictures"
              type="file"
              multiple
              onChange={handleAttachmentsSelected}
              style={{ display: 'block', color: '#f8d6c4' }}
            />
            <Text size={200} style={{ color: '#cbd5e1' }}>Up to 5 files, 10 MB each and 20 MB total. Supports JPEG, PNG, WEBP, GIF, PDF, Office/OpenDocument files, RTF, EPUB, CSV, Markdown, HTML, text, and source files. Images require a vision-capable AI model.</Text>
            {attachments.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Text>{file.name}</Text>
                <Button
                  className="action-secondary"
                  appearance="secondary"
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                >Remove</Button>
              </div>
            ))}
            {attachmentError && <Text role="alert" style={{ color: '#fca5a5' }}>{attachmentError}</Text>}
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
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
              <>
                <Field label="Tone">
                  <Input value={tone} onChange={(event, data) => setTone(data.value)} />
                </Field>
                <Field label="Format">
                  <Select value={format} onChange={(event, data) => setFormat(data.value)}>
                    <option>Landing page</option>
                    <option>Blog</option>
                    <option>Email</option>
                    <option>Social media post</option>
                    <option>X post</option>
                  </Select>
                </Field>
              </>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button className="action-primary" appearance="primary" type="submit" disabled={loading || (!prompt.trim() && attachments.length === 0)}>{loading ? 'Generating...' : 'Generate'}</Button>
          </div>
        </form>
      </div>

      <div className="panel card">
        <Title3 as="h3">Output preview</Title3>
        {error && <Text role="alert" style={{ display: 'block', marginTop: '1rem', color: '#f87171' }}>{error}</Text>}
        {result && (
          <div style={{ marginTop: '1rem' }}>
            <Text style={{ display: 'block', whiteSpace: 'pre-wrap' }}>{result.content || result.code}</Text>
            <Text style={{ display: 'block', marginTop: '0.75rem', color: '#94a3b8' }}>{result.explanation}</Text>
            <Button
              className="action-secondary"
              appearance="secondary"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                saveGeneratedItem({ id: result.id, title: prompt.trim() || attachments.map((file) => file.name).join(', '), type: mode === 'code' ? 'Code' : 'Content', content: result.content || result.code });
                setSaved(true);
              }}
              disabled={saved}
            >{saved ? 'Saved' : 'Save output'}</Button>
          </div>
        )}
        {!result && !error && <Text style={{ display: 'block', marginTop: '1rem', color: '#94a3b8' }}>Generated output will appear here.</Text>}
      </div>
    </div>
  );
}
