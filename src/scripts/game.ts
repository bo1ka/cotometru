import { backendOn, api } from './backend';
import { nextAiring } from '../lib/schedule';
import type { Schedule } from '../data/types';

type Outcome = 't' | 's' | 'i';
type Odds = { t: number; s: number; i: number; votes: number };
type Tally = { total: number; counts: number[] };

interface OddsResponse {
  couples: Record<string, Odds>;
  totalVotes: number;
  poll: Tally | null;
  nights: Record<string, Tally>;
}

interface MeResponse {
  picks: Record<string, { outcome: Outcome; points: number; episode: number }>;
  poll: number | null;
  nights: Record<string, number>;
}

interface PickResponse {
  points: number;
  episode: number;
}

interface PollResponse {
  poll: Tally | null;
  nights: Record<string, Tally>;
}

const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

const pickers = Array.from(document.querySelectorAll<HTMLElement>('[data-picker]'));
const polls = Array.from(document.querySelectorAll<HTMLElement>('[data-poll]'));

function mark(root: HTMLElement, value: string | null) {
  root.querySelectorAll<HTMLButtonElement>('[data-option]').forEach((button) => {
    const on = button.dataset.option === value;
    button.classList.toggle('selected', on);
    button.setAttribute('aria-pressed', String(on));
  });
}

function selected(root: HTMLElement) {
  return root.querySelector<HTMLButtonElement>('[data-option].selected')?.dataset.option ?? null;
}

function note(root: HTMLElement, text: string) {
  const target = root.querySelector<HTMLElement>('[data-note]');
  if (target) target.textContent = text;
}

function showGain(picker: HTMLElement, points: number | string | undefined) {
  const box = picker.querySelector<HTMLElement>('[data-gain-box]');
  const value = picker.querySelector<HTMLElement>('[data-gain-value]');
  if (!box || !value || points === undefined) return;
  value.textContent = String(points);
  box.hidden = false;
}

function gainOf(picker: HTMLElement, option: string | null) {
  return picker.querySelector<HTMLButtonElement>(`[data-option="${option}"]`)?.dataset.gain;
}

function showPoll(poll: HTMLElement, results: Tally | null | undefined) {
  if (!results || results.total === 0) return;
  poll.querySelectorAll<HTMLButtonElement>('[data-option]').forEach((button) => {
    const share = Math.round(((results.counts[Number(button.dataset.option)] ?? 0) / results.total) * 100);
    button.style.setProperty('--share', `${share}%`);
    const target = button.querySelector<HTMLElement>('[data-share]');
    if (target) target.textContent = `${share}%`;
  });
  const count = results.total === 1 ? 'Un vot' : `${results.total} voturi`;
  note(poll, poll.dataset.closed === 'true' ? `Votul s-a închis. ${count} în total.` : `${count} până acum.`);
}

function resultsFor(poll: HTMLElement, data: { poll: Tally | null; nights: Record<string, Tally> }) {
  return poll.dataset.kind === 'night' ? data.nights?.[poll.dataset.episode ?? ''] : data.poll;
}

function canSee(poll: HTMLElement) {
  return poll.dataset.kind === 'season' || poll.dataset.closed === 'true' || selected(poll) !== null;
}

function pickNightPolls() {
  document.querySelectorAll<HTMLElement>('[data-night-polls]').forEach((group) => {
    let schedule: Schedule;
    try {
      schedule = JSON.parse(group.dataset.nightSchedule ?? '');
    } catch {
      return;
    }
    const now = Date.now();
    const next = nextAiring(schedule, now);
    const cards = Array.from(group.querySelectorAll<HTMLElement>('[data-poll]'));
    const open = next && now < next.startsAt - 60000 ? cards.find((c) => Number(c.dataset.episode) === next.number) : undefined;
    const limit = next ? next.number : Infinity;
    const past = cards
      .filter((c) => c !== open && Number(c.dataset.episode) <= limit)
      .sort((a, b) => Number(b.dataset.episode) - Number(a.dataset.episode))[0];
    const shown = open ?? past;
    cards.forEach((card) => {
      const closed = card !== open;
      card.hidden = card !== shown;
      card.dataset.closed = String(closed);
      card.querySelectorAll<HTMLButtonElement>('[data-option]').forEach((button) => (button.disabled = closed));
      if (closed && card === shown && selected(card) === null) note(card, 'Votul pentru această întrebare s-a închis.');
    });
  });
}

