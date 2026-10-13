const CONNECTION_LOST_MESSAGE = 'Lost connection to the CreateAI API before it replied. Check that the API server is running, then try again.';

async function request(path, options) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error(CONNECTION_LOST_MESSAGE);
  }

  const responseText = await response.text();
  let data = {};
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    // The API always replies with JSON, so a non-JSON 5xx comes from the dev proxy failing to reach it.
    data = { error: { message: response.status >= 500 ? CONNECTION_LOST_MESSAGE : `Request failed (${response.status})` } };
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