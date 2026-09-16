import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/',
});

// Ajoute le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token.replace(/"/g, '')}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Rafraîchit le token automatiquement si expiré (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh');

      if (refresh) {
        try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/'}token/refresh/`, {
            refresh: refresh.replace(/"/g, ''),
          });

          const newToken = res.data.access;
          localStorage.setItem('token', newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch {
          // Refresh expiré aussi → déconnexion
          localStorage.removeItem('token');
          localStorage.removeItem('refresh');
          localStorage.removeItem('proRdvUser');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
