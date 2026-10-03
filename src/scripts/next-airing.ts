import { nextAiring, describe, countdown, countdownParts } from '../lib/schedule';
import type { Schedule } from '../data/types';

const roots: { el: HTMLElement; schedule: Schedule }[] = [];
document.querySelectorAll<HTMLElement>('[data-schedule]').forEach((el) => {
  try {
    roots.push({ el, schedule: JSON.parse(el.dataset.schedule ?? '') });
  } catch {}
});

function render() {
  const now = Date.now();
  for (const { el, schedule } of roots) {
    const next = nextAiring(schedule, now);
    el.hidden = !next;
    if (!next) continue;
    const text: Record<string, string> = { ...describe(next), countdown: countdown(next.startsAt - now) };
    el.querySelectorAll<HTMLElement>('[data-next]').forEach((target) => {
      const value = text[target.dataset.next ?? ''];
      if (value !== undefined && target.textContent !== value) target.textContent = value;
    });
    const flip = el.querySelector<HTMLElement>('[data-flip]');
    if (flip) {
      const parts = countdownParts(next.startsAt - now);
      const showDays = parts.d > 0;
      flip.querySelectorAll<HTMLElement>('[data-unit]').forEach((group) => {
        const unit = group.dataset.unit as 'd' | 'h' | 'm' | 's';
        group.hidden = unit === 'd' ? !showDays : unit === 's' ? showDays : false;
        const digits = String(parts[unit]).padStart(2, '0');
        group.querySelectorAll<HTMLElement>('.flip-card').forEach((card, k) => {
          if (card.textContent === digits[k]) return;
          card.textContent = digits[k];
          card.classList.remove('tick');
          void card.offsetWidth;
          card.classList.add('tick');
        });
      });
    }
  }
}

if (roots.length > 0) {
  render();
  setInterval(render, 1000);
}
