#!/usr/bin/env node

/**
 * Keel — Notion Workspace Setup
 *
 * Creates a parent page with child pages (slides) in Notion.
 * No database — just pages.
 *
 * Usage:
 *   NOTION_TOKEN=ntn_... node scripts/notion-setup.mjs [--parent PAGE_ID]
 *
 * If --parent is omitted, creates a top-level page in the workspace.
 */

import { Client } from '@notionhq/client';

const token = process.env.NOTION_TOKEN;
if (!token) {
  console.error('Missing NOTION_TOKEN environment variable.');
  process.exit(1);
}

const notion = new Client({ auth: token });

const args = process.argv.slice(2);
const parentIndex = args.indexOf('--parent');
const parentPageId = parentIndex !== -1 ? args[parentIndex + 1] : null;

// ---------- starter slides ----------

const starterSlides = [
  {
    title: 'Welcome to Keel',
    blocks: [
      { type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'Welcome to Keel' } }] } },
    ],
  },
  {
    title: 'Breath',
    blocks: [],
  },
  {
    title: 'Thesis',
    blocks: [
      { type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'One idea per slide. Let the typography do the work.' } }] } },
    ],
  },
  {
    title: 'Detail',
    blocks: [
      { type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'How it works' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'Each sub-page becomes a slide. Keel reads the content and infers the visual treatment automatically.' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'Empty page = breath (visual pause)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'Short sentence = statement (large heading)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'Longer content = paragraph (body prose)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'URL or {{signals}} = signal cards' } }] } },
    ],
  },
  {
    title: 'Closing',
    blocks: [],
  },
];

// ---------- create pages ----------

async function main() {
  console.log('Keel — Notion Workspace Setup\n');

  // Create the parent presentation page
  const parent = parentPageId
    ? { page_id: parentPageId }
    : { page_id: await createWorkspacePage() };

  const presentationPage = await notion.pages.create({
    parent,
    properties: {
      title: [{ type: 'text', text: { content: 'Keel Presentation' } }],
    },
  });

  const pageId = presentationPage.id;
  console.log(`Presentation page created: ${pageId}`);

  // Create child pages (slides) inside the presentation page
  console.log('\nCreating slides...');
  for (const slide of starterSlides) {
    const childPage = await notion.pages.create({
      parent: { page_id: pageId },
      properties: {
        title: [{ type: 'text', text: { content: slide.title } }],
      },
    });

    if (slide.blocks.length > 0) {
      await notion.blocks.children.append({
        block_id: childPage.id,
        children: slide.blocks,
      });
    }

    console.log(`  ${slide.title}${slide.blocks.length === 0 ? ' (breath)' : ''}`);
  }

  console.log('\nDone. Next steps:');
  console.log(`  1. Set NOTION_PAGE_ID=${pageId}`);
  console.log('  2. Run: npm run dev');
  console.log('  3. Open: http://localhost:3000/?notion');
}

async function createWorkspacePage() {
  const page = await notion.pages.create({
    parent: { type: 'workspace', workspace: true },
    properties: {
      title: [{ type: 'text', text: { content: 'Keel' } }],
    },
  });
  console.log(`Workspace page created: ${page.id}`);
  return page.id;
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
