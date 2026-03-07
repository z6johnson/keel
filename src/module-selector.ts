import type { Manifest } from './types';

interface SelectorResult {
  selectedModuleIds: string[];
}

export function showModuleSelector(
  manifest: Manifest,
  container: HTMLElement
): Promise<SelectorResult> {
  return new Promise((resolve) => {
    const selected = new Set(manifest.sequence);
    let focusIndex = 0;

    const orderedModules = manifest.sequence
      .map(id => manifest.modules.find(m => m.id === id))
      .filter((m): m is NonNullable<typeof m> => m != null);

    function render() {
      const totalMinutes = orderedModules
        .filter(m => selected.has(m.id))
        .reduce((sum, m) => sum + m.estimatedMinutes, 0);

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const timeStr = hours > 0
        ? `${hours}h ${mins > 0 ? `${mins}m` : ''}`
        : `${mins}m`;

      container.innerHTML = `
        <div class="module-selector">
          <h1 class="module-selector__title">${escapeHtml(manifest.title)}</h1>
          <ul class="module-selector__list" role="listbox" aria-label="Workshop modules">
            ${orderedModules.map((mod, i) => `
              <li class="module-selector__item"
                  role="option"
                  tabindex="${i === focusIndex ? '0' : '-1'}"
                  aria-selected="${selected.has(mod.id)}"
                  data-module-id="${mod.id}"
                  data-index="${i}">
                <span class="module-selector__check"
                      role="checkbox"
                      aria-checked="${selected.has(mod.id)}">
                  ${selected.has(mod.id) ? '\u2713' : ''}
                </span>
                <span class="module-selector__label">${escapeHtml(mod.title)}</span>
                <span class="module-selector__time">${mod.estimatedMinutes}m</span>
              </li>
            `).join('')}
          </ul>
          <div class="module-selector__footer">
            <span class="module-selector__total">${selected.size} module${selected.size !== 1 ? 's' : ''} \u00b7 ${timeStr}</span>
            <button class="module-selector__start" ${selected.size === 0 ? 'disabled' : ''}>Begin</button>
          </div>
          <p class="module-selector__hint">Space to toggle \u00b7 Enter to begin \u00b7 T for color mode</p>
        </div>
      `;

      // Focus the active item
      const items = container.querySelectorAll<HTMLElement>('.module-selector__item');
      items[focusIndex]?.focus();
    }

    function toggle(moduleId: string) {
      if (selected.has(moduleId)) {
        selected.delete(moduleId);
      } else {
        selected.add(moduleId);
      }
      render();
    }

    function start() {
      if (selected.size === 0) return;
      cleanup();
      resolve({
        selectedModuleIds: manifest.sequence.filter(id => selected.has(id)),
      });
    }

    function handleKeydown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          focusIndex = Math.min(focusIndex + 1, orderedModules.length - 1);
          render();
          break;
        case 'ArrowUp':
          e.preventDefault();
          focusIndex = Math.max(focusIndex - 1, 0);
          render();
          break;
        case ' ':
          e.preventDefault();
          toggle(orderedModules[focusIndex].id);
          break;
        case 'Enter':
          e.preventDefault();
          start();
          break;
      }
    }

    function handleClick(e: MouseEvent) {
      const item = (e.target as HTMLElement).closest<HTMLElement>('.module-selector__item');
      if (item) {
        const id = item.dataset.moduleId;
        if (id) toggle(id);
        return;
      }
      if ((e.target as HTMLElement).closest('.module-selector__start')) {
        start();
      }
    }

    function cleanup() {
      container.removeEventListener('keydown', handleKeydown);
      container.removeEventListener('click', handleClick);
      container.innerHTML = '';
    }

    container.addEventListener('keydown', handleKeydown);
    container.addEventListener('click', handleClick);

    render();
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
