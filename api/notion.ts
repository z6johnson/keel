import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const NOTES_DB = process.env.NOTION_NOTES_DB ?? '';
const FOGBELL_URL = process.env.FOGBELL_URL ?? '';

// ---------- helpers ----------

function prop(page: PageObjectResponse, name: string) {
  return page.properties[name];
}

function richTextPlain(rt: RichTextItemResponse[]): string {
  return rt.map(t => t.plain_text).join('');
}

function getPropText(page: PageObjectResponse, name: string): string {
  const p = prop(page, name);
  if (!p) return '';
  if (p.type === 'title') return richTextPlain(p.title);
  if (p.type === 'rich_text') return richTextPlain(p.rich_text);
  if (p.type === 'url') return p.url ?? '';
  return '';
}

function getPropNumber(page: PageObjectResponse, name: string): number {
  const p = prop(page, name);
  if (p?.type === 'number') return p.number ?? 0;
  return 0;
}

// ---------- blocks → markdown ----------

function richTextToMarkdown(rt: RichTextItemResponse[]): string {
  return rt
    .map(t => {
      let text = t.plain_text;
      if (t.annotations.bold) text = `**${text}**`;
      if (t.annotations.italic) text = `*${text}*`;
      if (t.annotations.code) text = `\`${text}\``;
      if (t.type === 'text' && t.text.link) text = `[${text}](${t.text.link.url})`;
      return text;
    })
    .join('');
}

function blocksToMarkdown(blocks: BlockObjectResponse[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        lines.push(richTextToMarkdown(block.paragraph.rich_text));
        lines.push('');
        break;
      case 'heading_1':
        lines.push(`# ${richTextToMarkdown(block.heading_1.rich_text)}`);
        lines.push('');
        break;
      case 'heading_2':
        lines.push(`## ${richTextToMarkdown(block.heading_2.rich_text)}`);
        lines.push('');
        break;
      case 'heading_3':
        lines.push(`### ${richTextToMarkdown(block.heading_3.rich_text)}`);
        lines.push('');
        break;
      case 'bulleted_list_item':
        lines.push(`- ${richTextToMarkdown(block.bulleted_list_item.rich_text)}`);
        break;
      case 'numbered_list_item':
        lines.push(`1. ${richTextToMarkdown(block.numbered_list_item.rich_text)}`);
        break;
      case 'quote':
        lines.push(`> ${richTextToMarkdown(block.quote.rich_text)}`);
        lines.push('');
        break;
      case 'divider':
        lines.push('---');
        lines.push('');
        break;
      case 'callout':
        lines.push(richTextToMarkdown(block.callout.rich_text));
        lines.push('');
        break;
      default:
        break;
    }
  }

  return lines.join('\n').trim();
}

// ---------- role inference ----------

type SlideRole = 'statement' | 'paragraph' | 'signal' | 'breath';

function isUrl(text: string): boolean {
  return /^https?:\/\/\S+$/.test(text.trim());
}

function inferRole(markdown: string): SlideRole {
  const trimmed = markdown.trim();

  if (!trimmed) return 'breath';
  if (trimmed === '{{signals}}') return 'signal';
  if (isUrl(trimmed)) return 'signal';

  const hasBlocks = /^(?:#{1,3} |- |\d+\. |> |---)/m.test(trimmed);
  if (hasBlocks) return 'paragraph';
  if (/\n\s*\n/.test(trimmed)) return 'paragraph';
  if (trimmed.length <= 140) return 'statement';

  return 'paragraph';
}

// ---------- manifest builder ----------

async function loadPageBody(pageId: string): Promise<string> {
  const blocks = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });

  const blockResults = blocks.results.filter(
    (b): b is BlockObjectResponse => 'type' in b
  );

  return blocksToMarkdown(blockResults);
}

async function buildManifest() {
  const dbMeta = await notion.databases.retrieve({ database_id: NOTES_DB });
  const dbTitle = dbMeta.title.map(t => t.plain_text).join('') || 'Untitled';

  // Check if Order property exists for sorting
  const hasOrder = 'Order' in dbMeta.properties;

  const query = await notion.databases.query({
    database_id: NOTES_DB,
    sorts: hasOrder
      ? [{ property: 'Order', direction: 'ascending' }]
      : [{ timestamp: 'created_time', direction: 'ascending' }],
    page_size: 100,
  });

  const pages = query.results as PageObjectResponse[];

  // Fetch all page bodies in parallel
  const bodies = await Promise.all(pages.map(p => loadPageBody(p.id)));

  // Build flat slide array
  const slides = pages.map((page, i) => {
    const markdown = bodies[i];
    const role = inferRole(markdown);
    const id = getPropText(page, 'Name') || `slide-${i + 1}`;

    const slide: Record<string, unknown> = { id, role };

    if (role === 'signal') {
      slide.content = markdown.trim();
    } else if (role !== 'breath') {
      slide.content = markdown;
    }

    return slide;
  });

  return { title: dbTitle, slides, fogbellUrl: FOGBELL_URL || undefined };
}

// ---------- handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { manifest } = req.query;

    if (manifest !== undefined) {
      const result = await buildManifest();
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: 'Use ?manifest to load the presentation.' });
  } catch (err) {
    console.error('Notion API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
