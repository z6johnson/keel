import type { Slide, Signal } from './types';
import { renderMarkdown } from './markdown';

export async function loadManifest(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
  return res.json();
}

export async function loadSlideContent(slide: Slide): Promise<string> {
  if (slide.role === 'breath') return '';

  if (slide.role === 'signal') {
    const src = slide.content?.trim() ?? '';
    const url = isUrl(src) ? src : fogbellUrl;
    return loadSignals(url);
  }

  if (slide.content) {
    return renderMarkdown(slide.content);
  }

  return '';
}

// ---------- signals ----------

let fogbellUrl = '';

export function setFogbellUrl(url: string) {
  fogbellUrl = url;
}

function isUrl(text: string): boolean {
  return /^https?:\/\/\S+$/.test(text);
}

async function loadSignals(url: string): Promise<string> {
  if (!url) {
    return '<p class="signal-empty">No signals source configured.</p>';
  }

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
    return renderSignalCards(normalizeSignalData(data));
  } catch {
    return '<p class="signal-empty">Signal data is temporarily unavailable.</p>';
  } finally {
    clearTimeout(timeout);
  }
}

function getApiKey(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  return params.get('fogbell_key') ?? (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_FOGBELL_KEY ?? undefined;
}

function normalizeSignalData(data: unknown): Signal[] {
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

function renderSignalCards(signals: Signal[]): string {
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

export async function preloadSlides(
  slides: Slide[],
  startIndex: number,
  cache: Map<string, string>,
  count = 3
): Promise<void> {
  const targets = [];
  for (let i = startIndex; i < Math.min(startIndex + count, slides.length); i++) {
    if (!cache.has(slides[i].id)) {
      targets.push(i);
    }
  }

  await Promise.allSettled(
    targets.map(async (i) => {
      const content = await loadSlideContent(slides[i]);
      cache.set(slides[i].id, content);
    })
  );
}
