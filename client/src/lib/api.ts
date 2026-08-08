const TOKEN_KEY = 'amplified.token';

export const INSTAGRAM_HANDLE = 'amplified.jo';
export const INSTAGRAM_DM = `https://ig.me/m/${INSTAGRAM_HANDLE}`;
export const INSTAGRAM_PROFILE = `https://instagram.com/${INSTAGRAM_HANDLE}`;
export const CURRENCY = 'JOD';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Every server error comes back as { error }, so surface that text verbatim. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isForm = init.body instanceof FormData;

  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((payload as { error?: string }).error ?? 'The server did not respond.');
  }
  return payload as T;
}

export async function uploadImages(files: FileList | File[]): Promise<string[]> {
  const form = new FormData();
  Array.from(files).forEach((f) => form.append('images', f));
  const { urls } = await api<{ urls: string[] }>('/uploads', { method: 'POST', body: form });
  return urls;
}
