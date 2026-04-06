import {
  getStoredAccessToken,
  getStoredRefreshToken,
  persistAuthSession,
} from './auth-session';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:6000').replace(/\/$/, '') + '/api/v1';

type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = {
  params?: Record<string, QueryValue>;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const accessToken = await getStoredAccessToken();
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  return headers;
}

async function tryRefreshSession() {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    await persistAuthSession(null);
    return false;
  }

  const json = await res.json().catch(() => ({}));
  if (!json?.data) {
    await persistAuthSession(null);
    return false;
  }

  await persistAuthSession(json.data);
  return true;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
  hasRetried = false,
): Promise<T> {
  const headers = await getAuthHeaders();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${BASE_URL}${normalizedPath}`);

  for (const [key, value] of Object.entries(options?.params || {})) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    url.searchParams.set(key, String(value));
  }
  
  const res = await fetch(url.toString(), {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json().catch(() => ({}));

  if (res.status === 401 && !hasRetried) {
    const didRefresh = await tryRefreshSession();
    if (didRefresh) {
      return request<T>(method, path, body, options, true);
    }
  }

  if (!res.ok) {
    throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
  }

  // Unwrap the standard backend response { statusCode, message, data }
  return json.data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  postForm: async <T>(path: string, formData: FormData): Promise<T> => {
    const accessToken = await getStoredAccessToken();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    // Do NOT set Content-Type — fetch sets multipart boundary automatically

    const res = await fetch(`${BASE_URL}${normalizedPath}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
    }
    return json.data as T;
  },
};
