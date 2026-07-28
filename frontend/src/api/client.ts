const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(data.error || data.message || 'Request failed', response.status, data.details);
    }

    return data as T;
  } catch (error: any) {
    // If request failed (e.g. Render server waking up from cold start), retry up to N times
    if (retries > 0 && !(error instanceof ApiError && error.status >= 400 && error.status < 500)) {
      console.warn(`Request failed. Retrying... (${retries} attempts left)`);
      await new Promise(res => setTimeout(res, 2000));
      return request<T>(endpoint, options, retries - 1);
    }
    throw error;
  }
}
