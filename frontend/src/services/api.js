const API = process.env.REACT_APP_BACKEND_URL || '';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('nameh_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('nameh_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('nameh_token');
  }

  async request(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...opts.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API}${path}`, { ...opts, headers });

    if (res.status === 401) {
      this.clearToken();
      window.location.href = '/auth';
      return null;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Request failed (${res.status})`);
    }
    return res.json();
  }

  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  patch(path, body) { return this.request(path, { method: 'PATCH', body: JSON.stringify(body) }); }
  del(path) { return this.request(path, { method: 'DELETE' }); }
}

const api = new ApiClient();
export default api;