function applyOdds(show: string, odds: OddsResponse) {
  document.querySelectorAll<HTMLElement>(`[data-board="${show}"]`).forEach((board) => {
    const rows = Array.from(board.querySelectorAll<HTMLElement>('[data-board-row]'));
    rows.forEach((row) => {
      const value = odds.couples[row.dataset.couple ?? ''];
      if (!value) return;
      row.dataset.t = String(value.t);
      const set = (name: string, text: string) => {
        const target = row.querySelector<HTMLElement>(`[data-cell="${name}"]`);
        if (target) target.textContent = text;
      };
      set('pct', `${Math.round(value.t)}%`);
      set('cota', (100 / Math.max(value.t, 1)).toFixed(2).replace('.', ','));
      const segment = (name: Outcome, label: string) => {
        const target = row.querySelector<HTMLElement>(`[data-bar="${name}"]`);
        if (!target) return;
        const p = value[name];
        const tip = `${label} ${Math.round(p)}% · cotă ${(100 / Math.max(p, 1)).toFixed(2).replace('.', ',')}`;
        target.style.width = `${p}%`;
        target.dataset.tip = tip;
        target.setAttribute('aria-label', tip);
      };
      segment('t', 'Împreună');
      segment('s', 'Separat');
      segment('i', 'Cu o ispită');
    });
    rows
      .sort((a, b) => Number(b.dataset.t ?? 0) - Number(a.dataset.t ?? 0))
      .forEach((row, k) => {
        row.parentElement?.appendChild(row);
        const rank = row.querySelector<HTMLElement>('[data-cell="rank"]');
        if (rank) rank.textContent = String(k + 1);
      });
    const total = board.querySelector<HTMLElement>('[data-votes-total]');
    if (total && odds.totalVotes > 0) {
      total.textContent = odds.totalVotes === 1 ? 'O predicție a comunității.' : `${odds.totalVotes} predicții ale comunității.`;
      total.hidden = false;
    }
  });
  document.querySelectorAll<HTMLElement>(`[data-live-pct][data-show="${show}"]`).forEach((target) => {
    const value = odds.couples[target.dataset.couple ?? ''];
    if (value) target.textContent = `${Math.round(value.t)}%`;
  });
  pickers
    .filter((picker) => picker.dataset.show === show)
    .forEach((picker) => {
      const value = odds.couples[picker.dataset.couple ?? ''];
      if (!value) return;
      picker.querySelectorAll<HTMLButtonElement>('[data-option]').forEach((button) => {
        const p = Math.max(value[button.dataset.option as Outcome] ?? 1, 1);
        button.dataset.gain = String(Math.round(10000 / p));
        const cota = button.querySelector<HTMLElement>('[data-cota]');
        if (cota) cota.textContent = (100 / p).toFixed(2).replace('.', ',');
      });
    });
  polls.filter((poll) => poll.dataset.show === show && canSee(poll)).forEach((poll) => showPoll(poll, resultsFor(poll, odds)));
  const expected = (Object.values(odds.couples).reduce((sum, o) => sum + o.t, 0) / 100).toFixed(1).replace('.', ',');
  document.querySelectorAll<HTMLElement>(`[data-expected="${show}"]`).forEach((target) => {
    target.textContent = `Predicțiile indică în jur de ${expected} cupluri împreună.`;
  });
}

