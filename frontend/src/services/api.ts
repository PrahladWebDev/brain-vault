const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('brainvault_token');
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const details = isJson ? (body as any).details : undefined;
    const detailMsg = Array.isArray(details) && details.length ? details.map((d: any) => d.msg).join(', ') : undefined;
    const message = detailMsg || (isJson && (body as any).message) || 'Something went wrong';
    if (res.status === 401) {
      localStorage.removeItem('brainvault_token');
      localStorage.removeItem('brainvault_user');
      if (!path.includes('/auth/login')) window.location.href = '/login';
    }
    throw new Error(message);
  }
  return body as T;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T = any>(path: string, data?: any) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T = any>(path: string, data?: any) =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export const setToken = (token: string) => localStorage.setItem('brainvault_token', token);
export const clearToken = () => localStorage.removeItem('brainvault_token');
export const getStoredToken = getToken;

export default api;