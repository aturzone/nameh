const API = process.env.REACT_APP_BACKEND_URL || '';
const cache = new Map();

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('nameh_token');
  }

  setToken(t) { this.token = t; localStorage.setItem('nameh_token', t); }
  clearToken() { this.token = null; localStorage.removeItem('nameh_token'); cache.clear(); }

  async request(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...opts.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    if (res.status === 401) { this.clearToken(); window.location.href = '/auth'; return null; }
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || `Error ${res.status}`); }
    return res.json();
  }

  async getCached(path, ttl = 5000) {
    const now = Date.now();
    const hit = cache.get(path);
    if (hit && now - hit.time < ttl) return hit.data;
    const data = await this.request(path);
    cache.set(path, { data, time: now });
    return data;
  }

  invalidate(prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  }

  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  patch(path, body) { return this.request(path, { method: 'PATCH', body: JSON.stringify(body) }); }
  del(path) { return this.request(path, { method: 'DELETE' }); }
}

const api = new ApiClient();
export default api;
