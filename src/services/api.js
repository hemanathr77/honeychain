// Central API service — all backend calls go through here
// NEVER call PostgreSQL directly from React

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Token helpers ────────────────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem('hc_token');
}
export function setToken(token) {
  localStorage.setItem('hc_token', token);
}
export function clearToken() {
  localStorage.removeItem('hc_token');
}

// ─── Core request helper ──────────────────────────────────────────────────
async function request(method, path, body = null, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = {
    method,
    headers,
    credentials: 'include', // send cookies
    ...options,
  };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || data?.errors?.[0]?.msg || `Request failed (${res.status})`;
    throw Object.assign(new Error(msg), { status: res.status, data });
  }
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────
export const auth = {
  register: (payload) => request('POST', '/auth/register', payload),
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  logout: () => request('POST', '/auth/logout'),
  me: () => request('GET', '/auth/me'),
};

// ─── Products (marketplace) ───────────────────────────────────────────────
export const products = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/products${q ? '?' + q : ''}`);
  },
  get: (id) => request('GET', `/products/${id}`),
  create: (data) => request('POST', '/products', data),
  update: (id, data) => request('PUT', `/products/${id}`, data),
  mine: () => request('GET', '/products/seller/mine'),
};

// ─── Batches & Traceability ───────────────────────────────────────────────
export const batches = {
  mine: () => request('GET', '/batches/seller/mine'),
  create: (data) => request('POST', '/batches', data),
  traceability: (id) => request('GET', `/batches/${id}/traceability`),
  updateStatus: (id, data) => request('PUT', `/batches/${id}/status`, data),
};

// ─── Farms ────────────────────────────────────────────────────────────────
export const farms = {
  mine: () => request('GET', '/farms'),
  create: (data) => request('POST', '/farms', data),
  colonies: (farmId) => request('GET', `/farms/${farmId}/colonies`),
  addColony: (farmId, data) => request('POST', `/farms/${farmId}/colonies`, data),
};

// ─── Sellers ──────────────────────────────────────────────────────────────
export const sellers = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/sellers${q ? '?' + q : ''}`);
  },
  get: (id) => request('GET', `/sellers/${id}`),
  myProfile: () => request('GET', '/sellers/profile/me'),
  updateProfile: (data) => request('PUT', '/sellers/profile', data),
  dashboardStats: () => request('GET', '/sellers/dashboard/stats'),
};

// ─── Experts ──────────────────────────────────────────────────────────────
export const experts = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/experts${q ? '?' + q : ''}`);
  },
  get: (id) => request('GET', `/experts/${id}`),
  myProfile: () => request('GET', '/experts/profile/me'),
  updateProfile: (data) => request('PUT', '/experts/profile', data),
  dashboardStats: () => request('GET', '/experts/dashboard/stats'),
};

// ─── Orders ──────────────────────────────────────────────────────────────────────────────
export const orders = {
  place: (data) => request('POST', '/orders', data),
  mine: () => request('GET', '/orders/mine'),
  sellerOrders: () => request('GET', '/orders/seller/mine'),
  get: (id) => request('GET', `/orders/${id}`),
  updateStatus: (id, status, notes) => request('PUT', `/orders/${id}/status`, { status, notes }),
  adminAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/orders/admin/all${q ? '?' + q : ''}`);
  },
};

// ─── Rescue ───────────────────────────────────────────────────────────────
export const rescue = {
  // Standard JSON submit (no photo)
  submit: (data) => request('POST', '/rescue', data),
  // Multipart submit with photo file
  submitWithPhoto: (formData) => {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // Do NOT set Content-Type manually — browser sets it with boundary for FormData
    return fetch(`${API_BASE}/rescue`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || `Upload failed (${res.status})`;
        throw Object.assign(new Error(msg), { status: res.status, data });
      }
      return data;
    });
  },
  list: () => request('GET', '/rescue'),
  accept: (id) => request('POST', `/rescue/${id}/accept`),
  updateStatus: (id, data) => request('PUT', `/rescue/${id}/status`, data),
};

// ─── Questions & Answers ──────────────────────────────────────────────────
export const questions = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/questions${q ? '?' + q : ''}`);
  },
  ask: (data) => request('POST', '/questions', data),
  answers: (id) => request('GET', `/questions/${id}/answers`),
  answer: (id, data) => request('POST', `/questions/${id}/answers`, data),
};

// ─── Reviews ──────────────────────────────────────────────────────────────
export const reviews = {
  submit: (data) => request('POST', '/reviews', data),
  forProduct: (id) => request('GET', `/reviews/product/${id}`),
};

// ─── Mentorship ───────────────────────────────────────────────────────────
export const mentorship = {
  request: (data) => request('POST', '/mentorship', data),
  list: () => request('GET', '/mentorship'),
  updateStatus: (id, data) => request('PUT', `/mentorship/${id}`, data),
};

// ─── Admin ────────────────────────────────────────────────────────────────
export const admin = {
  dashboard: () => request('GET', '/admin/dashboard'),
  users: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/admin/users${q ? '?' + q : ''}`);
  },
  suspendUser: (id) => request('PUT', `/admin/users/${id}/suspend`),
  pendingSellers: () => request('GET', '/admin/verifications/sellers'),
  verifySeller: (id, action) => request('PUT', `/admin/verifications/sellers/${id}`, { action }),
  pendingExperts: () => request('GET', '/admin/verifications/experts'),
  verifyExpert: (id, action) => request('PUT', `/admin/verifications/experts/${id}`, { action }),
  fraudFlags: () => request('GET', '/admin/fraud-flags'),
};

// ─── Lab Reports ──────────────────────────────────────────────────────────
export const labReports = {
  mine: () => request('GET', '/lab-reports'),
  get: (id) => request('GET', `/lab-reports/${id}`),
  // Public: look up a report by batch string ID (no auth required)
  forBatch: (batchId) => request('GET', `/lab-reports/batch/${encodeURIComponent(batchId)}`),
  submit: (data) => request('POST', '/lab-reports', data),
  verify: (id, data) => request('PUT', `/lab-reports/${id}/verify`, data),
};

// ─── Users (admin) ────────────────────────────────────────────────────────
export const users = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/users${q ? '?' + q : ''}`);
  },
};

// ─── Blockchain ────────────────────────────────────────────────────────────
// Frontend NEVER connects directly to blockchain — all calls go through Express.
export const blockchain = {
  // Public: verify a batch's data integrity against its blockchain proof
  verify: (batchId) => request('GET', `/blockchain/batches/${encodeURIComponent(batchId)}/verify`),
  // Public: get the stored blockchain proof for a batch
  getProof: (batchId) => request('GET', `/blockchain/batches/${encodeURIComponent(batchId)}`),
  // Public: get all blockchain-anchored traceability events for a batch
  getEvents: (batchId) => request('GET', `/blockchain/batches/${encodeURIComponent(batchId)}/events`),
  // Protected (SELLER/ADMIN): retry a failed blockchain submission
  retry: (batchId) => request('POST', `/blockchain/batches/${encodeURIComponent(batchId)}/retry`),
  // Protected (ADMIN): blockchain connection status + stats
  getStatus: () => request('GET', '/blockchain/status'),
};

// ─── Health ───────────────────────────────────────────────────────────────
export const health = () => request('GET', '/health');

