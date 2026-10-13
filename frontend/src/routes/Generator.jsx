import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Field, Input, Select, Spinner, Tab, TabList, Textarea } from '@fluentui/react-components';
import {
  ArrowCounterclockwise20Regular,
  ArrowDownload20Regular,
  Attach20Regular,
  Checkmark20Regular,
  Code20Regular,
  Dismiss20Regular,
  DocumentText20Regular,
  Save20Regular,
  Send20Regular,
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

const ATTACHMENT_ONLY_PROMPT = 'Use the attached file(s) as the source material for this request.';

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const FORMAT_NOTES = {
  Image: 'Describe a picture to create, or attach a JPG, PNG or WEBP to improve or edit it. Follow-ups edit the latest image.',
  Audio: 'Paste a script to have it read aloud, or describe the voice-over and it will be written and narrated. Documents can be attached; images cannot.',
};
const FOLLOW_UP_PLACEHOLDERS = {
  code: 'e.g. Add input validation and comments',
  content: 'e.g. Make it shorter and add a call to action',
  Image: 'e.g. Brighten the background and remove the shadow',
  Audio: 'e.g. Read it more slowly, with a pause before the brand name',
};
const LOADING_LABELS = {
  Image: 'Creating your image... this can take up to a minute.',
  Audio: 'Recording your voice-over... this can take up to a minute.',
};
const FILE_EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'audio/wav': 'wav' };

function requestGeneration(settings, prompt, attachments, conversation) {
  return settings.mode === 'code'
    ? api.generateCode({ prompt, language: settings.language, attachments, conversation })
    : api.generateContent({ prompt, tone: settings.tone, format: settings.format, voice: settings.voice, attachments, conversation });
}

function downloadName(turn) {
  return `createai-${turn.media.kind}-${turn.id.slice(-8)}.${FILE_EXTENSIONS[turn.media.mimeType] || 'bin'}`;
}

