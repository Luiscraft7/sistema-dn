// API utilities
const API_URL = '/api';

const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error en el servidor' }));
    throw new Error(error.error || 'Error en la petición');
  }
  return response.json();
};

// Auth API
const auth = {
  login: async (username, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },

  getMe: async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  logout: () => {
    removeToken();
    window.location.href = '/login.html';
  }
};

// Negocios API
const negocios = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/negocios`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Clientes API
const clientes = {
  getAll: async (buscar = '') => {
    const url = buscar ? `${API_URL}/clientes?buscar=${encodeURIComponent(buscar)}` : `${API_URL}/clientes`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getCabinas: async (buscar = '') => {
    const url = buscar ? `${API_URL}/clientes/cabinas?buscar=${encodeURIComponent(buscar)}` : `${API_URL}/clientes/cabinas`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/clientes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Trabajos API
const trabajos = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.negocioId) params.append('negocioId', filters.negocioId);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);

    const url = params.toString() ? `${API_URL}/trabajos?${params.toString()}` : `${API_URL}/trabajos`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/trabajos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/trabajos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  updateEstado: async (id, data) => {
    const response = await fetch(`${API_URL}/trabajos/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

// Usuarios API
const usuarios = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/usuarios`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

// Check if user is logged in (solo verifica, no redirige)
const checkAuth = () => {
  const token = getToken();
  return !!token; // Retorna true si hay token, false si no
};

// Verificar autenticación con el servidor
const verifyAuth = async () => {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const user = await auth.getMe();
    return user;
  } catch (error) {
    removeToken();
    return null;
  }
};

// Export API (compatible con navegador)
const API = {
  auth,
  negocios,
  clientes,
  trabajos,
  usuarios,
  checkAuth,
  verifyAuth,
  setToken,
  removeToken,
  getToken
};

// Para compatibilidad con imports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}

// Para uso global en el navegador
if (typeof window !== 'undefined') {
  window.API = API;
}
