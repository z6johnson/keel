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

function getPropSelect(page: PageObjectResponse, name: string): string {
  const p = prop(page, name);
  if (p?.type === 'select') return p.select?.name ?? '';
  return '';
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

type BeatRole = 'statement' | 'paragraph' | 'signal' | 'breath';

function inferRole(markdown: string): BeatRole {
  const trimmed = markdown.trim();

  // Empty → breath
  if (!trimmed) return 'breath';

  // Signals directive
  if (trimmed === '{{signals}}') return 'signal';

  // Check for block-level elements (headings, lists, blockquotes, hr, multiple paragraphs)
  const hasBlocks = /^(?:#{1,3} |- |\d+\. |> |---)/m.test(trimmed);
  if (hasBlocks) return 'paragraph';

  // Multiple paragraphs (double newline separated)
  if (/\n\s*\n/.test(trimmed)) return 'paragraph';

  // Short single paragraph → statement
  if (trimmed.length <= 140) return 'statement';

  return 'paragraph';
}

// ---------- manifest builder ----------

interface NoteRow {
  pageId: string;
  title: string;
  module: string;
  order: number;
}

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

async function buildManifest(workshopSlug?: string) {
  // 1. Get database title for the presentation name
  const dbMeta = await notion.databases.retrieve({ database_id: NOTES_DB });
  const dbTitle = dbMeta.title.map(t => t.plain_text).join('') || 'Untitled';

  // 2. Query all notes (optionally filtered by Workshop)
  const filter = workshopSlug
    ? { property: 'Workshop', select: { equals: workshopSlug } }
    : undefined;

  const query = await notion.databases.query({
    database_id: NOTES_DB,
    filter,
    page_size: 100,
  });

  const notes: NoteRow[] = (query.results as PageObjectResponse[]).map(p => ({
    pageId: p.id,
    title: getPropText(p, 'Name'),
    module: getPropSelect(p, 'Module'),
    order: getPropNumber(p, 'Order'),
  }));

  // 3. Group by module
  const moduleMap = new Map<string, NoteRow[]>();
  for (const note of notes) {
    const key = note.module || 'Untitled';
    if (!moduleMap.has(key)) moduleMap.set(key, []);
    moduleMap.get(key)!.push(note);
  }

  // Sort notes within each module by Order
  for (const group of moduleMap.values()) {
    group.sort((a, b) => a.order - b.order);
  }

  // Sort modules by their first note's Order value
  const sortedModules = [...moduleMap.entries()].sort(
    (a, b) => (a[1][0]?.order ?? 0) - (b[1][0]?.order ?? 0)
  );

  // 4. Fetch all page bodies in parallel
  const allPageIds = notes.map(n => n.pageId);
  const bodies = await Promise.all(allPageIds.map(id => loadPageBody(id)));
  const bodyMap = new Map<string, string>();
  allPageIds.forEach((id, i) => bodyMap.set(id, bodies[i]));

  // 5. Build manifest
  const sequence: string[] = [];
  const modules = sortedModules.map(([moduleName, moduleNotes]) => {
    const moduleId = slugify(moduleName);
    sequence.push(moduleId);

    const beats = moduleNotes.map((note, idx) => {
      const markdown = bodyMap.get(note.pageId) ?? '';
      const role = inferRole(markdown);

      const beat: Record<string, unknown> = {
        id: `${moduleId}-${idx + 1}`,
        role,
      };

      // Inline content for non-signal beats
      if (role === 'signal') {
        beat.content = '{{signals}}';
      } else if (role !== 'breath') {
        beat.content = markdown;
      }

      return beat;
    });

    return {
      id: moduleId,
      title: moduleName,
      estimatedMinutes: Math.max(1, moduleNotes.length * 3),
      beats,
    };
  });

  return { title: dbTitle, sequence, modules, fogbellUrl: FOGBELL_URL || undefined };
}

// ---------- handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { manifest, beat: beatPageId } = req.query;

    // Mode 1: Build manifest from Notion
    if (manifest !== undefined) {
      const slug = typeof manifest === 'string' && manifest !== '' ? manifest : undefined;
      const result = await buildManifest(slug);

      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return res.status(200).json(result);
    }

    // Mode 2: Load a single page's content (backward compat)
    if (typeof beatPageId === 'string') {
      const markdown = await loadPageBody(beatPageId);

      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(markdown);
    }

    return res.status(400).json({ error: 'Provide ?manifest or ?manifest=<workshop-slug> or ?beat=<pageId>' });
  } catch (err) {
    console.error('Notion API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
