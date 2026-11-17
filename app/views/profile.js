// views/profile.js — a hunter's public profile: avatar, bio, their record
// across every bounty, and the entries they have handed in.

import { ApiError, avatarUrl, getJSON } from '../api.js';
import { count, dateLine, esc, money, rateText } from '../format.js';

function solutionRow(s) {
  const comp = s.competition ?? {};
  const col = s.score?.column ?? {};
  const isRate =
    (col.key ?? '').includes('judge') || /win rate/i.test(col.title ?? '');
  const shown =
    s.score?.value != null
      ? isRate
        ? rateText(s.score.value)
        : s.score.display
      : s.score?.display;
  const score = shown
    ? `${esc(col.title ?? 'Score')}: ${esc(shown)}`
    : '';
  const placed = s.placement
    ? `Placed #${esc(s.placement)}${s.prize_usd ? ` · won ${money(s.prize_usd)}` : ''}`
    : '';
  return `
  <li class="solution">
    <a class="solution-title" href="#/bounty/${encodeURIComponent(comp.slug ?? '')}">${esc(s.title ?? 'Untitled entry')}</a>
    <span class="solution-meta">
      in ${esc(comp.title ?? comp.slug ?? 'a bounty')}
      ${score ? ` · ${score}` : ''}
      ${placed ? ` · ${placed}` : ''}
      · entered ${dateLine(s.entered_at)}
    </span>
  </li>`;
}

function payoutRow(p) {
  const amount = p.amount_usd ?? p.amountUsd ?? p.amount ?? p.usd;
  const when = p.paid_at ?? p.created_at ?? p.at;
  const what = p.competition?.title ?? p.competition_slug ?? p.title ?? 'Prize';
  return `<li class="solution">
    <span class="solution-title">${money(amount)}</span>
    <span class="solution-meta">${esc(what)} · ${dateLine(when)}</span>
  </li>`;
}

export async function render(el, route) {
  const handle = route.handle;
  let p;
  try {
    p = await getJSON(`/profiles/${encodeURIComponent(handle)}`);
  } catch (err) {
    el.innerHTML =
      err instanceof ApiError && err.status === 404
        ? `<p class="status-line error">No hunter named “${esc(handle)}”. <a href="#/">Back to the board</a></p>`
        : '<p class="status-line error">Could not load this profile. <a href="#/">Back to the board</a></p>';
    return;
  }

  const rec = p.record ?? {};
  const avatar = avatarUrl(p);
  const name = p.display_name || p.handle;
  const badges = [
    p.house ? '<span class="chip">house</span>' : '',
    p.demo ? '<span class="chip">demo</span>' : '',
    p.github_login
      ? `<span class="chip">github: ${esc(p.github_login)}</span>`
      : '',
    p.x ? `<span class="chip">x: ${esc(p.x)}</span>` : '',
  ].join(' ');
  const solutions = (p.solutions ?? []).map(solutionRow).join('');
  const payouts = (p.payouts ?? []).map(payoutRow).join('');

  el.innerHTML = `
    <p class="crumbs"><a href="#/">← Board</a></p>
    <section class="profile-head">
      <span class="avatar-wrap">
        ${
          avatar
            ? `<img class="avatar" crossorigin="anonymous" src="${esc(avatar)}" alt="" width="96" height="96" />`
            : ''
        }
        <span class="avatar-fallback" aria-hidden="true">${esc(
          (name ?? '?').slice(0, 1).toUpperCase(),
        )}</span>
      </span>
      <div>
        <h1>${esc(name)}</h1>
        <p class="handle-line">@${esc(p.handle)} · joined ${dateLine(p.joined_at)}</p>
        ${badges ? `<p class="badge-row">${badges}</p>` : ''}
        ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
      </div>
    </section>

    <dl class="stat-grid">
      <div><dt>Entered</dt><dd>${count(rec.competitions_entered)}</dd></div>
      <div><dt>Placed</dt><dd>${count(rec.competitions_placed)}</dd></div>
      <div><dt>Won</dt><dd>${count(rec.competitions_won)}</dd></div>
      <div><dt>Podiums</dt><dd>${count(rec.podium_finishes)}</dd></div>
      <div><dt>Best placement</dt><dd>${rec.best_placement ? `#${esc(rec.best_placement)}` : '—'}</dd></div>
      <div><dt>Prizes won</dt><dd>${money(rec.prize_usd)}</dd></div>
    </dl>

    <h2>Entries</h2>
    ${
      solutions
        ? `<ul class="solutions">${solutions}</ul>`
        : '<p class="status-line">No entries yet.</p>'
    }
    ${
      payouts
        ? `<h2>Payouts</h2><ul class="solutions">${payouts}</ul>`
        : ''
    }`;

  const img = el.querySelector('.avatar');
  if (img) {
    img.addEventListener('error', () => img.remove());
    if (img.complete && img.naturalWidth > 0) img.classList.add('ok');
    else img.addEventListener('load', () => img.classList.add('ok'));
  }
}
