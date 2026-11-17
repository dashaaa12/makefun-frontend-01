// views/board.js — the bounty board: every bounty on make.fun, the ones
// still taking entries first (soonest deadline first), then the rest.
// Twenty cards at a time behind a "show more" control.

import { getAllCompetitions } from '../api.js';
import { count, esc, money, takesEntries, timeLeft } from '../format.js';

const PAGE = 20;

function card(comp, now) {
  const open = takesEntries(comp, now);
  const fee = comp.entryFeeUsd
    ? `<span class="chip chip-fee">entry fee ${money(comp.entryFeeUsd)}</span>`
    : '';
  const left = timeLeft(comp.deadline, now);
  return `
  <article class="card">
    <div class="card-top">
      <span class="chip ${open ? 'chip-open' : 'chip-closed'}">${
        open ? 'Open' : esc(comp.status ?? 'closed')
      }</span>
      ${comp.category ? `<span class="chip">${esc(comp.category)}</span>` : ''}
      ${fee}
    </div>
    <h2 class="card-title">
      <a href="#/bounty/${encodeURIComponent(comp.slug)}">${esc(comp.title)}</a>
    </h2>
    ${comp.summary ? `<p class="card-summary">${esc(comp.summary)}</p>` : ''}
    <dl class="card-stats">
      <div><dt>Live pot</dt><dd>${money(comp.potUsd ?? comp.rewardAmount)}</dd></div>
      <div><dt>Entries</dt><dd>${count(comp.submissionCount)}</dd></div>
      <div><dt>${open ? 'Deadline' : 'Deadline'}</dt><dd>${
        left ?? '—'
      }</dd></div>
    </dl>
    <p class="card-links">
      <a href="#/bounty/${encodeURIComponent(comp.slug)}">Bounty page</a> ·
      <a href="#/bounty/${encodeURIComponent(
        comp.slug,
      )}/leaderboard">Leaderboard</a>
    </p>
  </article>`;
}

export async function render(el) {
  let comps;
  try {
    comps = await getAllCompetitions();
  } catch {
    el.innerHTML =
      '<p class="status-line error">Could not load the bounty board from make.fun. Check your connection and reload.</p>';
    return;
  }

  const now = Date.now();
  const open = comps
    .filter((c) => takesEntries(c, now))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const rest = comps
    .filter((c) => !takesEntries(c, now))
    .sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
  const ordered = [...open, ...rest];

  let shown = 0;
  el.innerHTML = `
    <section class="board-head">
      <h1>The bounty board</h1>
      <p>${open.length} of ${ordered.length} bounties are still taking
      entries. Every reward is USDC on Solana, paid from escrow.</p>
    </section>
    <section id="board-grid" class="grid"></section>
    <p class="more-row"><button id="board-more" type="button"></button></p>`;

  const grid = el.querySelector('#board-grid');
  const more = el.querySelector('#board-more');
  const paint = () => {
    shown = Math.min(shown + PAGE, ordered.length);
    grid.innerHTML = ordered.slice(0, shown).map((c) => card(c, now)).join('');
    more.textContent =
      shown < ordered.length
        ? `Show more (${ordered.length - shown} left)`
        : '';
    more.hidden = shown >= ordered.length;
  };
  more.addEventListener('click', paint);
  paint();
}
