export function renderMarkdown(text) {
    let html = escapeHtml(text);
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');
    // Line breaks: double newline = paragraph break, single = <br>
    html = html
        .split(/\n{2,}/)
        .map(block => `<p>${block.replace(/\n/g, '<br>')}</p>`)
        .join('');
    return html;
}
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
