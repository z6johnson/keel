import type { Manifest } from './types';
import { loadManifest, preloadBeats } from './content-loader';
import { buildFlatBeats, createEngine } from './engine';
import { showModuleSelector } from './module-selector';
import { createRenderer } from './renderer';

async function boot() {
  const keel = document.getElementById('keel')!;
  const progressEl = document.getElementById('progress-counter')!;
  const progressFooter = document.getElementById('progress')!;

  // Restore color mode
  const savedMode = sessionStorage.getItem('keel-color-mode') as 'light' | 'dark' | null;
  const initialMode = savedMode ?? 'dark';
  document.documentElement.setAttribute('data-mode', initialMode);

  // Load manifest — check for ?notion=<slug> query param
  const params = new URLSearchParams(window.location.search);
  const notionSlug = params.get('notion');
  const manifestUrl = notionSlug
    ? `/api/notion?manifest=${encodeURIComponent(notionSlug)}`
    : '/content/manifest.json';
  const manifest: Manifest = await loadManifest(manifestUrl);

  // Hide progress during module selection
  progressFooter.style.display = 'none';

  // Color mode toggle available during selection
  function handleColorToggle(e: KeyboardEvent) {
    if (e.key === 't' || e.key === 'T') {
      const current = document.documentElement.getAttribute('data-mode') ?? 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-mode', next);
      sessionStorage.setItem('keel-color-mode', next);
    }
  }
  document.addEventListener('keydown', handleColorToggle);

  // Show module selector (this replaces keel's innerHTML, destroying beat-container)
  const { selectedModuleIds } = await showModuleSelector(manifest, keel);

  document.removeEventListener('keydown', handleColorToggle);

  // Re-create beat container elements (module selector cleanup wiped them)
  keel.innerHTML = `
    <div id="beat-container" class="beat-container">
      <div id="beat-a" class="beat-layer" aria-hidden="true"></div>
      <div id="beat-b" class="beat-layer" aria-hidden="true"></div>
    </div>
  `;
  const liveBeatContainer = document.getElementById('beat-container')!;

  // Build flat beat list and engine
  const flatBeats = buildFlatBeats(manifest, selectedModuleIds);
  const colorMode = (document.documentElement.getAttribute('data-mode') ?? 'dark') as 'light' | 'dark';
  const engine = createEngine(manifest, flatBeats, colorMode);

  // Show progress
  progressFooter.style.display = '';

  // Create renderer with live DOM elements
  const renderer = createRenderer(liveBeatContainer, progressEl);

  // Subscribe renderer
  engine.subscribe(() => {
    const info = engine.getBeatInfo();
    renderer.renderBeat(info);
  });

  // Preload first beats
  await preloadBeats(flatBeats, 0, engine.getState().contentCache, 3);

  // Show first beat
  await engine.goTo(0);

  // Focus for keyboard capture
  keel.focus();

  // Bind keyboard
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const navKeys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'PageDown', 'PageUp', 'Home', 'End'];
    if (navKeys.includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        engine.next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        engine.prev();
        break;
      case 'Home':
        engine.goTo(0);
        break;
      case 'End':
        engine.goTo(flatBeats.length - 1);
        break;
      case 't':
      case 'T':
        engine.toggleColorMode();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  });
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}

boot().catch(console.error);
