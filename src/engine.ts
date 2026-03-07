import type { Beat, BeatInfo, EngineState, Manifest } from './types';
import { loadBeatContent, preloadBeats } from './content-loader';

type Listener = (state: Readonly<EngineState>) => void;

export interface Engine {
  getState(): Readonly<EngineState>;
  next(): Promise<void>;
  prev(): Promise<void>;
  goTo(index: number): Promise<void>;
  toggleColorMode(): void;
  getBeatInfo(): BeatInfo;
  subscribe(listener: Listener): () => void;
}

export function buildFlatBeats(manifest: Manifest, selectedModuleIds: string[]): Beat[] {
  const moduleMap = new Map(manifest.modules.map(m => [m.id, m]));
  const ordered = manifest.sequence.filter(id => selectedModuleIds.includes(id));
  const flat: Beat[] = [];

  for (let i = 0; i < ordered.length; i++) {
    const mod = moduleMap.get(ordered[i]);
    if (!mod) continue;

    // Insert transition section beat between modules
    if (i > 0) {
      flat.push({
        id: `__transition-${mod.id}`,
        role: 'section',
        content: mod.title,
        moduleId: mod.id,
      });
    }

    for (const beat of mod.beats) {
      flat.push({ ...beat, moduleId: mod.id });
    }
  }

  return flat;
}

export function createEngine(
  manifest: Manifest,
  flatBeats: Beat[],
  initialColorMode: 'light' | 'dark' = 'dark'
): Engine {
  const listeners: Listener[] = [];

  const state: EngineState = {
    flatBeats,
    currentIndex: 0,
    colorMode: initialColorMode,
    contentCache: new Map(),
    modules: manifest.modules,
    selectedModuleIds: manifest.sequence,
    isTransitioning: false,
  };

  function notify() {
    for (const fn of listeners) fn(state);
  }

  function getBeatInfo(): BeatInfo {
    const beat = state.flatBeats[state.currentIndex];
    const mod = state.modules.find(m => m.id === beat.moduleId);

    // Count beats within this module
    const moduleBeats = state.flatBeats.filter(
      b => b.moduleId === beat.moduleId && !b.id.startsWith('__transition-')
    );
    const moduleIndex = moduleBeats.indexOf(beat);

    return {
      beat,
      content: state.contentCache.get(beat.id) ?? '',
      index: state.currentIndex,
      total: state.flatBeats.length,
      moduleTitle: mod?.title ?? '',
      moduleIndex: Math.max(0, moduleIndex) + 1,
      moduleTotal: moduleBeats.length,
    };
  }

  async function ensureLoaded(index: number): Promise<void> {
    const beat = state.flatBeats[index];
    if (!beat || state.contentCache.has(beat.id)) return;
    const content = await loadBeatContent(beat);
    state.contentCache.set(beat.id, content);
  }

  async function navigateTo(index: number): Promise<void> {
    if (index < 0 || index >= state.flatBeats.length) return;
    if (state.isTransitioning) return;

    state.isTransitioning = true;
    await ensureLoaded(index);
    state.currentIndex = index;
    notify();

    // Allow transition to complete before accepting next input
    await new Promise(resolve => setTimeout(resolve, 220));
    state.isTransitioning = false;

    // Preload ahead
    preloadBeats(state.flatBeats, index + 1, state.contentCache, 2);
  }

  return {
    getState: () => state,

    async next() {
      await navigateTo(state.currentIndex + 1);
    },

    async prev() {
      await navigateTo(state.currentIndex - 1);
    },

    async goTo(index: number) {
      await navigateTo(index);
    },

    toggleColorMode() {
      state.colorMode = state.colorMode === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-mode', state.colorMode);
      sessionStorage.setItem('keel-color-mode', state.colorMode);
      notify();
    },

    getBeatInfo,

    subscribe(listener: Listener) {
      listeners.push(listener);
      return () => {
        const i = listeners.indexOf(listener);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };
}
