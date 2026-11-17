# makefun-frontend-01

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/dashaaa12/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/dashaaa12/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, tiny frontend for make.fun, built from static files and vanilla JS
ES modules — no framework, no build step. It reads only the public make.fun
API (GET requests), caches answers in memory and revalidates them with
ETags, loads each view lazily per route, and paginates long lists twenty
rows at a time. Four surfaces, each with its own hash route:

- `#/` — the bounty board: every live bounty with its title, live pot,
  entry fee where one is set, entries count and time left; bounties still
  taking entries (judged by deadline) come first, soonest deadline first.
- `#/bounty/<slug>` — a bounty's page: summary, description and rules, the
  rewards table with the live pot, its dates and status, and a link to its
  leaderboard.
- `#/bounty/<slug>/leaderboard` — the leaderboard: rank, entrant (linked
  to their profile) and the score columns the API defines.
- `#/profile/<handle>` — a hunter's public profile: avatar, bio, their
  record across all bounties, and every entry they have handed in.

## Run it

Serve the `app/` folder with any static file server, then open it in a
browser:

```sh
cd app
python3 -m http.server 8080
# open http://localhost:8080
```

To hand the entry in (copies `app/` and `screenshots/` to the output
directory and writes `dossier.json` there):

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=y1enas6g&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
