async function request(path, options) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Request failed (${response.status})`);
  }
  return data;
}

function post(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export const api = {
  getHealth: () => request('/health'),
  generateContent: (input) => post('/content/generate', input),
  generateCode: (input) => post('/code/generate', input),
  optimizePrompt: (input) => post('/prompts/optimize', input),
  getTemplates: () => request('/prompts/templates'),
  getWorkflows: () => request('/workflows'),
  executeWorkflow: (input) => post('/workflows/execute', input),
  getHistory: () => request('/history'),
};