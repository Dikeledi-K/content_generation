async function request(path, options) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const responseText = await response.text();
  let data = {};
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = { error: { message: `Request failed (${response.status})` } };
  }
  if (!response.ok) {
    const error = new Error(data.error?.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
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
  deleteHistoryItem: (id) => request(`/history/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  clearHistory: () => request('/history', { method: 'DELETE' }),
};