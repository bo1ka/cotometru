import { shows } from '../src/data/shows';
import { nextAiring } from '../src/lib/schedule';
import type { Couple, Show } from '../src/data/types';

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  COOKIE_SECRET?: string;
  ADMIN_TOKEN?: string;
  PRIOR_WEIGHT?: string;
}

type Outcome = 't' | 's' | 'i';
type Odds = { t: number; s: number; i: number; votes: number };

const OUTCOMES: Outcome[] = ['t', 's', 'i'];
const COOKIE = 'cm_vid';
const YEAR = 31536000;
const STALE_MS = 90000;

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

function liveShow(slug: unknown): Show | null {
  return shows.find((s) => s.slug === slug && s.status === 'live' && s.season) ?? null;
}

function seasonPrefix(show: Show) {
  return `${show.slug}-s${show.season!.number}`;
}

function nightId(show: Show, episode: number) {
  return `${seasonPrefix(show)}-e${episode}`;
}

function prior(couple: Couple) {
  const t = couple.history.together.at(-1) ?? 34;
  const i = couple.history.temptation.at(-1) ?? 33;
  return { t, s: 100 - t - i, i };
}

function blend(couple: Couple, counts: Record<Outcome, number>, weight: number): Odds {
  const base = prior(couple);
  const votes = counts.t + counts.s + counts.i;
  const share = (k: Outcome) => ((base[k] / 100) * weight + counts[k]) / (weight + votes);
  const round = (v: number) => Math.round(v * 1000) / 10;
  const t = round(share('t'));
  const i = round(share('i'));
  return { t, s: Math.round((100 - t - i) * 10) / 10, i, votes };
}

function cotaFor(p: number) {
  return Math.round((100 / Math.max(p, 1)) * 100) / 100;
}

