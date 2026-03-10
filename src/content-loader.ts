import type { Beat, Signal } from './types';
import { renderMarkdown } from './markdown';

export async function loadManifest(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
  return res.json();
}

export async function loadBeatContent(beat: Beat): Promise<string> {
  // Breath beats — no content
  if (beat.role === 'breath') return '';

  // Signal beats — fetch live data from FogBell API
  if (beat.role === 'signal') {
    return loadSignals();
  }

  // All other beats — content is pre-loaded in the manifest
  if (beat.content) {
    return renderMarkdown(beat.content);
  }

  return '';
}

// ---------- signals ----------

let fogbellUrl = '';

export function setFogbellUrl(url: string) {
  fogbellUrl = url;
}

async function loadSignals(): Promise<string> {
  if (!fogbellUrl) {
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

    const res = await fetch(fogbellUrl, { headers, signal: controller.signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return renderSignalCards(normalizeFogBellData(data));
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
