// Client-side API helper. Uses relative URLs since API routes are
// served by the same Next.js process.

const getToken = () =>
  typeof window === 'undefined' ? null : localStorage.getItem('df_token');
const setToken = (token) => localStorage.setItem('df_token', token);
const clearToken = () => localStorage.removeItem('df_token');

const request = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => ({}));
  } else {
    data = await res.text();
  }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }
  return data;
};

export const api = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (name, email, password) =>
    request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  me: () => request('/api/auth/me'),

  listProjects: () => request('/api/project'),
  createProject: (payload) =>
    request('/api/project/create', { method: 'POST', body: JSON.stringify(payload) }),
  generateProject: (projectId) =>
    request('/api/project/generate', { method: 'POST', body: JSON.stringify({ projectId }) }),
  visualizeProject: (projectId, designSystem) =>
    request('/api/project/visualize', {
      method: 'POST',
      body: JSON.stringify({ projectId, designSystem }),
    }),
  getProject: (id) => request(`/api/project/${id}`),
  deleteProject: (id) => request(`/api/project/${id}`, { method: 'DELETE' }),

  download: async (id) => {
    const token = getToken();
    const res = await fetch(`/api/download/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let errorBody = {};
      try { errorBody = await res.json(); } catch (_) {}
      const err = new Error(errorBody?.error || `Download failed (${res.status})`);
      err.status = res.status;
      err.code = errorBody?.code;
      throw err;
    }
    return res.blob();
  },

  setToken,
  clearToken,
  getToken,
};
