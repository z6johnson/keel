import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const PRESENTATIONS_DB = process.env.NOTION_PRESENTATIONS_DB ?? '';
const MODULES_DB = process.env.NOTION_MODULES_DB ?? '';
const BEATS_DB = process.env.NOTION_BEATS_DB ?? '';

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

function getPropRelationIds(page: PageObjectResponse, name: string): string[] {
  const p = prop(page, name);
  if (p?.type === 'relation') return p.relation.map(r => r.id);
  return [];
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

// ---------- manifest builder ----------

interface NotionBeat {
  id: string;
  beatId: string;
  role: string;
  order: number;
  caption: string;
  sourceType: string;
  sourceUrl: string;
  sourceTransform: string;
  fallbackText: string;
  pageId: string;
}

interface NotionModule {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  estimatedMinutes: number;
  presentationId: string;
}

async function buildManifest(slug: string) {
  // 1. Find presentation by slug
  const presQuery = await notion.databases.query({
    database_id: PRESENTATIONS_DB,
    filter: { property: 'Slug', rich_text: { equals: slug } },
    page_size: 1,
  });

  if (presQuery.results.length === 0) return null;

  const presPage = presQuery.results[0] as PageObjectResponse;
  const presTitle = getPropText(presPage, 'Title');
  const presId = presPage.id;

  // 2. Get modules for this presentation
  const modQuery = await notion.databases.query({
    database_id: MODULES_DB,
    filter: { property: 'Presentation', relation: { contains: presId } },
  });

  const modules: NotionModule[] = (modQuery.results as PageObjectResponse[]).map(p => ({
    id: p.id,
    moduleId: getPropText(p, 'ID'),
    title: getPropText(p, 'Title'),
    order: getPropNumber(p, 'Order'),
    estimatedMinutes: getPropNumber(p, 'Estimated Minutes'),
    presentationId: presId,
  }));
  modules.sort((a, b) => a.order - b.order);

  // 3. Get all beats for these modules
  const modulePageIds = modules.map(m => m.id);
  const beatQuery = await notion.databases.query({
    database_id: BEATS_DB,
    filter: {
      or: modulePageIds.map(mid => ({
        property: 'Module',
        relation: { contains: mid },
      })),
    },
    page_size: 100,
  });

  const allBeats: (NotionBeat & { modulePageId: string })[] = (
    beatQuery.results as PageObjectResponse[]
  ).map(p => {
    const moduleRels = getPropRelationIds(p, 'Module');
    return {
      id: p.id,
      beatId: getPropText(p, 'ID'),
      role: getPropSelect(p, 'Role').toLowerCase(),
      order: getPropNumber(p, 'Order'),
      caption: getPropText(p, 'Caption'),
      sourceType: getPropSelect(p, 'Source Type'),
      sourceUrl: getPropText(p, 'Source URL'),
      sourceTransform: getPropText(p, 'Source Transform'),
      fallbackText: getPropText(p, 'Fallback Text'),
      pageId: p.id,
      modulePageId: moduleRels[0] ?? '',
    };
  });

  // 4. Assemble manifest
  const sequence = modules.map(m => m.moduleId);

  const manifestModules = modules.map(mod => {
    const modBeats = allBeats
      .filter(b => b.modulePageId === mod.id)
      .sort((a, b) => a.order - b.order);

    const beats = modBeats.map(b => {
      const beat: Record<string, unknown> = {
        id: b.beatId,
        role: b.role,
      };

      if (b.caption) beat.caption = b.caption;

      const srcType = b.sourceType.toLowerCase();

      if (srcType === 'api' && b.sourceUrl) {
        beat.source = {
          type: 'api',
          url: b.sourceUrl,
          ...(b.sourceTransform ? { transform: b.sourceTransform } : {}),
        };
        if (b.fallbackText) {
          beat.fallback = { type: 'inline', text: b.fallbackText };
        }
      } else if (srcType === 'notion' || (srcType === '' && b.role !== 'breath')) {
        // Notion page body — use the beat's page ID as source
        beat.source = {
          type: 'notion',
          pageId: b.pageId,
        };
      }
      // breath beats with no source type get no source (empty render)

      return beat;
    });

    return {
      id: mod.moduleId,
      title: mod.title,
      estimatedMinutes: mod.estimatedMinutes,
      beats,
    };
  });

  return {
    title: presTitle,
    sequence,
    modules: manifestModules,
  };
}

// ---------- beat content loader ----------

async function loadBeatPage(pageId: string): Promise<string> {
  const blocks = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });

  const blockResults = blocks.results.filter(
    (b): b is BlockObjectResponse => 'type' in b
  );

  return blocksToMarkdown(blockResults);
}

// ---------- handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { manifest: slug, beat: beatPageId } = req.query;

    // Mode 1: Build manifest from Notion
    if (typeof slug === 'string') {
      const result = await buildManifest(slug);
      if (!result) return res.status(404).json({ error: 'Presentation not found' });

      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return res.status(200).json(result);
    }

    // Mode 2: Load a single beat's page content
    if (typeof beatPageId === 'string') {
      const markdown = await loadBeatPage(beatPageId);

      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(markdown);
    }

    return res.status(400).json({ error: 'Provide ?manifest=<slug> or ?beat=<pageId>' });
  } catch (err) {
    console.error('Notion API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
