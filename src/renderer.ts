import type { Slide, SlideInfo } from './types';

export interface Renderer {
  render(info: SlideInfo): void;
}

export function createRenderer(
  container: HTMLElement,
  progressEl: HTMLElement
): Renderer {
  const layerA = container.querySelector<HTMLElement>('#layer-a')!;
  const layerB = container.querySelector<HTMLElement>('#layer-b')!;

  let activeLayer = layerA;
  let stagedLayer = layerB;
  let isFirst = true;

  function stripParagraphWrap(html: string): string {
    const trimmed = html.trim();
    const match = trimmed.match(/^<p>(.*)<\/p>$/s);
    if (match && !/<(?:p|h[1-6]|ul|ol|blockquote|hr|div)[>\s/]/i.test(match[1])) {
      return match[1];
    }
    return trimmed;
  }

  function hasBlockElements(html: string): boolean {
    return /<(?:h[1-6]|ul|ol|blockquote|hr)[>\s]/i.test(html);
  }

  function buildSlideHtml(slide: Slide, content: string): string {
    switch (slide.role) {
      case 'statement': {
        const stripped = stripParagraphWrap(content);
        if (hasBlockElements(stripped)) {
          return `<div class="slide slide--statement"><div class="prose prose--statement">${content}</div></div>`;
        }
        return `<div class="slide slide--statement"><h1>${stripped || escapeHtml(slide.content ?? '')}</h1></div>`;
      }

      case 'paragraph':
        return `<div class="slide slide--paragraph"><div class="prose">${content}</div></div>`;

      case 'signal':
        return `<div class="slide slide--signal">${content || '<p class="signal-empty">No signals available.</p>'}</div>`;

      case 'breath':
        return `<div class="slide slide--breath"><span class="breath-mark" aria-hidden="true">\u00b7</span></div>`;

      default:
        return `<div class="slide">${content}</div>`;
    }
  }

  return {
    render(info: SlideInfo) {
      stagedLayer.innerHTML = buildSlideHtml(info.slide, info.content);
      stagedLayer.setAttribute('aria-hidden', 'false');

      if (isFirst) {
        activeLayer.classList.remove('active');
        stagedLayer.classList.add('active');
        isFirst = false;
      } else {
        activeLayer.classList.remove('active');
        stagedLayer.classList.add('active');
        activeLayer.setAttribute('aria-hidden', 'true');
      }

      const temp = activeLayer;
      activeLayer = stagedLayer;
      stagedLayer = temp;

      progressEl.textContent = `${info.index + 1}\u2009/\u2009${info.total}`;
    },
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
