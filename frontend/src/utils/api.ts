const API_URL = 'http://10.238.5.223:5010';

export const apiFetch = (endpoint: string, options?: RequestInit) => {
  return fetch(`${API_URL}${endpoint}`, options);
};