import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';

function createPdfBuffer(text) {
  const escapedText = text.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
  const stream = `BT /F1 18 Tf 72 720 Td (${escapedText}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

describe('CreateAI API', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('OPENAI_MODEL', '');
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('OPENROUTER_MODEL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('creates content from a prompt', async () => {
    const response = await request(app)
      .post('/api/content/generate')
      .send({ prompt: 'Create a landing page for a fintech app', tone: 'Confident', format: 'Landing page', language: 'JavaScript' });

    expect(response.status).toBe(200);
    expect(response.body.content).toContain('Create a landing page for a fintech app');
    expect(response.body.mode).toBe('demo');
    expect(response.body.explanation).toContain('OPENROUTER_API_KEY');
  });

  it('uses OpenAI to generate prompt-specific content when configured', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-api-key');
    vi.stubEnv('OPENAI_MODEL', 'test-model');
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'A tailored X post about the launch.' } }] }),
    });
    vi.stubGlobal('fetch', providerFetch);

    const response = await request(app)
      .post('/api/content/generate')
      .send({ prompt: 'Announce our eco-friendly running shoes', format: 'X post', tone: 'playful' });

    expect(response.status).toBe(200);
    expect(response.body.content).toBe('A tailored X post about the launch.');
    expect(response.body.mode).toBe('ai');
    expect(providerFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-api-key' }),
        body: expect.stringContaining('Announce our eco-friendly running shoes'),
      })
    );
  });

  it('uses OpenAI to generate code when configured', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-api-key');
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'function add(a, b) { return a + b; }' } }] }),
    });
    vi.stubGlobal('fetch', providerFetch);

    const response = await request(app)
      .post('/api/code/generate')
      .send({ prompt: 'Write an add function', language: 'JavaScript' });

    expect(response.status).toBe(200);
    expect(response.body.code).toBe('function add(a, b) { return a + b; }');
    expect(response.body.mode).toBe('ai');
  });

  it('uses OpenRouter model and endpoint when configured', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    vi.stubEnv('OPENROUTER_MODEL', 'test/provider-model');
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'A tailored product launch post.' } }] }),
    });
    vi.stubGlobal('fetch', providerFetch);

    const response = await request(app)
      .post('/api/content/generate')
      .send({ prompt: 'Announce a new product', format: 'Social media post' });

    expect(response.status).toBe(200);
    expect(response.body.content).toBe('A tailored product launch post.');
    expect(response.body.mode).toBe('ai');
    expect(response.body.explanation).toContain('via OpenRouter');
    expect(providerFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-router-key' }),
        body: expect.stringContaining('test/provider-model'),
      })
    );
  });

  it('identifies stack errors returned by the provider as provider failures', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    const providerFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Maximum call stack size exceeded' } }),
    });
    vi.stubGlobal('fetch', providerFetch);

    const response = await request(app)
      .post('/api/content/generate')
      .send({ prompt: 'Write a summary' });

    expect(response.status).toBe(502);
    expect(response.body.error.message).toContain('OpenRouter rejected the generation request');
    expect(response.body.error.message).toContain('Maximum call stack size exceeded');
  });

  it('sends image attachments to the model as image inputs', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'A caption based on the attached image.' } }] }),
    });
    vi.stubGlobal('fetch', providerFetch);

    const response = await request(app)
      .post('/api/content/generate')
      .send({
        prompt: 'Write a caption for this picture',
        attachments: [{ name: 'photo.png', type: 'image/png', data: Buffer.from('image bytes').toString('base64') }],
      });

    expect(response.status).toBe(200);
    expect(response.body.content).toBe('A caption based on the attached image.');
    const requestBody = JSON.parse(providerFetch.mock.calls[0][1].body);
    expect(requestBody.messages[1].content).toContainEqual({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${Buffer.from('image bytes').toString('base64')}` },
    });
  });

  it('extracts text document attachments into the model request', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'A summary based on the attached brief.' } }] }),
    });
    vi.stubGlobal('fetch', providerFetch);

    const response = await request(app)
      .post('/api/content/generate')
      .send({
        prompt: 'Summarize this brief',
        attachments: [{ name: 'brief.txt', type: 'text/plain', data: Buffer.from('Launch in September for local runners.').toString('base64') }],
      });

    expect(response.status).toBe(200);
    const requestBody = JSON.parse(providerFetch.mock.calls[0][1].body);
    expect(requestBody.messages[1].content).toContain('Launch in September for local runners.');
    expect(requestBody.messages[1].content).toContain('brief.txt');
  });

  it('limits oversized document context before sending it to the model', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Summary of the attached document.' } }] }),
    });
    vi.stubGlobal('fetch', providerFetch);

    const longDocument = 'Guideline section. '.repeat(3000);
    const response = await request(app)
      .post('/api/content/generate')
      .send({
        prompt: 'Summarize this document',
        attachments: [{ name: 'long-guidelines.txt', type: 'text/plain', data: Buffer.from(longDocument).toString('base64') }],
      });

    expect(response.status).toBe(200);
    const requestBody = JSON.parse(providerFetch.mock.calls[0][1].body);
    expect(requestBody.messages[1].content).toContain('[Document text truncated to fit the generation context.]');
    expect(requestBody.messages[1].content.length).toBeLessThan(41000);
  });

  it('validates large base64 document uploads without overflowing the stack', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Summary of the uploaded file.' } }] }),
    });
    vi.stubGlobal('fetch', providerFetch);
    const fileData = Buffer.alloc(2 * 1024 * 1024, 65).toString('base64');

    const response = await request(app)
      .post('/api/content/generate')
      .send({
        prompt: 'Summarize this file',
        attachments: [{ name: 'large-brief.txt', type: 'text/plain', data: fileData }],
      });

    expect(response.status).toBe(200);
    expect(response.body.content).toBe('Summary of the uploaded file.');
    expect(providerFetch).toHaveBeenCalledOnce();
  });

  it('extracts text from PDF attachments into the model request', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'A summary based on the PDF.' } }] }),
    });
    vi.stubGlobal('fetch', providerFetch);
    const pdfBuffer = createPdfBuffer('VITAL Gold Women Content Guidelines');

    const response = await request(app)
      .post('/api/content/generate')
      .send({
        prompt: 'Use the attached guidelines',
        attachments: [{ name: 'guidelines.pdf', type: 'application/pdf', data: pdfBuffer.toString('base64') }],
      });

    expect(response.status).toBe(200);
    const requestBody = JSON.parse(providerFetch.mock.calls[0][1].body);
    expect(requestBody.messages[1].content).toContain('VITAL Gold Women Content Guidelines');
  });

  it('includes document attachments in code-generation requests', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'const title = "Launch";' } }] }),
    });
    vi.stubGlobal('fetch', providerFetch);

    const response = await request(app)
      .post('/api/code/generate')
      .send({
        prompt: 'Create a JavaScript constant based on the brief',
        language: 'JavaScript',
        attachments: [{ name: 'brief.txt', type: 'text/plain', data: Buffer.from('The launch title is Launch.').toString('base64') }],
      });

    expect(response.status).toBe(200);
    const requestBody = JSON.parse(providerFetch.mock.calls[0][1].body);
    expect(requestBody.messages[1].content).toContain('The launch title is Launch.');
  });

  it('rejects unsupported attachment types instead of ignoring them', async () => {
    const response = await request(app)
      .post('/api/content/generate')
      .send({
        prompt: 'Use this file',
        attachments: [{ name: 'archive.exe', type: 'application/octet-stream', data: Buffer.from('file').toString('base64') }],
      });

    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('INVALID_ATTACHMENT');
    expect(response.body.error.message).toContain('not a supported document');
  });

  it('optimizes a prompt', async () => {
    const response = await request(app)
      .post('/api/prompts/optimize')
      .send({ prompt: 'Write an email', goal: 'launch', audience: 'customers', tone: 'friendly' });

    expect(response.status).toBe(200);
    expect(response.body.optimizedPrompt).toContain('launch');
  });
});
