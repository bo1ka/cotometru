export const backendOn = import.meta.env.PUBLIC_BACKEND === 'on';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export async function api<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const response = await fetch(`${base}/api${path}`, {
      credentials: 'same-origin',
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    });
    let data: T | null = null;
    try {
      data = (await response.json()) as T;
    } catch {}
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}
