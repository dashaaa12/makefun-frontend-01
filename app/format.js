// format.js — small pure helpers: money, dates, countdowns, escaping and a
// deliberately small Markdown renderer for bounty descriptions and rules.

export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function money(value) {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function count(value) {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US');
}

export function dateLine(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function timeLeft(iso, now = Date.now()) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (Number.isNaN(ms)) return null;
  const abs = Math.abs(ms);
  const mins = Math.round(abs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  let text;
  if (days >= 2) text = `${days} days`;
  else if (days === 1) text = '1 day';
  else if (hours >= 2) text = `${hours} hours`;
  else if (hours === 1) text = '1 hour';
  else if (mins >= 2) text = `${mins} min`;
  else text = 'under a minute';
  return ms >= 0 ? `${text} left` : `closed ${text} ago`;
}

// A bounty still takes entries while it is open AND its deadline is ahead;
// the status flag alone lags the clock, so the board judges by deadline.
export function takesEntries(comp, now = Date.now()) {
  if (!comp || comp.status !== 'open') return false;
  if (comp.acceptingSubmissions === false) return false;
  const dl = comp.deadline ? new Date(comp.deadline).getTime() : NaN;
  return Number.isNaN(dl) || dl > now;
}

// Judge scores arrive as win-rate micro units (944244 means 0.944244).
export function rateText(micro) {
  const n = typeof micro === 'string' ? Number(micro) : micro;
  if (n == null || Number.isNaN(n)) return '—';
  if (n > 1000 && n <= 1000000) return `${(n / 10000).toFixed(1)}%`;
  return count(n);
}

function inlineMd(text) {
  // `text` is already HTML-escaped; add the inline marks on top of it.
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" rel="noopener" target="_blank">$1</a>',
    );
}

// Markdown-lite: headings, paragraphs, bullet/numbered lists, fenced code,
// horizontal rules. Input is escaped first, so API text can never inject
// markup; only the renderer's own tags appear in the output.
export function markdown(md) {
  if (!md) return '';
  const lines = String(md).split('\n');
  const out = [];
  let list = null; // 'ul' | 'ol' | null
  let code = null; // string[] while inside a fence
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (code) {
      if (line.trimStart().startsWith('```')) {
        out.push(`<pre><code>${code.join('\n')}</code></pre>`);
        code = null;
      } else code.push(esc(line));
      continue;
    }
    if (line.trimStart().startsWith('```')) {
      closeList();
      code = [];
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 1, 4);
      out.push(`<h${level}>${inlineMd(esc(heading[2]))}</h${level}>`);
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      closeList();
      out.push('<hr />');
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol';
      if (list !== kind) {
        closeList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inlineMd(esc((bullet ?? numbered)[1]))}</li>`);
      continue;
    }
    closeList();
    if (line.trim() === '') continue;
    out.push(`<p>${inlineMd(esc(line))}</p>`);
  }
  closeList();
  if (code) out.push(`<pre><code>${code.join('\n')}</code></pre>`);
  return out.join('\n');
}