function toConversation(turns) {
  return turns.flatMap((turn) => [
    { role: 'user', content: turn.prompt || ATTACHMENT_ONLY_PROMPT },
    { role: 'assistant', content: turn.output },
  ]);
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
  const [voice, setVoice] = useState('alloy');
  const [mode, setMode] = useState(location.state?.mode || 'content');
  const [thread, setThread] = useState(null);
  const [followUp, setFollowUp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const latestTurn = useRef(null);
  const turnCount = thread?.turns.length ?? 0;

  useEffect(() => {
    if (turnCount > 1) latestTurn.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [turnCount]);
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

  function addTurn(currentThread, prompt, response) {
    const turn = {
      id: response.id,
      prompt,
      output: response.content || response.code,
      explanation: response.explanation,
      mode: response.mode,
      isCode: Boolean(response.code),
      media: response.media
        ? { ...response.media, url: `data:${response.media.mimeType};base64,${response.media.data}` }
        : null,
      title: currentThread.turns.length
        ? `Follow-up: ${prompt}`
        : prompt || currentThread.attachmentNames.join(', '),
    };
    // Images and audio are too large for browser storage, so history keeps a note instead of the file.
    const historyContent = {
      image: '[Image generated. Images are not kept in history; download it from the Generator.]',
      audio: `[Audio voice-over generated. Audio is not kept in history.]\n\nTranscript:\n${turn.output}`,
    }[turn.media?.kind] ?? turn.output;
    recordGeneration({
      id: turn.id,
      title: turn.title,
      type: currentThread.settings.mode === 'code' ? 'Code' : 'Content',
      status: response.mode === 'demo' ? 'Demo' : 'Completed',
      createdAt: new Date().toISOString(),
      content: historyContent,
    });
    return { ...currentThread, turns: [...currentThread.turns, turn] };
  }

  async function handleGenerate(event) {
    event.preventDefault();
    if (!prompt.trim() && attachments.length === 0) {
      setAttachmentError('Enter a prompt or attach a file to generate.');
      return;
    }
    setLoading(true);
    setError('');
    setThread(null);
    setFollowUp('');
    setSavedIds(new Set());
    try {
      const encodedAttachments = await Promise.all(attachments.map(encodeAttachment));
      // Settings and attachments are captured so follow-ups stay consistent even if the brief form changes.
      const newThread = {
        settings: { mode, tone, format, language, voice },
        attachments: encodedAttachments,
        attachmentNames: attachments.map((file) => file.name),
        turns: [],
      };
      const brief = prompt.trim();
      const response = await requestGeneration(newThread.settings, brief, encodedAttachments, []);
      setThread(addTurn(newThread, brief, response));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowUp(event) {
    event?.preventDefault();
    const text = followUp.trim();
    if (!thread || !text || loading) return;
    setLoading(true);
    setError('');
    try {
      // Image follow-ups edit the most recent picture, so it replaces the original attachments as the reference.
      const latestImage = thread.turns.findLast((turn) => turn.media?.kind === 'image')?.media;
      const followUpAttachments = thread.settings.format === 'Image' && latestImage
        ? [{ name: `previous-image.${FILE_EXTENSIONS[latestImage.mimeType] || 'png'}`, type: latestImage.mimeType, data: latestImage.data }]
        : thread.attachments;
      const response = await requestGeneration(thread.settings, text, followUpAttachments, toConversation(thread.turns));
      setThread((current) => addTurn(current, text, response));
      setFollowUp('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleStartOver() {
    setThread(null);
    setFollowUp('');
    setError('');
    setSavedIds(new Set());
  }

  function handleSave(turn) {
    const stored = saveGeneratedItem({
      id: turn.id,
      title: turn.title,
      type: thread.settings.mode === 'code' ? 'Code' : 'Content',
      content: turn.output,
    });
    if (!stored) {
      setError('Could not save this output because browser storage is full or unavailable. Copy it instead.');
      return;
    }
    setSavedIds((current) => new Set(current).add(turn.id));
  }

  const canGenerate = !loading && (prompt.trim() || attachments.length > 0);
  const activeSettings = thread?.settings ?? { mode, format };
  const loadingLabel = (activeSettings.mode === 'content' && LOADING_LABELS[activeSettings.format])
    || (thread ? 'Revising your output...' : 'Writing your output...');

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
            <div className="stack" style={{ gap: '0.6rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <Field label="Format">
                  <Select value={format} onChange={(event, data) => setFormat(data.value)}>
                    <optgroup label="Text">
                      <option>Landing page</option>
                      <option>Blog</option>
                      <option>Email</option>
                      <option>Social media post</option>
                      <option>X post</option>
                    </optgroup>
                    <optgroup label="Media">
                      <option value="Image">Image</option>
                      <option value="Audio">Audio (voice-over)</option>
                    </optgroup>
                  </Select>
                </Field>
                {format === 'Audio' && (
                  <Field label="Voice">
                    <Select value={voice} onChange={(event, data) => setVoice(data.value)}>
                      {VOICES.map((name) => <option key={name} value={name}>{name[0].toUpperCase() + name.slice(1)}</option>)}
                    </Select>
                  </Field>
                )}
                {format !== 'Image' && (
                  <Field label={format === 'Audio' ? 'Delivery (optional)' : 'Tone (optional)'}>
                    <Input
                      value={tone}
                      onChange={(event, data) => setTone(data.value)}
                      placeholder={format === 'Audio' ? 'e.g. calm, energetic' : 'e.g. friendly, formal'}
                    />
                  </Field>
                )}
              </div>
              {FORMAT_NOTES[format] && <p className="hint" style={{ margin: 0 }}>{FORMAT_NOTES[format]}</p>}
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

      <section className="card" aria-labelledby="output-heading">
        <div className="card-header">
          <h2 id="output-heading" className="section-title">Output</h2>
          {thread && (
            <div className="row">
              <span className={`badge ${thread.turns.at(-1).mode === 'demo' ? 'badge-warning' : 'badge-success'}`}>
                {thread.turns.at(-1).mode === 'demo' ? 'Demo output' : 'AI generated'}
              </span>
              <Button appearance="subtle" size="small" icon={<ArrowCounterclockwise20Regular />} onClick={handleStartOver} disabled={loading}>
                Start over
              </Button>
            </div>
          )}
        </div>

        {thread && (
          <ol className="thread" aria-live="polite">
            {thread.turns.map((turn, index) => (
              <li key={turn.id} className="turn" ref={index === thread.turns.length - 1 ? latestTurn : undefined}>
                <div className="turn-prompt">
                  <span className="turn-label">{index === 0 ? 'Your brief' : 'Follow-up'}</span>
                  <p>{turn.prompt || `Attached: ${thread.attachmentNames.join(', ')}`}</p>
                </div>
                {turn.media?.kind === 'image' && (
                  <img className="output-media" src={turn.media.url} alt={`Generated for: ${turn.prompt || 'your brief'}`} />
                )}
                {turn.media?.kind === 'audio' && (
                  <audio className="output-audio" controls src={turn.media.url}>
                    Your browser cannot play this audio. Use Download instead.
                  </audio>
                )}
                {turn.media?.kind !== 'image' && (
                  <pre className={`output-box${turn.isCode ? ' code' : ''}`}>
                    {turn.media?.kind === 'audio' && <span className="turn-label" style={{ display: 'block' }}>Transcript</span>}
                    {turn.output}
                  </pre>
                )}
                <div className="row">
                  {turn.media && (
                    <Button as="a" appearance="primary" icon={<ArrowDownload20Regular />} href={turn.media.url} download={downloadName(turn)}>
                      Download {turn.media.kind === 'image' ? 'image' : 'audio'}
                    </Button>
                  )}
                  {turn.media?.kind !== 'image' && <CopyButton text={turn.output} label={turn.media ? 'Copy transcript' : 'Copy'} />}
                  {!turn.media && (
                    <Button
                      appearance="secondary"
                      icon={savedIds.has(turn.id) ? <Checkmark20Regular /> : <Save20Regular />}
                      onClick={() => handleSave(turn)}
                      disabled={savedIds.has(turn.id)}
                    >{savedIds.has(turn.id) ? 'Saved' : 'Save'}</Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {loading && <Spinner label={loadingLabel} style={{ padding: thread ? '1.25rem 0' : '2.5rem 0' }} />}

        {error && <div style={{ marginTop: thread ? '1rem' : 0 }}><Notice>{error}</Notice></div>}

        {thread && (
          <form onSubmit={handleFollowUp} className="follow-up stack">
            <p className="hint" style={{ margin: 0 }}>{thread.turns.at(-1).explanation}</p>
            <Field label="Follow-up" hint="Ask for changes to the latest output. Press Ctrl+Enter to send.">
              <Textarea
                value={followUp}
                onChange={(event, data) => setFollowUp(data.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) handleFollowUp(event);
                }}
                placeholder={FOLLOW_UP_PLACEHOLDERS[thread.settings.mode === 'code' ? 'code' : thread.settings.format] || FOLLOW_UP_PLACEHOLDERS.content}
                resize="vertical"
                rows={3}
                disabled={loading}
              />
            </Field>
            <div className="row row-end">
              <Button appearance="primary" type="submit" icon={loading ? <Spinner size="tiny" /> : <Send20Regular />} disabled={loading || !followUp.trim()}>
                {loading ? 'Sending...' : 'Send follow-up'}
              </Button>
            </div>
          </form>
        )}

        {!thread && !loading && !error && (
          <EmptyState icon={Sparkle24Regular} title="Nothing generated yet">
            Fill in your brief and select Generate. You can then send follow-ups to refine the result.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
