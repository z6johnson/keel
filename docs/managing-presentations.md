# Managing Keel Presentations

A guide for writing, organizing, and presenting with Keel and Notion.

> **First-time setup?** See [Notion Setup](notion-workspace-setup.md) first.

---

## Writing Slides

Every slide is a **page** — a row in your Notion database. The page body is the content.

1. Add a row to the Workshop database
2. Set the **Order** number (e.g., 10, 20, 30)
3. Open the row and write your content

That's it. Keel infers the visual treatment automatically:

| What you write | How Keel renders it |
|---|---|
| Nothing (empty page) | Visual pause (·) |
| A short sentence | Large statement heading |
| Multiple paragraphs, lists, headings | Body text prose |
| A URL (e.g. `https://api.example.com/data`) | Signal cards fetched from that URL |
| `{{signals}}` | Signal cards from configured beacon |

### Supported Notion blocks

| Block | How to create |
|-------|---------------|
| Paragraph | Just type |
| Heading 1–3 | `#`, `##`, `###` + space |
| Bulleted list | `-` + space |
| Numbered list | `1.` + space |
| Quote | `>` + space |
| Divider | `---` |
| Callout | `/callout` |
| **Bold** | `Ctrl/Cmd + B` |
| *Italic* | `Ctrl/Cmd + I` |
| `Code` | `Ctrl/Cmd + E` |
| [Link](url) | `Ctrl/Cmd + K` |

---

## Ordering Slides

Use the **Order** number property to control slide sequence. Use gaps (10, 20, 30) so you can insert slides without renumbering.

If you omit the Order property, slides sort by creation time.

---

## Editing Content

- Edit the page body in Notion — changes appear after cache expires (~5 minutes)
- Redeploy on Vercel to clear cache immediately
- Add/remove slides by adding/deleting database rows
- Reorder by changing the Order property

---

## Keyboard Controls

| Key | Action |
|-----|--------|
| `→` / `↓` / `Space` / `Page Down` | Next slide |
| `←` / `↑` / `Page Up` | Previous slide |
| `Home` | First slide |
| `End` | Last slide |
| `T` | Toggle light/dark mode |
| `F` | Toggle fullscreen |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank presentation | Check that pages have content in the body |
| Content not updating | Wait 5 minutes for cache, or redeploy |
| Statement renders as prose | Content is too long or has block elements — shorten to ≤ 140 chars |
| Signals show "not configured" | Set `FOGBELL_URL` env var, or paste a URL directly into the slide |
