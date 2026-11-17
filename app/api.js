// api.js — the only place the app talks to make.fun.
//
// Every answer is cached in memory by URL. A repeat visit revalidates with
// the stored ETag (the API's ETags are minute-bound, so a revalidation a
// minute later usually answers 304 and costs no body at all). Only GET
// requests, only to the public API.

const API_BASE = 'https://make.fun/api';

const cache = new Map(); // url -> { etag: string | null, data: unknown }

export class ApiError extends Error {
  constructor(status, path) {
    super(
      status === 404
        ? `Nothing at ${path} (404).`
        : `make.fun API answered ${status} for ${path}.`,
    );
    this.status = status;
    this.path = path;
  }
}

export async function getJSON(path) {
  const url = API_BASE + path;
  const hit = cache.get(url);
  const headers = {};
  if (hit && hit.etag) headers['If-None-Match'] = hit.etag;

  let res;
  try {
    res = await fetch(url, { headers });
  } catch {
    if (hit) return hit.data; // offline with a warm cache beats an error
    throw new ApiError(0, path);
  }

  if (res.status === 304 && hit) return hit.data;
  if (!res.ok) throw new ApiError(res.status, path);

  const data = await res.json();
  cache.set(url, { etag: res.headers.get('ETag'), data });
  return data;
}

// The competitions list is cursor-paginated; walk it until the cursor runs
// out (a handful of pages at most) so the board can sort the whole field.
export async function getAllCompetitions() {
  const items = [];
  let cursor = null;
  for (let page = 0; page < 8; page += 1) {
    const qs = new URLSearchParams({ limit: '100' });
    if (cursor) qs.set('cursor', cursor);
    const data = await getJSON(`/competitions?${qs}`);
    items.push(...(data.items ?? []));
    cursor = data.next_cursor ?? null;
    if (!cursor) break;
  }
  return items;
}

export function avatarUrl(profile) {
  const raw = profile?.image ?? profile?.avatar ?? null;
  if (!raw) return null;
  if (/^https?:\/\//.test(raw)) return raw;
  return new URL(raw, 'https://make.fun').href;
}
