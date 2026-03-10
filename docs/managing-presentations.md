# Managing Keel Presentations

A guide for writing, organizing, and presenting content with Keel and Notion.

> **First-time setup?** See [Notion Setup](notion-workspace-setup.md) first.

---

## Writing Notes

Every presentation beat is a **note** — a row in your Notion database. The page body is the content.

1. Add a row to the Notes database
2. Set the **Module** (e.g., "The Landscape")
3. Set the **Order** number (e.g., 10, 20, 30)
4. Open the row and write your content

That's it. Keel infers the visual treatment automatically:

| What you write | How Keel renders it |
|---|---|
| Nothing (empty page) | Visual pause (·) |
| A short sentence | Large statement heading |
| Multiple paragraphs, lists, headings | Body text prose |
| `{{signals}}` | Live FogBell signal cards |

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

## Organizing Modules

Modules are the major sections of your presentation. They come from the **Module** select property on each note.

- To create a new module: add a new option to the Module select
- To reorder modules: adjust the Order numbers so each module's first note is in the right sequence
- Module estimated time: auto-calculated at ~3 minutes per note

### Tips

- Use **Order gaps** (10, 20, 30) so you can insert notes without renumbering
- Drag notes in Notion's database view to visually organize, then update Order numbers to match
- Group your database view by Module for easy management

---

## Multiple Workshops

If you need multiple workshops in one database:

1. Add the optional **Workshop** select property to your Notes database
2. Tag each note with its workshop (e.g., "ai-strategy-2026")
3. Access with: `/?notion=ai-strategy-2026`

If you only have one workshop, skip the Workshop property entirely and use `/?notion`.

---

## Editing Content

- Edit the page body in Notion — changes appear after cache expires (~5 minutes)
- Redeploy on Vercel to clear cache immediately
- Add/remove notes by adding/deleting database rows
- Reorder by changing the Order property

---

## Keyboard Controls

### During module selection

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate modules |
| `Space` | Toggle module on/off |
| `Enter` | Start presentation |
| `T` | Toggle color mode |

### During presentation

| Key | Action |
|-----|--------|
| `→` / `↓` / `Space` / `Page Down` | Next beat |
| `←` / `↑` / `Page Up` | Previous beat |
| `Home` | First beat |
| `End` | Last beat |
| `T` | Toggle light/dark mode |
| `F` | Toggle fullscreen |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank presentation | Check that notes have a Module tag and Order number |
| Content not updating | Wait 5 minutes for cache, or redeploy |
| Module missing | Ensure at least one note has that Module select value |
| Statement renders as prose | Content is too long or has block elements — shorten to ≤ 140 chars |
| Signals show "not configured" | Set `FOGBELL_URL` environment variable |
