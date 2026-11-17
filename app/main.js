// main.js — the router. It is all the first load runs besides the API and
// format helpers: each view is a separate module, fetched lazily with a
// dynamic import() the first time its route is visited.

const viewEl = document.getElementById('view');

function parseRoute(hash) {
  const path = (hash.replace(/^#/, '') || '/').split('/').filter(Boolean);
  if (path.length === 0) return { name: 'board' };
  if (path[0] === 'bounty' && path[1] && path[2] === 'leaderboard') {
    return { name: 'leaderboard', slug: decodeURIComponent(path[1]) };
  }
  if (path[0] === 'bounty' && path[1]) {
    return { name: 'bounty', slug: decodeURIComponent(path[1]) };
  }
  if (path[0] === 'profile' && path[1]) {
    return { name: 'profile', handle: decodeURIComponent(path[1]) };
  }
  return { name: 'board' };
}

const loaders = {
  board: () => import('./views/board.js'),
  bounty: () => import('./views/bounty.js'),
  leaderboard: () => import('./views/leaderboard.js'),
  profile: () => import('./views/profile.js'),
};

let navigation = 0;

async function render() {
  const mine = ++navigation;
  const route = parseRoute(location.hash);
  window.__shotReady = false;
  viewEl.innerHTML = '<p class="status-line">Loading…</p>';
  try {
    const view = await loaders[route.name]();
    if (mine !== navigation) return; // a newer navigation already took over
    await view.render(viewEl, route);
  } catch (err) {
    if (mine !== navigation) return;
    viewEl.innerHTML =
      '<p class="status-line error">Something went wrong loading this page. ' +
      '<a href="#/">Back to the board</a></p>';
    console.error(err);
  }
  if (mine === navigation) window.__shotReady = true;
}

window.addEventListener('hashchange', render);

document.getElementById('profile-jump').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const handle = new FormData(ev.currentTarget)
    .get('handle')
    .toString()
    .trim()
    .replace(/^@/, '');
  if (handle) location.hash = `#/profile/${encodeURIComponent(handle)}`;
});

render();
