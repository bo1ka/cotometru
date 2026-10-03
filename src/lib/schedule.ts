import type { Schedule } from '../data/types';

const TZ = 'Europe/Bucharest';
const DAY = 86400000;

export interface Airing {
  number: number;
  startsAt: number;
}

function offsetAt(utcMs: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - utcMs;
}

function wallToEpoch(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const first = guess - offsetAt(guess);
  return guess - offsetAt(first);
}

function noonUtc(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d, 12);
}

export function airings(schedule: Schedule, untilMs: number): Airing[] {
  const skip = new Set(schedule.skip ?? []);
  const last = Math.min(untilMs + DAY, schedule.end ? noonUtc(schedule.end) : Infinity);
  const starts: number[] = [];
  for (let day = noonUtc(schedule.start); day <= last; day += DAY) {
    const date = new Date(day);
    const iso = date.toISOString().slice(0, 10);
    if (skip.has(iso)) continue;
    for (const slot of schedule.slots) {
      if (slot.weekday === date.getUTCDay()) starts.push(wallToEpoch(iso, slot.time));
    }
  }
  for (const extra of schedule.extra ?? []) {
    const at = wallToEpoch(extra.date, extra.time);
    if (at <= last) starts.push(at);
  }
  return starts.sort((a, b) => a - b).map((startsAt, k) => ({ number: k + 1, startsAt }));
}

export function nextAiring(schedule: Schedule, nowMs: number): Airing | null {
  return airings(schedule, nowMs + 21 * DAY).find((a) => a.startsAt > nowMs) ?? null;
}

export function describe(airing: Airing) {
  const start = new Date(airing.startsAt);
  const close = new Date(airing.startsAt - 60000);
  const day = new Intl.DateTimeFormat('ro-RO', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
  const weekday = new Intl.DateTimeFormat('ro-RO', { timeZone: TZ, weekday: 'long' });
  const time = new Intl.DateTimeFormat('ro-RO', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    number: String(airing.number),
    when: `${cap(day.format(start))}, ora ${time.format(start)}`,
    closes: `${weekday.format(close)}, ${time.format(close)}`,
    closesTime: time.format(close),
  };
}

export function countdownParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

export function countdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (d > 0) return `Începe în ${d} z ${h} h`;
  if (h > 0) return `Începe în ${h} h ${pad(m)} min`;
  return `Începe în ${m} min ${pad(s)} s`;
}
