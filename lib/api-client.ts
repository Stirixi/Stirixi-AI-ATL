/**
 * API Client for FastAPI Backend
 * Configure your API base URL in environment variables
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    cache: 'no-store', // Disable caching for server components
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Engineer API
export const engineerAPI = {
  getAll: () => fetchAPI('/engineers/'),
  getById: (id: string) => fetchAPI(`/engineers/${id}`),
  create: (data: any) =>
    fetchAPI('/engineers/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchAPI(`/engineers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/engineers/${id}`, { method: 'DELETE' }),
};

// Prompt API
export const promptAPI = {
  getAll: (engineerId?: string) => {
    const params = engineerId ? `?engineer_id=${engineerId}` : '';
    return fetchAPI(`/prompts${params}`);
  },
  getById: (id: string) => fetchAPI(`/prompts/${id}`),
  create: (data: any) =>
    fetchAPI('/prompts/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchAPI(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/prompts/${id}`, { method: 'DELETE' }),
};

// Prospect API
export const prospectAPI = {
  getAll: () => fetchAPI('/prospects/'),
  getById: (id: string) => fetchAPI(`/prospects/${id}`),
  create: (data: any) =>
    fetchAPI('/prospects/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchAPI(`/prospects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/prospects/${id}`, { method: 'DELETE' }),
};

// Project API
export const projectAPI = {
  getAll: () => fetchAPI('/projects/'),
  getById: (id: string) => fetchAPI(`/projects/${id}`),
  create: (data: any) =>
    fetchAPI('/projects/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchAPI(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/projects/${id}`, { method: 'DELETE' }),
};

// Action API
export const actionAPI = {
  getAll: (filters?: {
    engineerId?: string;
    projectId?: string;
    event?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.engineerId) params.append('engineer_id', filters.engineerId);
    if (filters?.projectId) params.append('project_id', filters.projectId);
    if (filters?.event) params.append('event', filters.event);
    const queryString = params.toString();

    return fetchAPI(`/actions${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => fetchAPI(`/actions/${id}`),
  create: (data: any) =>
    fetchAPI('/actions/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchAPI(`/actions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/actions/${id}`, { method: 'DELETE' }),
};
