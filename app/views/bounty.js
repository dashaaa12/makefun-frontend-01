// views/bounty.js — one bounty's page: what it asks for, what it pays
// (the live rewards table, fee shares included), its dates and status,
// and the way to its leaderboard.

import { ApiError, getJSON } from '../api.js';
import {
  count,
  dateLine,
  esc,
  markdown,
  money,
  takesEntries,
  timeLeft,
} from '../format.js';

function rewardsTable(comp) {
  const rows = (comp.rewardsNow ?? []).map(
    (r) => `<tr>
      <td>${esc(r.place)}</td>
      <td>${money(r.baseUsd)}</td>
      <td>${money(r.feeShareUsd)}</td>
      <td><strong>${money(r.amountUsd)}</strong></td>
    </tr>`,
  );
  if (rows.length === 0) return '';
  return `
    <h2>Rewards — live pot ${money(comp.potUsd)}</h2>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Place</th><th>Base</th><th>Fee share</th><th>Pays now</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>`;
}

export async function render(el, route) {
  const slug = route.slug;
  let comp;
  try {
    comp = await getJSON(`/competitions/${encodeURIComponent(slug)}`);
  } catch (err) {
    el.innerHTML =
      err instanceof ApiError && err.status === 404
        ? `<p class="status-line error">No bounty named “${esc(slug)}”. <a href="#/">Back to the board</a></p>`
        : '<p class="status-line error">Could not load this bounty. <a href="#/">Back to the board</a></p>';
    return;
  }

  const now = Date.now();
  const open = takesEntries(comp, now);
  const feeLine = comp.entryFeeUsd
    ? `${money(comp.entryFeeUsd)} entry fee · ${count(comp.entryFeePayers)} paid · ${money(comp.entryFeesUsd)} collected`
    : 'No entry fee';
  const skills = (comp.skills ?? [])
    .map((s) => `<span class="chip">${esc(s)}</span>`)
    .join(' ');

  el.innerHTML = `
    <p class="crumbs"><a href="#/">← Board</a></p>
    <article class="bounty">
      <div class="card-top">
        <span class="chip ${open ? 'chip-open' : 'chip-closed'}">${
          open ? 'Open for entries' : esc(comp.status ?? 'closed')
        }</span>
        ${comp.category ? `<span class="chip">${esc(comp.category)}</span>` : ''}
        ${skills}
      </div>
      <h1>${esc(comp.title)}</h1>
      ${comp.summary ? `<p class="lede">${esc(comp.summary)}</p>` : ''}
      <p class="sponsor-line">Sponsored by ${esc(comp.sponsor?.name ?? 'make.fun')}</p>

      <dl class="stat-grid">
        <div><dt>Live pot</dt><dd>${money(comp.potUsd ?? comp.rewardAmount)}</dd></div>
        <div><dt>Base reward</dt><dd>${money(comp.rewardAmount)}</dd></div>
        <div><dt>Entries</dt><dd>${count(comp.submissionCount)}</dd></div>
        <div><dt>Entry fee</dt><dd>${feeLine}</dd></div>
        <div><dt>Opened</dt><dd>${dateLine(comp.opensAt ?? comp.publishedAt)}</dd></div>
        <div><dt>Deadline</dt><dd>${dateLine(comp.deadline)} · ${esc(timeLeft(comp.deadline, now) ?? '')}</dd></div>
      </dl>

      <p class="cta-row">
        <a class="cta" href="#/bounty/${encodeURIComponent(slug)}/leaderboard">See the leaderboard →</a>
      </p>

      ${rewardsTable(comp)}

      ${comp.description ? `<h2>About this bounty</h2><div class="prose">${markdown(comp.description)}</div>` : ''}
      ${comp.rules ? `<h2>Rules</h2><div class="prose">${markdown(comp.rules)}</div>` : ''}
    </article>`;
}
