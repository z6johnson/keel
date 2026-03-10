import type { Slide, SlideInfo, EngineState } from './types';
import { loadSlideContent, preloadSlides } from './content-loader';

type Listener = (state: Readonly<EngineState>) => void;

export interface Engine {
  getState(): Readonly<EngineState>;
  next(): Promise<void>;
  prev(): Promise<void>;
  goTo(index: number): Promise<void>;
  toggleColorMode(): void;
  getSlideInfo(): SlideInfo;
  subscribe(listener: Listener): () => void;
}

export function createEngine(
  slides: Slide[],
  initialColorMode: 'light' | 'dark' = 'dark'
): Engine {
  const listeners: Listener[] = [];

  const state: EngineState = {
    slides,
    currentIndex: 0,
    colorMode: initialColorMode,
    contentCache: new Map(),
    isTransitioning: false,
  };

  function notify() {
    for (const fn of listeners) fn(state);
  }

  function getSlideInfo(): SlideInfo {
    const slide = state.slides[state.currentIndex];
    return {
      slide,
      content: state.contentCache.get(slide.id) ?? '',
      index: state.currentIndex,
      total: state.slides.length,
    };
  }

  async function ensureLoaded(index: number): Promise<void> {
    const slide = state.slides[index];
    if (!slide || state.contentCache.has(slide.id)) return;
    const content = await loadSlideContent(slide);
    state.contentCache.set(slide.id, content);
  }

  async function navigateTo(index: number): Promise<void> {
    if (index < 0 || index >= state.slides.length) return;
    if (state.isTransitioning) return;

    state.isTransitioning = true;
    await ensureLoaded(index);
    state.currentIndex = index;
    notify();

    await new Promise(resolve => setTimeout(resolve, 220));
    state.isTransitioning = false;

    preloadSlides(state.slides, index + 1, state.contentCache, 2);
  }

  return {
    getState: () => state,
    async next() { await navigateTo(state.currentIndex + 1); },
    async prev() { await navigateTo(state.currentIndex - 1); },
    async goTo(index: number) { await navigateTo(index); },

    toggleColorMode() {
      state.colorMode = state.colorMode === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-mode', state.colorMode);
      sessionStorage.setItem('keel-color-mode', state.colorMode);
      notify();
    },

    getSlideInfo,

    subscribe(listener: Listener) {
      listeners.push(listener);
      return () => {
        const i = listeners.indexOf(listener);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };
}
