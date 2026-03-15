const rawBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').trim();
const devFallbackBaseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';

export const API_BASE_URL = (rawBaseUrl || devFallbackBaseUrl).replace(/\/+$/, '');

export function buildApiUrl(path) {
  if (!path) {
    return API_BASE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function getAuthHeaders() {
  const token = localStorage.getItem('token');

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}
