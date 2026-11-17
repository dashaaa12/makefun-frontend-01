// views/leaderboard.js — a bounty's leaderboard: rank, entrant (linked to
// their profile) and the score columns the API itself defines, twenty
// rows at a time behind a "show more" control.

import { ApiError, getJSON } from '../api.js';
import { count, esc, rateText } from '../format.js';

const PAGE = 20;

function cell(entry, col) {
  const raw = entry.values?.[col.key];
  if (raw == null) return '—';
  if (col.key.startsWith('judge')) return rateText(raw);
  if (col.key === 'bytes') return count(raw);
  const shown = entry.display?.[col.key];
  return shown != null ? esc(shown) : esc(raw);
}

export async function render(el, route) {
  const slug = route.slug;
  let data;
  try {
    data = await getJSON(`/competitions/${encodeURIComponent(slug)}/leaderboard`);
  } catch (err) {
    el.innerHTML =
      err instanceof ApiError && err.status === 404
        ? `<p class="status-line error">No bounty named “${esc(slug)}”. <a href="#/">Back to the board</a></p>`
        : '<p class="status-line error">Could not load this leaderboard. <a href="#/">Back to the board</a></p>';
    return;
  }

  const entries = data.entries ?? [];
  const cols = (data.columns ?? []).filter((c) => !c.hidden);
  const title = data.competition?.title ?? slug;
  const phase = data.phase?.title ?? '';

  el.innerHTML = `
    <p class="crumbs"><a href="#/bounty/${encodeURIComponent(slug)}">← ${esc(title)}</a></p>
    <h1>${esc(title)} — leaderboard</h1>
    <p class="lede">${esc(data.title ?? 'Results')}${phase ? ` · ${esc(phase)} phase` : ''} · ${count(entries.length)} entries</p>
    <div id="lb-slot"></div>
    <p class="more-row"><button id="lb-more" type="button"></button></p>`;

  const slot = el.querySelector('#lb-slot');
  const more = el.querySelector('#lb-more');

  if (entries.length === 0) {
    slot.innerHTML = '<p class="status-line">No entries yet — the board fills as hunters submit.</p>';
    more.hidden = true;
    return;
  }

  const head = cols.map((c) => `<th>${esc(c.title)}</th>`).join('');
  let shown = 0;
  const paint = () => {
    shown = Math.min(shown + PAGE, entries.length);
    const rows = entries.slice(0, shown).map((e) => {
      const cells = cols.map((c) => `<td>${cell(e, c)}</td>`).join('');
      const flag = e.house ? ' <span class="chip">house</span>' : '';
      return `<tr>
        <td class="rank">${esc(e.rank ?? '—')}</td>
        <td>
          <a href="#/profile/${encodeURIComponent(e.handle)}">@${esc(e.handle)}</a>${flag}
          ${e.title ? `<span class="entry-title">${esc(e.title)}</span>` : ''}
        </td>
        ${cells}
      </tr>`;
    });
    slot.innerHTML = `
      <div class="table-wrap">
        <table class="data-table lb-table">
          <thead><tr><th>#</th><th>Entrant</th>${head}</tr></thead>
          <tbody>${rows.join('')}</tbody>
        </table>
      </div>`;
    more.textContent =
      shown < entries.length ? `Show more (${entries.length - shown} left)` : '';
    more.hidden = shown >= entries.length;
  };
  more.addEventListener('click', paint);
  paint();
}
