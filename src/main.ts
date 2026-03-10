import type { Manifest } from './types';
import { loadManifest, preloadSlides, setFogbellUrl } from './content-loader';
import { createEngine } from './engine';
import { createRenderer } from './renderer';

async function boot() {
  const keel = document.getElementById('keel')!;
  const container = document.getElementById('stage')!;
  const progressEl = document.getElementById('progress-counter')!;

  // Restore color mode
  const savedMode = sessionStorage.getItem('keel-color-mode') as 'light' | 'dark' | null;
  document.documentElement.setAttribute('data-mode', savedMode ?? 'dark');

  // Load manifest from Notion API
  const manifestUrl = '/api/notion?manifest';

  const manifest: Manifest = await loadManifest(manifestUrl);

  if (manifest.fogbellUrl) {
    setFogbellUrl(manifest.fogbellUrl);
  }

  // Create engine and renderer
  const colorMode = (document.documentElement.getAttribute('data-mode') ?? 'dark') as 'light' | 'dark';
  const engine = createEngine(manifest.slides, colorMode);
  const renderer = createRenderer(container, progressEl);

  engine.subscribe(() => {
    renderer.render(engine.getSlideInfo());
  });

  // Preload and show first slide
  await preloadSlides(manifest.slides, 0, engine.getState().contentCache, 3);
  await engine.goTo(0);
  keel.focus();

  // Keyboard navigation
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const navKeys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'PageDown', 'PageUp', 'Home', 'End'];
    if (navKeys.includes(e.key)) e.preventDefault();

    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown':
        engine.next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        engine.prev(); break;
      case 'Home':
        engine.goTo(0); break;
      case 'End':
        engine.goTo(manifest.slides.length - 1); break;
      case 't': case 'T':
        engine.toggleColorMode(); break;
      case 'f': case 'F':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
        break;
    }
  });
}

boot().catch(console.error);
