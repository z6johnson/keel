export function createRenderer(container, progressEl) {
    const layerA = container.querySelector('#beat-a');
    const layerB = container.querySelector('#beat-b');
    let activeLayer = layerA;
    let stagedLayer = layerB;
    let isFirst = true;
    function buildBeatHtml(beat, content) {
        switch (beat.role) {
            case 'statement':
                return `<div class="beat beat--statement"><h1>${content || escapeHtml(beat.content ?? '')}</h1></div>`;
            case 'section':
                return `<div class="beat beat--section"><h2>${content || escapeHtml(beat.content ?? '')}</h2></div>`;
            case 'paragraph':
                return `<div class="beat beat--paragraph"><div class="prose">${content}</div></div>`;
            case 'signal':
                return `<div class="beat beat--signal">${content || '<p class="signal-empty">No signals available.</p>'}</div>`;
            case 'breath':
                return `<div class="beat beat--breath"><span class="breath-mark" aria-hidden="true">\u00b7</span></div>`;
            default:
                return `<div class="beat">${content}</div>`;
        }
    }
    function updateProgress(info) {
        const multiModule = new Set(info.beat.moduleId
            ? [info.beat.moduleId]
            : []).size > 0;
        if (multiModule && info.moduleTitle) {
            const globalPos = `${info.index + 1}\u2009/\u2009${info.total}`;
            const modulePos = `${info.moduleIndex}\u2009/\u2009${info.moduleTotal}`;
            progressEl.textContent = `${info.moduleTitle}\u2002\u2014\u2002${modulePos}\u2002\u00b7\u2002${globalPos}`;
        }
        else {
            progressEl.textContent = `${info.index + 1}\u2009/\u2009${info.total}`;
        }
    }
    return {
        async renderBeat(info) {
            const html = buildBeatHtml(info.beat, info.content);
            // Caption
            const captionHtml = info.beat.caption
                ? `<div class="beat__caption">${escapeHtml(info.beat.caption)}</div>`
                : '';
            stagedLayer.innerHTML = html + captionHtml;
            stagedLayer.setAttribute('aria-hidden', 'false');
            if (isFirst) {
                // No transition on first beat
                activeLayer.classList.remove('active');
                stagedLayer.classList.add('active');
                isFirst = false;
            }
            else {
                // Crossfade
                activeLayer.classList.remove('active');
                stagedLayer.classList.add('active');
                activeLayer.setAttribute('aria-hidden', 'true');
            }
            // Swap layers
            const temp = activeLayer;
            activeLayer = stagedLayer;
            stagedLayer = temp;
            updateProgress(info);
        },
        setColorMode(mode) {
            document.documentElement.setAttribute('data-mode', mode);
        },
    };
}
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
