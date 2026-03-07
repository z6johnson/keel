import type { Beat, ContentSource, Signal } from './types';
import { renderMarkdown } from './markdown';

export async function loadManifest(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
  return res.json();
}

export async function loadBeatContent(beat: Beat): Promise<string> {
  // Inline content
  if (beat.content) {
    return beat.role === 'breath' ? beat.content : renderMarkdown(beat.content);
  }

  // No source = empty (breath beats)
  if (!beat.source) return '';

  try {
    return await loadFromSource(beat.source, beat.role);
  } catch {
    // Try fallback
    if (beat.fallback) {
      try {
        return await loadFromSource(beat.fallback, beat.role);
      } catch {
        return '';
      }
    }
    return '';
  }
}

async function loadFromSource(source: ContentSource, _role: string): Promise<string> {
  if (source.type === 'inline') {
    return renderMarkdown(source.text ?? '');
  }

  if (source.type === 'file') {
    return loadFileContent(source.path ?? '');
  }

  if (source.type === 'api') {
    return loadApiContent(source.url ?? '', source.transform);
  }

  if (source.type === 'notion') {
    return loadNotionContent(source.pageId ?? '');
  }

  return '';
}

async function loadFileContent(path: string): Promise<string> {
  const res = await fetch(`/content/${path}`);
  if (!res.ok) throw new Error(`Failed to load file: ${res.status}`);
  const text = await res.text();
  return renderMarkdown(text);
}

async function loadApiContent(url: string, transform?: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const headers: HeadersInit = {};
    const apiKey = getApiKey();
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    if (transform === 'fogbell') {
      return renderSignals(normalizeFogBellData(data));
    }

    return renderMarkdown(JSON.stringify(data));
  } finally {
    clearTimeout(timeout);
  }
}

async function loadNotionContent(pageId: string): Promise<string> {
  const res = await fetch(`/api/notion?beat=${encodeURIComponent(pageId)}`);
  if (!res.ok) throw new Error(`Notion beat error: ${res.status}`);
  const text = await res.text();
  return renderMarkdown(text);
}

function getApiKey(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  return params.get('fogbell_key') ?? (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_FOGBELL_KEY ?? undefined;
}

function normalizeFogBellData(data: unknown): Signal[] {
  const arr: unknown[] = Array.isArray(data)
    ? data
    : (data as Record<string, unknown>).signals as unknown[]
      ?? (data as Record<string, unknown>).data as unknown[]
      ?? [];

  return arr.slice(0, 5).map((item: unknown) => {
    const s = item as Record<string, unknown>;
    return {
      title: String(s.title ?? ''),
      summary: String(s.summary ?? s.description ?? ''),
      source: String(s.source ?? ''),
      level: String(s.level ?? ''),
      date: String(s.date ?? s.timestamp ?? ''),
      url: s.url ? String(s.url) : undefined,
    };
  });
}

function renderSignals(signals: Signal[]): string {
  if (signals.length === 0) {
    return '<p class="signal-empty">No signals available.</p>';
  }

  return `<div class="signal-grid">${signals.map(s => `
    <article class="signal-card">
      ${s.title ? `<h3 class="signal-card__title">${escapeHtml(s.title)}</h3>` : ''}
      ${s.summary ? `<p class="signal-card__summary">${escapeHtml(s.summary)}</p>` : ''}
      <div class="signal-card__meta">
        ${s.source ? `<span class="signal-card__source">${escapeHtml(s.source)}</span>` : ''}
        ${s.date ? `<time class="signal-card__time">${escapeHtml(s.date)}</time>` : ''}
      </div>
    </article>`).join('')}
  </div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function preloadBeats(
  beats: Beat[],
  startIndex: number,
  cache: Map<string, string>,
  count = 3
): Promise<void> {
  const targets = [];
  for (let i = startIndex; i < Math.min(startIndex + count, beats.length); i++) {
    if (!cache.has(beats[i].id)) {
      targets.push(i);
    }
  }

  await Promise.allSettled(
    targets.map(async (i) => {
      const content = await loadBeatContent(beats[i]);
      cache.set(beats[i].id, content);
    })
  );
}
