import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

// ---------- config ----------

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const NOTES_DB = process.env.NOTION_NOTES_DB ?? '';
const FOGBELL_URL = process.env.FOGBELL_URL ?? '';

// ---------- types ----------

type SlideRole = 'statement' | 'paragraph' | 'signal' | 'breath';

interface Slide {
  id: string;
  role: SlideRole;
  content?: string;
}

interface Manifest {
  title: string;
  slides: Slide[];
  fogbellUrl?: string;
}

// ---------- Notion property readers ----------

function titleText(page: PageObjectResponse): string {
  const p = page.properties['Name'];
  if (p?.type === 'title') return p.title.map(t => t.plain_text).join('');
  return '';
}

function orderNumber(page: PageObjectResponse): number {
  const p = page.properties['Order'];
  if (p?.type === 'number') return p.number ?? 0;
  return 0;
}

// ---------- rich text → markdown ----------

function richText(rt: RichTextItemResponse[]): string {
  return rt
    .map(t => {
      let s = t.plain_text;
      if (t.annotations.bold) s = `**${s}**`;
      if (t.annotations.italic) s = `*${s}*`;
      if (t.annotations.code) s = `\`${s}\``;
      if (t.type === 'text' && t.text.link) s = `[${s}](${t.text.link.url})`;
      return s;
    })
    .join('');
}

// ---------- blocks → markdown ----------

function toMarkdown(blocks: BlockObjectResponse[]): string {
  const lines: string[] = [];

  for (const b of blocks) {
    switch (b.type) {
      case 'paragraph':
        lines.push(richText(b.paragraph.rich_text), '');
        break;
      case 'heading_1':
        lines.push(`# ${richText(b.heading_1.rich_text)}`, '');
        break;
      case 'heading_2':
        lines.push(`## ${richText(b.heading_2.rich_text)}`, '');
        break;
      case 'heading_3':
        lines.push(`### ${richText(b.heading_3.rich_text)}`, '');
        break;
      case 'bulleted_list_item':
        lines.push(`- ${richText(b.bulleted_list_item.rich_text)}`);
        break;
      case 'numbered_list_item':
        lines.push(`1. ${richText(b.numbered_list_item.rich_text)}`);
        break;
      case 'quote':
        lines.push(`> ${richText(b.quote.rich_text)}`, '');
        break;
      case 'divider':
        lines.push('---', '');
        break;
      case 'callout':
        lines.push(richText(b.callout.rich_text), '');
        break;
    }
  }

  return lines.join('\n').trim();
}

// ---------- role inference ----------

function inferRole(md: string): SlideRole {
  const text = md.trim();
  if (!text) return 'breath';
  if (text === '{{signals}}' || /^https?:\/\/\S+$/.test(text)) return 'signal';
  if (/^(?:#{1,3} |- |\d+\. |> |---)/m.test(text)) return 'paragraph';
  if (/\n\s*\n/.test(text)) return 'paragraph';
  if (text.length <= 140) return 'statement';
  return 'paragraph';
}

// ---------- build manifest ----------

async function fetchBlocks(pageId: string): Promise<string> {
  const { results } = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
  return toMarkdown(results.filter((b): b is BlockObjectResponse => 'type' in b));
}

async function buildManifest(): Promise<Manifest> {
  const db = await notion.databases.retrieve({ database_id: NOTES_DB });
  const fullDb = db as { title: Array<{ plain_text: string }>; properties: Record<string, unknown> };
  const title = fullDb.title.map(t => t.plain_text).join('') || 'Untitled';
  const hasOrder = 'Order' in fullDb.properties;

  const { results } = await notion.databases.query({
    database_id: NOTES_DB,
    sorts: hasOrder
      ? [{ property: 'Order', direction: 'ascending' }]
      : [{ timestamp: 'created_time', direction: 'ascending' }],
    page_size: 100,
  });

  const pages = results as PageObjectResponse[];
  const bodies = await Promise.all(pages.map(p => fetchBlocks(p.id)));

  const slides: Slide[] = pages.map((page, i) => {
    const md = bodies[i];
    const role = inferRole(md);
    const slide: Slide = {
      id: titleText(page) || `slide-${i + 1}`,
      role,
    };
    if (role !== 'breath') slide.content = md.trim();
    return slide;
  });

  return { title, slides, fogbellUrl: FOGBELL_URL || undefined };
}

// ---------- handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.query.manifest !== undefined) {
      const manifest = await buildManifest();
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return res.status(200).json(manifest);
    }
    return res.status(400).json({ error: 'Use ?manifest to load the presentation.' });
  } catch (err) {
    console.error('Notion API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
