// Thin fetch wrapper: adds the JWT, parses JSON and turns error bodies into Error objects.
const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'bmh_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(method, path, body) {
  const token = tokenStore.get();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('bmh-session-expired'));
    const err = new Error(data?.message || 'Request failed. Please try again.');
    err.status = res.status;
    err.fieldErrors = data?.fieldErrors || {};
    throw err;
  }
  return data;
}

export const qs = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  patch: (p) => request('PATCH', p),
  del: (p) => request('DELETE', p),
};