async function sign(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
  return btoa(String.fromCharCode(...mac)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function readVisitor(request: Request, secret: string) {
  const raw = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return null;
  const [id, mac] = raw.slice(COOKIE.length + 1).split('.');
  if (!id || !mac) return null;
  return (await sign(secret, id)) === mac ? id : null;
}

async function ensureVisitor(request: Request, env: Env, secret: string) {
  const existing = await readVisitor(request, secret);
  if (existing) return { id: existing, cookie: null as string | null };
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO visitors (id, created_at) VALUES (?, ?)').bind(id, Date.now()).run();
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  const cookie = `${COOKIE}=${id}.${await sign(secret, id)}; Path=/; Max-Age=${YEAR}; HttpOnly; SameSite=Lax${secure}`;
  return { id, cookie };
}

async function computeOdds(env: Env, show: Show) {
  const season = show.season!;
  const weight = Number(env.PRIOR_WEIGHT ?? 50) || 50;
  const rows = await env.DB.prepare(
    `SELECT couple, outcome, COUNT(*) AS n FROM (
       SELECT visitor_id, couple, outcome, MAX(episode) AS episode FROM predictions
       WHERE show = ? AND season = ? GROUP BY visitor_id, couple
     ) GROUP BY couple, outcome`
  )
    .bind(show.slug, season.number)
    .all<{ couple: string; outcome: Outcome; n: number }>();
  const counts = new Map<string, Record<Outcome, number>>();
  for (const row of rows.results) {
    const entry = counts.get(row.couple) ?? { t: 0, s: 0, i: 0 };
    entry[row.outcome] = row.n;
    counts.set(row.couple, entry);
  }
  const now = Date.now();
  const odds: Record<string, Odds> = {};
  const writes = season.couples.map((couple) => {
    const value = blend(couple, counts.get(couple.slug) ?? { t: 0, s: 0, i: 0 }, weight);
    odds[couple.slug] = value;
    return env.DB.prepare(
      `INSERT INTO odds_current (show, season, couple, t, s, i, votes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (show, season, couple) DO UPDATE SET t = excluded.t, s = excluded.s, i = excluded.i, votes = excluded.votes, updated_at = excluded.updated_at`
    ).bind(show.slug, season.number, couple.slug, value.t, value.s, value.i, value.votes, now);
  });
  await env.DB.batch(writes);
  return { odds, updatedAt: now };
}

async function currentOdds(env: Env, show: Show) {
  const season = show.season!;
  const rows = await env.DB.prepare('SELECT couple, t, s, i, votes, updated_at FROM odds_current WHERE show = ? AND season = ?')
    .bind(show.slug, season.number)
    .all<{ couple: string; t: number; s: number; i: number; votes: number; updated_at: number }>();
  const oldest = Math.min(...rows.results.map((r) => r.updated_at));
  if (rows.results.length < season.couples.length || Date.now() - oldest > STALE_MS) return computeOdds(env, show);
  const odds: Record<string, Odds> = {};
  for (const r of rows.results) odds[r.couple] = { t: r.t, s: r.s, i: r.i, votes: r.votes };
  return { odds, updatedAt: oldest };
}

async function allPollResults(env: Env, show: Show) {
  const prefix = seasonPrefix(show);
  const rows = await env.DB.prepare(
    'SELECT poll, option, COUNT(*) AS n FROM poll_votes WHERE poll = ? OR poll LIKE ? GROUP BY poll, option'
  )
    .bind(prefix, `${prefix}-e%`)
    .all<{ poll: string; option: number; n: number }>();
  const tally = (id: string, size: number) => {
    const counts = Array.from({ length: size }, () => 0);
    for (const r of rows.results) if (r.poll === id && r.option >= 0 && r.option < size) counts[r.option] = r.n;
    return { total: counts.reduce((a, b) => a + b, 0), counts };
  };
  const nights: Record<number, { total: number; counts: number[] }> = {};
  for (const q of show.season!.nightly ?? []) nights[q.episode] = tally(nightId(show, q.episode), q.options.length);
  return { poll: show.poll ? tally(prefix, show.poll.options.length) : null, nights };
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

async function body(request: Request) {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return null;
  try {
    const data = await request.json();
    return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function handleOdds(url: URL, env: Env) {
  const show = liveShow(url.searchParams.get('show'));
  if (!show) return json({ error: 'unknown_show' }, 404);
  const { odds, updatedAt } = await currentOdds(env, show);
  const next = show.season!.schedule ? nextAiring(show.season!.schedule, Date.now()) : null;
  const polls = await allPollResults(env, show);
  return json(
    {
      show: show.slug,
      season: show.season!.number,
      updatedAt,
      couples: odds,
      totalVotes: Object.values(odds).reduce((sum, o) => sum + o.votes, 0),
      poll: polls.poll,
      nights: polls.nights,
      next: next ? { number: next.number, startsAt: next.startsAt, closesAt: next.startsAt - 60000 } : null,
    },
    200,
    { 'cache-control': 'public, max-age=20' }
  );
}

async function handlePrediction(request: Request, env: Env, secret: string) {
  const data = await body(request);
  const show = liveShow(data?.show);
  const couple = show?.season!.couples.find((c) => c.slug === data?.couple);
  const outcome = data?.outcome as Outcome;
  if (!show || !couple || !OUTCOMES.includes(outcome)) return json({ error: 'bad_request' }, 400);
  const season = show.season!;
  const next = season.schedule ? nextAiring(season.schedule, Date.now()) : null;
  if (!next) return json({ error: 'season_over' }, 409);
  if (Date.now() >= next.startsAt - 60000) return json({ error: 'closed', episode: next.number }, 409);
  const visitor = await ensureVisitor(request, env, secret);
  const { odds } = await currentOdds(env, show);
  const cota = cotaFor((odds[couple.slug] ?? { ...prior(couple), votes: 0 })[outcome]);
  await env.DB.prepare(
    `INSERT INTO predictions (visitor_id, show, season, couple, episode, outcome, cota, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (visitor_id, show, season, couple, episode) DO UPDATE SET outcome = excluded.outcome, cota = excluded.cota, updated_at = excluded.updated_at`
  )
    .bind(visitor.id, show.slug, season.number, couple.slug, next.number, outcome, cota, Date.now())
    .run();
  return json(
    { ok: true, couple: couple.slug, episode: next.number, outcome, cota, points: Math.round(cota * 100) },
    200,
    visitor.cookie ? { 'set-cookie': visitor.cookie } : {}
  );
}

async function handlePoll(request: Request, env: Env, secret: string) {
  const data = await body(request);
  const show = liveShow(data?.show);
  if (!show) return json({ error: 'bad_request' }, 400);
  const season = show.season!;
  let id: string;
  let size: number;
  if (data?.kind === 'night') {
    const next = season.schedule ? nextAiring(season.schedule, Date.now()) : null;
    const question = next ? season.nightly?.find((q) => q.episode === next.number) : undefined;
    if (!next || !question) return json({ error: 'no_question' }, 409);
    if (Date.now() >= next.startsAt - 60000) return json({ error: 'closed' }, 409);
    id = nightId(show, question.episode);
    size = question.options.length;
  } else {
    if (!show.poll) return json({ error: 'bad_request' }, 400);
    id = seasonPrefix(show);
    size = show.poll.options.length;
  }
  const option = Number(data?.option);
  if (!Number.isInteger(option) || option < 0 || option >= size) return json({ error: 'bad_request' }, 400);
  const visitor = await ensureVisitor(request, env, secret);
  await env.DB.prepare(
    `INSERT INTO poll_votes (visitor_id, poll, option, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (visitor_id, poll) DO UPDATE SET option = excluded.option, updated_at = excluded.updated_at`
  )
    .bind(visitor.id, id, option, Date.now())
    .run();
  const polls = await allPollResults(env, show);
  return json({ ok: true, option, poll: polls.poll, nights: polls.nights }, 200, visitor.cookie ? { 'set-cookie': visitor.cookie } : {});
}

async function handleMe(request: Request, url: URL, env: Env, secret: string) {
  const show = liveShow(url.searchParams.get('show'));
  if (!show) return json({ error: 'unknown_show' }, 404);
  const id = await readVisitor(request, secret);
  if (!id) return json({ picks: {}, poll: null, nights: {} });
  const picks = await env.DB.prepare(
    `SELECT couple, outcome, cota, MAX(episode) AS episode FROM predictions
     WHERE visitor_id = ? AND show = ? AND season = ? GROUP BY couple`
  )
    .bind(id, show.slug, show.season!.number)
    .all<{ couple: string; outcome: Outcome; cota: number; episode: number }>();
  const prefix = seasonPrefix(show);
  const votes = await env.DB.prepare('SELECT poll, option FROM poll_votes WHERE visitor_id = ? AND (poll = ? OR poll LIKE ?)')
    .bind(id, prefix, `${prefix}-e%`)
    .all<{ poll: string; option: number }>();
  let poll: number | null = null;
  const nights: Record<number, number> = {};
  for (const v of votes.results) {
    if (v.poll === prefix) poll = v.option;
    else nights[Number(v.poll.slice(prefix.length + 2))] = v.option;
  }
  const result: Record<string, { outcome: Outcome; cota: number; episode: number; points: number }> = {};
  for (const p of picks.results) {
    result[p.couple] = { outcome: p.outcome, cota: p.cota, episode: p.episode, points: Math.round(p.cota * 100) };
  }
  return json({ picks: result, poll, nights });
}

async function handleOutcome(request: Request, env: Env) {
  if (!env.ADMIN_TOKEN || request.headers.get('authorization') !== `Bearer ${env.ADMIN_TOKEN}`) {
    return json({ error: 'unauthorized' }, 401);
  }
  const data = await body(request);
  const show = liveShow(data?.show);
  const couple = show?.season!.couples.find((c) => c.slug === data?.couple);
  const outcome = data?.outcome as Outcome;
  if (!show || !couple || !OUTCOMES.includes(outcome)) return json({ error: 'bad_request' }, 400);
  await env.DB.prepare(
    `INSERT INTO outcomes (show, season, couple, outcome, recorded_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (show, season, couple) DO UPDATE SET outcome = excluded.outcome, recorded_at = excluded.recorded_at`
  )
    .bind(show.slug, show.season!.number, couple.slug, outcome, Date.now())
    .run();
  return json({ ok: true });
}

async function api(request: Request, env: Env) {
  const url = new URL(request.url);
  const route = `${request.method} ${url.pathname.replace(/\/$/, '')}`;
  if (route === 'GET /api/odds') return handleOdds(url, env);
  if (!env.COOKIE_SECRET) return json({ error: 'not_configured' }, 500);
  if (route === 'GET /api/me') return handleMe(request, url, env, env.COOKIE_SECRET);
  if (request.method === 'POST' && !sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  if (route === 'POST /api/predictions') return handlePrediction(request, env, env.COOKIE_SECRET);
  if (route === 'POST /api/poll') return handlePoll(request, env, env.COOKIE_SECRET);
  if (route === 'POST /api/admin/outcome') return handleOutcome(request, env);
  return json({ error: 'not_found' }, 404);
}

export default {
  async fetch(request: Request, env: Env) {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      try {
        return await api(request, env);
      } catch {
        return json({ error: 'server_error' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller: ScheduledController, env: Env) {
    for (const show of shows) {
      if (show.status === 'live' && show.season) await computeOdds(env, show);
    }
  },
} satisfies ExportedHandler<Env>;
