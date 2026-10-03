const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path: string) {
  return path.startsWith('/') ? `${base}${path}` : path;
}
