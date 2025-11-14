const API_URL = '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error en el servidor' }));
    throw new Error(error.error || 'Error en la petición');
  }
  return response.json();
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Autenticación
export const authApi = {
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
      headers: getAuthHeader()
    });
    return handleResponse(response);
  }
};

// Negocios
export const negociosApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/negocios`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  }
};

// Clientes
export const clientesApi = {
  getAll: async (buscar = '') => {
    const url = buscar 
      ? `${API_URL}/clientes?buscar=${encodeURIComponent(buscar)}`
      : `${API_URL}/clientes`;
    
    const response = await fetch(url, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

// Trabajos
export const trabajosApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.negocioId) params.append('negocioId', filters.negocioId);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);

    const url = params.toString() 
      ? `${API_URL}/trabajos?${params.toString()}`
      : `${API_URL}/trabajos`;

    const response = await fetch(url, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/trabajos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    // data puede ser { descripcion, precioEstimado }
    const response = await fetch(`${API_URL}/trabajos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  updateEstado: async (id, data) => {
    // data puede ser { estado, nota }
    const response = await fetch(`${API_URL}/trabajos/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

// Usuarios
export const usuariosApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/usuarios`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
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
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};
