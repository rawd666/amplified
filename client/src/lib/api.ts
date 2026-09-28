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

/** Fetches a file from the API (with the admin token) and hands it to the browser as a download. */
export async function download(path: string, fallbackName: string) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error((payload as { error?: string }).error ?? 'The server did not respond.');
  }

  const disposition = res.headers.get('Content-Disposition') ?? '';
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export async function uploadImages(files: FileList | File[]): Promise<string[]> {
  const form = new FormData();
  Array.from(files).forEach((f) => form.append('images', f));
  const { urls } = await api<{ urls: string[] }>('/uploads', { method: 'POST', body: form });
  return urls;
}

export async function uploadVideo(file: File): Promise<string> {
  const form = new FormData();
  form.append('video', file);
  const { url } = await api<{ url: string }>('/uploads/video', { method: 'POST', body: form });
  return url;
}
