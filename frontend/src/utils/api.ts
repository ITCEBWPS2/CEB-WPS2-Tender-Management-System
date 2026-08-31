const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5010';

export const apiFetch = (endpoint: string, options?: RequestInit) => {
  return fetch(`${API_URL}${endpoint}`, options);
};