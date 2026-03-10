export function renderMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  const lines = escaped.split('\n');

  // Phase 1: classify each line into a block type
  interface Block { type: string; content: string }
  const blocks: Block[] = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    let match: RegExpMatchArray | null;

    if ((match = trimmed.match(/^### (.+)$/))) {
      blocks.push({ type: 'h3', content: match[1] });
    } else if ((match = trimmed.match(/^## (.+)$/))) {
      blocks.push({ type: 'h2', content: match[1] });
    } else if ((match = trimmed.match(/^# (.+)$/))) {
      blocks.push({ type: 'h1', content: match[1] });
    } else if ((match = trimmed.match(/^- (.+)$/))) {
      blocks.push({ type: 'ul', content: match[1] });
    } else if ((match = trimmed.match(/^\d+\. (.+)$/))) {
      blocks.push({ type: 'ol', content: match[1] });
    } else if ((match = trimmed.match(/^&gt; (.+)$/))) {
      blocks.push({ type: 'blockquote', content: match[1] });
    } else if (/^---+$/.test(trimmed)) {
      blocks.push({ type: 'hr', content: '' });
    } else if (trimmed === '') {
      blocks.push({ type: 'empty', content: '' });
    } else {
      blocks.push({ type: 'text', content: trimmed });
    }
  }

  // Phase 2: group blocks into HTML output
  const output: string[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    // Skip empty lines (they act as separators, not content)
    if (block.type === 'empty') {
      i++;
      continue;
    }

    // Headings
    if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
      const tag = block.type;
      output.push(`<${tag}>${applyInline(block.content)}</${tag}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (block.type === 'hr') {
      output.push('<hr>');
      i++;
      continue;
    }

    // Blockquote
    if (block.type === 'blockquote') {
      output.push(`<blockquote>${applyInline(block.content)}</blockquote>`);
      i++;
      continue;
    }

    // Bulleted list: group consecutive ul items
    if (block.type === 'ul') {
      const items: string[] = [];
      while (i < blocks.length && blocks[i].type === 'ul') {
        items.push(`<li>${applyInline(blocks[i].content)}</li>`);
        i++;
      }
      output.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Numbered list: group consecutive ol items
    if (block.type === 'ol') {
      const items: string[] = [];
      while (i < blocks.length && blocks[i].type === 'ol') {
        items.push(`<li>${applyInline(blocks[i].content)}</li>`);
        i++;
      }
      output.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Plain text: group consecutive text lines into a paragraph
    if (block.type === 'text') {
      const parts: string[] = [];
      while (i < blocks.length && blocks[i].type === 'text') {
        parts.push(applyInline(blocks[i].content));
        i++;
      }
      output.push(`<p>${parts.join('<br>')}</p>`);
      continue;
    }

    // Fallback
    i++;
  }

  return output.join('');
}

function applyInline(text: string): string {
  // 1. Extract inline code spans to protect from further processing
  const codeSpans: string[] = [];
  let result = text.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(`<code>${code}</code>`);
    return `\x00CODE${codeSpans.length - 1}\x00`;
  });

  // 2. Links [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );

  // 3. Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // 4. Italic: *text* or _text_
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');

  // 5. Restore code spans
  result = result.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeSpans[Number(i)]);

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
