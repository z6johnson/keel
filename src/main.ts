import type { Manifest } from './types';
import { loadManifest, preloadBeats } from './content-loader';
import { buildFlatBeats, createEngine } from './engine';
import { showModuleSelector } from './module-selector';
import { createRenderer } from './renderer';

async function boot() {
  const keel = document.getElementById('keel')!;
  const beatContainer = document.getElementById('beat-container')!;
  const progressEl = document.getElementById('progress-counter')!;
  const progressFooter = document.getElementById('progress')!;

  // Restore color mode
  const savedMode = sessionStorage.getItem('keel-color-mode') as 'light' | 'dark' | null;
  const initialMode = savedMode ?? 'dark';
  document.documentElement.setAttribute('data-mode', initialMode);

  // Load manifest
  const manifest: Manifest = await loadManifest('/content/manifest.json');

  // Hide beat container and progress during module selection
  beatContainer.style.display = 'none';
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

  // Show module selector
  const { selectedModuleIds } = await showModuleSelector(manifest, keel);

  document.removeEventListener('keydown', handleColorToggle);

  // Build flat beat list and engine
  const flatBeats = buildFlatBeats(manifest, selectedModuleIds);
  const colorMode = (document.documentElement.getAttribute('data-mode') ?? 'dark') as 'light' | 'dark';
  const engine = createEngine(manifest, flatBeats, colorMode);

  // Show beat container and progress
  beatContainer.style.display = '';
  progressFooter.style.display = '';

  // Create renderer
  const renderer = createRenderer(beatContainer, progressEl);

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
