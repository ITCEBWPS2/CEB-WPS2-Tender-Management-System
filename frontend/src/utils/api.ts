const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5010';

export interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export const getStoredToken = (): string | null => {
  return (
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('mock-auth-token') ||
    sessionStorage.getItem('mock-auth-token')
  );
};

export const clearStoredAuth = () => {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('mock-auth-token');
  sessionStorage.removeItem('mock-auth-token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};

export const apiFetch = async (endpoint: string, options: ApiFetchOptions = {}) => {
  const { skipAuth = false, headers: customHeaders, ...restOptions } = options;

  const headers = new Headers(customHeaders || {});

  if (!skipAuth && !headers.has('Authorization')) {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...restOptions,
    headers
  });

  if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
    clearStoredAuth();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return response;
};