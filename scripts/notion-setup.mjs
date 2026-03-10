#!/usr/bin/env node

/**
 * Keel — Notion Workspace Setup
 *
 * Creates a presentation database in Notion with the correct schema
 * and populates it with starter slides demonstrating each role.
 *
 * Usage:
 *   NOTION_TOKEN=ntn_... node scripts/notion-setup.mjs [--parent PAGE_ID]
 *
 * If --parent is omitted, creates a top-level page in the workspace.
 */

import { Client } from '@notionhq/client';

// ---------- config ----------

const token = process.env.NOTION_TOKEN;
if (!token) {
  console.error('Missing NOTION_TOKEN environment variable.');
  process.exit(1);
}

const notion = new Client({ auth: token });

const args = process.argv.slice(2);
const parentIndex = args.indexOf('--parent');
const parentPageId = parentIndex !== -1 ? args[parentIndex + 1] : null;

// ---------- create database ----------

async function createDatabase() {
  const parent = parentPageId
    ? { type: 'page_id', page_id: parentPageId }
    : { type: 'page_id', page_id: await createParentPage() };

  const db = await notion.databases.create({
    parent,
    title: [{ type: 'text', text: { content: 'Keel Presentation' } }],
    properties: {
      Name: { title: {} },
      Order: { number: { format: 'number' } },
    },
  });

  console.log(`Database created: ${db.id}`);
  console.log(`Set NOTION_NOTES_DB=${db.id}`);
  return db.id;
}

async function createParentPage() {
  const page = await notion.pages.create({
    parent: { type: 'workspace', workspace: true },
    properties: {
      title: [{ type: 'text', text: { content: 'Keel' } }],
    },
  });
  console.log(`Parent page created: ${page.id}`);
  return page.id;
}

// ---------- starter slides ----------

const starterSlides = [
  {
    name: 'Title',
    order: 10,
    blocks: [
      { type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'Welcome to Keel' } }] } },
    ],
  },
  {
    name: 'Breath',
    order: 20,
    blocks: [],
  },
  {
    name: 'Thesis',
    order: 30,
    blocks: [
      { type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'One idea per slide. Let the typography do the work.' } }] } },
    ],
  },
  {
    name: 'Detail',
    order: 40,
    blocks: [
      { type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'How it works' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'Each page in this database becomes a slide. Keel reads the content and infers the visual treatment automatically.' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'Empty page = breath (visual pause)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'Short sentence = statement (large heading)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'Longer content = paragraph (body prose)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'URL or {{signals}} = signal cards' } }] } },
    ],
  },
  {
    name: 'Closing',
    order: 50,
    blocks: [],
  },
];

async function populateSlides(dbId) {
  for (const slide of starterSlides) {
    const page = await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        Name: { title: [{ type: 'text', text: { content: slide.name } }] },
        Order: { number: slide.order },
      },
    });

    if (slide.blocks.length > 0) {
      await notion.blocks.children.append({
        block_id: page.id,
        children: slide.blocks,
      });
    }

    console.log(`  Slide ${slide.order}: ${slide.name}${slide.blocks.length === 0 ? ' (breath)' : ''}`);
  }
}

// ---------- run ----------

async function main() {
  console.log('Keel — Notion Workspace Setup\n');

  const dbId = await createDatabase();
  console.log('\nPopulating starter slides...');
  await populateSlides(dbId);

  console.log('\nDone. Next steps:');
  console.log(`  1. Set NOTION_NOTES_DB=${dbId} in your environment`);
  console.log('  2. Run: npm run dev');
  console.log('  3. Open: http://localhost:3000/?notion');
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
