const API_BASE = '/api';

function getHeaders(includeAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = localStorage.getItem('campusflow_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function authHeaders() {
  const token = localStorage.getItem('campusflow_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// ── Auth ──
export const authAPI = {
  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    }).then(handleResponse),

  register: (data) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(true),
    }).then(handleResponse),
};

// ── Notes ──
export const notesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/notes?${query}`, {
      headers: getHeaders(true),
    }).then(handleResponse);
  },

  getOne: (id) =>
    fetch(`${API_BASE}/notes/${id}`, { headers: getHeaders(true) }).then(handleResponse),

  create: (formData) =>
    fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    }).then(handleResponse),

  summarize: (id) =>
    fetch(`${API_BASE}/notes/${id}/summarize`, {
      method: 'POST',
      headers: getHeaders(true),
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    }).then(handleResponse),
};

// ── Events ──
export const eventsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/events?${query}`, {
      headers: getHeaders(true),
    }).then(handleResponse);
  },

  getOne: (id) =>
    fetch(`${API_BASE}/events/${id}`, { headers: getHeaders(true) }).then(handleResponse),

  create: (data) =>
    fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    }).then(handleResponse),

  rsvp: (id, status) =>
    fetch(`${API_BASE}/events/${id}/rsvp`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    }).then(handleResponse),

  improve: (id) =>
    fetch(`${API_BASE}/events/${id}/improve`, {
      method: 'POST',
      headers: getHeaders(true),
    }).then(handleResponse),
};

// ── Lost & Found ──
export const lostFoundAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/lostfound?${query}`, {
      headers: getHeaders(true),
    }).then(handleResponse);
  },

  create: (data) =>
    fetch(`${API_BASE}/lostfound`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateStatus: (id, status) =>
    fetch(`${API_BASE}/lostfound/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    }).then(handleResponse),

  generateDescription: (rough_input) =>
    fetch(`${API_BASE}/lostfound/generate-description`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ rough_input }),
    }).then(handleResponse),
};

// ── Forum ──
export const forumAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/forum?${query}`, {
      headers: getHeaders(true),
    }).then(handleResponse);
  },

  getOne: (id) =>
    fetch(`${API_BASE}/forum/${id}`, { headers: getHeaders(true) }).then(handleResponse),

  create: (data) =>
    fetch(`${API_BASE}/forum`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    }).then(handleResponse),

  reply: (id, content) =>
    fetch(`${API_BASE}/forum/${id}/reply`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ content }),
    }).then(handleResponse),

  vote: (id, target_type, value) =>
    fetch(`${API_BASE}/forum/${id}/vote`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ target_type, value }),
    }).then(handleResponse),

  explain: (question, answer) =>
    fetch(`${API_BASE}/forum/explain`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ question, answer }),
    }).then(handleResponse),
};

// ── Notifications ──
export const notificationsAPI = {
  getAll: () =>
    fetch(`${API_BASE}/notifications`, { headers: getHeaders(true) }).then(handleResponse),

  markRead: (id) =>
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(true),
    }).then(handleResponse),

  markAllRead: () =>
    fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: getHeaders(true),
    }).then(handleResponse),
};
