# Managing Presentations

Write, organize, and present with Keel and Notion.

> **First-time setup?** See [Notion Workspace Setup](notion-workspace-setup.md) or run `node scripts/notion-setup.mjs`.

---

## Writing Slides

Each row in the Notion database is a slide. The page body is the content.

1. Add a row to the database
2. Set the **Order** number (10, 20, 30 — use gaps for easy insertion)
3. Open the row and write

Keel infers the slide role automatically:

| What you write                          | Role          | Visual treatment             |
|-----------------------------------------|---------------|------------------------------|
| Nothing (empty page)                    | **breath**    | Centered pause dot ( · )     |
| A short sentence ( ≤ 140 chars )        | **statement** | Large display heading        |
| Multiple paragraphs, lists, headings    | **paragraph** | Body prose                   |
| A URL (e.g. `https://api.example.com/`) | **signal**    | Cards fetched from that URL  |
| `{{signals}}`                           | **signal**    | Cards from configured beacon |

---

## Supported Notion Blocks

| Block         | How to create       |
|---------------|---------------------|
| Paragraph     | Just type           |
| Heading 1–3   | `#` `##` `###`      |
| Bulleted list | `-` + space         |
| Numbered list | `1.` + space        |
| Quote         | `>` + space         |
| Divider       | `---`               |
| Callout       | `/callout`          |
| **Bold**      | `Ctrl/Cmd + B`      |
| *Italic*      | `Ctrl/Cmd + I`      |
| `Code`        | `Ctrl/Cmd + E`      |
| [Link](url)   | `Ctrl/Cmd + K`      |

---

## Ordering Slides

Use the **Order** number property. Gaps (10, 20, 30) let you insert slides without renumbering everything.

No Order property? Slides sort by creation time.

---

## Editing Content

- Edit page bodies in Notion — changes appear after cache expires (~5 min)
- Redeploy on Vercel to clear cache immediately
- Add/remove slides by adding/deleting database rows
- Reorder by changing Order values

---

## Keyboard Controls

| Key                              | Action              |
|----------------------------------|----------------------|
| `→` `↓` `Space` `Page Down`     | Next slide           |
| `←` `↑` `Page Up`               | Previous slide       |
| `Home`                           | First slide          |
| `End`                            | Last slide           |
| `T`                              | Toggle light/dark    |
| `F`                              | Toggle fullscreen    |

---

## Troubleshooting

| Problem                        | Fix                                                        |
|--------------------------------|------------------------------------------------------------|
| Blank presentation             | Check that pages have content in the body                  |
| Content not updating           | Wait ~5 min for cache, or redeploy on Vercel               |
| Statement renders as paragraph | Content is too long or has block elements — shorten ≤ 140  |
| Signals show "not configured"  | Set `FOGBELL_URL` env var, or paste a URL into the slide   |
| Slides in wrong order          | Check Order property values; ensure no duplicates          |
