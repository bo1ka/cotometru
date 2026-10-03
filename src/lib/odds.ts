import type { Couple } from '../data/types';

export function series(c: Couple) {
  const t = c.history.together;
  const i = c.history.temptation;
  const s = t.map((v, k) => 100 - v - i[k]);
  return { t, s, i };
}

export function latest(c: Couple) {
  const { t, s, i } = series(c);
  const n = t.length - 1;
  return { t: t[n], s: s[n], i: i[n], change: n > 0 ? t[n] - t[n - 1] : 0 };
}

export function cota(p: number) {
  return (100 / p).toFixed(2);
}

export function points(p: number) {
  return Math.round(10000 / p);
}

export function changeLabel(d: number) {
  if (d > 0) return `▲ +${d} pp`;
  if (d < 0) return `▼ ${Math.abs(d)} pp`;
  return '0 pp';
}

export function spark(values: number[], w = 96, h = 28) {
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  return values.map((p, k) => `${(k * step).toFixed(1)},${(h - (p * h) / 100).toFixed(1)}`).join(' ');
}

export function ranked(couples: Couple[]) {
  return [...couples].sort((x, y) => latest(y).t - latest(x).t);
}
