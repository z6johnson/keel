# Managing Presentations

> **First-time setup?** See [Notion Workspace Setup](notion-workspace-setup.md) or run `npm run notion:setup`.

---

## Writing Slides

Each sub-page inside your presentation page is a slide. The page body is the content.

1. Open your presentation page in Notion
2. Create a sub-page
3. Write your content

Keel infers the visual treatment:

| What you write                       | Role          | Visual treatment            |
|--------------------------------------|---------------|-----------------------------|
| Nothing (empty page)                 | **breath**    | Centered pause dot ( · )    |
| A short sentence ( ≤ 140 chars )     | **statement** | Large display heading       |
| Multiple paragraphs, lists, headings | **paragraph** | Body prose                  |
| A URL or `{{signals}}`               | **signal**    | Cards fetched from that URL |

---

## Ordering Slides

Drag sub-pages to reorder them in Notion. Keel uses the order they appear in the page.

---

## Editing Content

- Edit page bodies in Notion — changes appear after cache expires (~5 min)
- Redeploy on Vercel to clear cache immediately
- Add/remove slides by adding/deleting sub-pages
- Reorder by dragging sub-pages

---

## Supported Notion Blocks

| Block         | How to create  |
|---------------|----------------|
| Paragraph     | Just type      |
| Heading 1–3   | `#` `##` `###` |
| Bulleted list | `-` + space    |
| Numbered list | `1.` + space   |
| Quote         | `>` + space    |
| Divider       | `---`          |
| Callout       | `/callout`     |
| **Bold**      | `Ctrl/Cmd + B` |
| *Italic*      | `Ctrl/Cmd + I` |
| `Code`        | `Ctrl/Cmd + E` |
| [Link](url)   | `Ctrl/Cmd + K` |

---

## Keyboard Controls

| Key                          | Action           |
|------------------------------|------------------|
| `→` `↓` `Space` `Page Down` | Next slide       |
| `←` `↑` `Page Up`           | Previous slide   |
| `Home`                       | First slide      |
| `End`                        | Last slide       |
| `T`                          | Toggle light/dark|
| `F`                          | Toggle fullscreen|

---

## Troubleshooting

| Problem                        | Fix                                                       |
|--------------------------------|-----------------------------------------------------------|
| Blank presentation             | Check that sub-pages have content in the body             |
| Content not updating           | Wait ~5 min for cache, or redeploy on Vercel              |
| Statement renders as paragraph | Content is too long or has block elements — shorten ≤ 140 |
| Signals show "not configured"  | Set `FOGBELL_URL` env var, or paste a URL into the slide  |