function applyMe(show: string, me: MeResponse) {
  pickers
    .filter((picker) => picker.dataset.show === show)
    .forEach((picker) => {
      const pick = me.picks[picker.dataset.couple ?? ''];
      if (!pick) return;
      mark(picker, pick.outcome);
      showGain(picker, pick.points);
      note(picker, `Predicție salvată la ediția ${pick.episode}. O poți schimba până la închidere.`);
    });
  polls
    .filter((poll) => poll.dataset.show === show)
    .forEach((poll) => {
      const mine = poll.dataset.kind === 'night' ? me.nights?.[poll.dataset.episode ?? ''] : me.poll;
      if (mine !== null && mine !== undefined) mark(poll, String(mine));
    });
}

async function refresh(show: string) {
  const [me, odds] = await Promise.all([api<MeResponse>(`/me?show=${show}`), api<OddsResponse>(`/odds?show=${show}`)]);
  if (me.ok && me.data) applyMe(show, me.data);
  if (odds.ok && odds.data) applyOdds(show, odds.data);
}

pickers.forEach((picker) => {
  const key = `pick:${picker.dataset.picker}`;
  const saved = store.get(key);
  if (saved !== null) {
    mark(picker, saved);
    showGain(picker, gainOf(picker, saved));
  }
  picker.querySelectorAll<HTMLButtonElement>('[data-option]').forEach((button) =>
    button.addEventListener('click', async () => {
      const option = button.dataset.option ?? null;
      if (option === null) return;
      const before = selected(picker);
      mark(picker, option);
      showGain(picker, gainOf(picker, option));
      if (!backendOn) {
        store.set(key, option);
        return;
      }
      const result = await api<PickResponse>('/predictions', {
        method: 'POST',
        body: JSON.stringify({ show: picker.dataset.show, couple: picker.dataset.couple, outcome: option }),
      });
      if (result.ok && result.data) {
        store.set(key, option);
        showGain(picker, result.data.points);
        note(picker, `Predicție salvată pentru ediția ${result.data.episode}. O poți schimba până la închidere.`);
        if (picker.dataset.show) refresh(picker.dataset.show);
      } else {
        mark(picker, before);
        note(
          picker,
          result.status === 409
            ? 'Predicțiile sunt închise acum. Revino după ediție.'
            : 'Predicția nu a putut fi salvată. Încearcă din nou.'
        );
      }
    })
  );
});

pickNightPolls();
setInterval(pickNightPolls, 30000);

polls.forEach((poll) => {
  const key = `poll:${poll.dataset.poll}`;
  const saved = store.get(key);
  if (saved !== null) {
    mark(poll, saved);
    if (!backendOn) note(poll, 'Răspunsul tău a fost salvat pe acest dispozitiv.');
  }
  poll.querySelectorAll<HTMLButtonElement>('[data-option]').forEach((button) =>
    button.addEventListener('click', async () => {
      const option = button.dataset.option ?? null;
      if (option === null) return;
      const before = selected(poll);
      mark(poll, option);
      if (!backendOn) {
        store.set(key, option);
        note(poll, 'Răspunsul tău a fost salvat pe acest dispozitiv.');
        return;
      }
      const result = await api<PollResponse>('/poll', {
        method: 'POST',
        body: JSON.stringify({ show: poll.dataset.show, kind: poll.dataset.kind, option: Number(option) }),
      });
      if (result.ok && result.data) {
        store.set(key, option);
        showPoll(poll, resultsFor(poll, result.data));
      } else {
        mark(poll, before);
        note(poll, result.status === 409 ? 'Votul pentru această întrebare s-a închis.' : 'Votul nu a putut fi salvat. Încearcă din nou.');
      }
    })
  );
});

if (backendOn) {
  const showSlugs = new Set<string>();
  document.querySelectorAll<HTMLElement>('[data-show]').forEach((el) => el.dataset.show && showSlugs.add(el.dataset.show));
  document.querySelectorAll<HTMLElement>('[data-board]').forEach((el) => el.dataset.board && showSlugs.add(el.dataset.board));
  showSlugs.forEach((show) => {
    refresh(show);
    setInterval(() => refresh(show), 45000);
  });
}
