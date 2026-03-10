# Managing Keel Presentations in Notion

A practical guide for creating, editing, and managing presentations after your Notion workspace is configured.

> **First-time setup?** See [Notion Workspace Setup](notion-workspace-setup.md) to create the databases and integration before using this guide.

---

## Table of Contents

1. [How Presentations Work](#1-how-presentations-work)
2. [Creating a New Presentation](#2-creating-a-new-presentation)
3. [Managing Modules](#3-managing-modules)
4. [Managing Beats](#4-managing-beats)
5. [Beat Roles](#5-beat-roles)
6. [Content Source Types](#6-content-source-types)
7. [Writing Beat Content in Notion](#7-writing-beat-content-in-notion)
8. [Editing an Existing Presentation](#8-editing-an-existing-presentation)
9. [Duplicating a Presentation](#9-duplicating-a-presentation)
10. [Deleting a Presentation](#10-deleting-a-presentation)
11. [Testing and Previewing](#11-testing-and-previewing)
12. [Keyboard Controls](#12-keyboard-controls)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. How Presentations Work

A Keel presentation is a three-level hierarchy stored across three Notion databases:

```
Presentations  ←──1:N──  Modules  ←──1:N──  Beats
```

- **Presentation** — The top-level container with a title and a URL slug.
- **Module** — A thematic section (e.g., "The Landscape") containing an ordered list of beats. Each module has an estimated duration shown during module selection.
- **Beat** — A single unit of content displayed on screen. Beats have a *role* that controls visual styling and a *source type* that determines where content comes from.

When a user opens Keel with `?notion=<slug>`, the system:

1. Queries the Presentations database for a matching Slug
2. Fetches all Modules linked to that presentation, sorted by Order
3. Fetches all Beats linked to those modules, sorted by Order
4. Assembles everything into a manifest and begins the presentation

---

## 2. Creating a New Presentation

### Step 1: Add a Presentation row

Open the **Presentations** database in Notion and add a new row:

| Property | Value | Example |
|----------|-------|---------|
| **Title** | Display name for the presentation | `AI Strategy — UC San Diego` |
| **Slug** | URL-friendly identifier (lowercase, hyphens, no spaces) | `ai-strategy-2026` |

**Slug conventions:**
- Use lowercase letters, numbers, and hyphens only
- Keep it short and descriptive
- Must be unique across all presentations
- This is what appears in the URL: `?notion=ai-strategy-2026`

### Step 2: Access the presentation

Once you add modules and beats (see below), the presentation is accessible at:

- **Local dev:** `http://localhost:5173/?notion=<slug>`
- **Production:** `https://<your-domain>/?notion=<slug>`

---

## 3. Managing Modules

Modules are the major sections of your presentation. The audience selects which modules to include before the presentation begins, and sees a total estimated duration.

### Creating a module

Open the **Modules** database and add a new row:

| Property | Value | Notes |
|----------|-------|-------|
| **Title** | Display name | `The Landscape` |
| **ID** | Slug identifier | `landscape` — lowercase, no spaces |
| **Order** | Sort position | `1`, `2`, `3`, etc. |
| **Estimated Minutes** | Duration estimate | `60` |
| **Presentation** | Relation to parent | Select the presentation this module belongs to |

### ID naming conventions

Module IDs are short slugs used internally. Use lowercase words separated by hyphens:

- `landscape`
- `opportunity`
- `architecture`
- `action`

### Reordering modules

Change the **Order** property values. Keel sorts modules by Order ascending when building the presentation sequence. Gaps are fine (e.g., `10, 20, 30`) — this makes it easy to insert new modules later without renumbering.

---

## 4. Managing Beats

Beats are the individual screens shown during the presentation. Each beat has a role that controls how it looks and a source type that controls where its content comes from.

### Creating a beat

Open the **Beats** database and add a new row:

| Property | Required | Value |
|----------|----------|-------|
| **Title** | Yes | Human-readable label (e.g., `Landscape Opening Statement`) |
| **ID** | Yes | Unique identifier (e.g., `l-statement-1`) |
| **Role** | Yes | `statement`, `paragraph`, `signal`, `breath`, or `section` |
| **Order** | Yes | Sort position within the module (`1`, `2`, `3`, etc.) |
| **Source Type** | Yes* | `notion`, `api`, `inline`, or `file` (leave blank for `breath` beats) |
| **Module** | Yes | Relation to the parent module |
| **Caption** | No | Text shown below the beat content |
| **Source URL** | No | API endpoint (only for `api` source type) |
| **Source Transform** | No | Transform name for API data (e.g., `fogbell`) |
| **Fallback Text** | No | Shown if an API source fails |

### ID naming conventions

Beat IDs follow the pattern: `<module-prefix>-<role>-<number>`

| Module | Prefix | Example IDs |
|--------|--------|-------------|
| The Landscape | `l` | `l-breath-open`, `l-statement-1`, `l-paragraph-1` |
| The Opportunity | `o` | `o-statement-1`, `o-paragraph-1` |
| The Architecture | `a` | `a-statement-1`, `a-paragraph-1` |
| What's Next | `x` | `x-paragraph-1`, `x-statement-1` |

This convention is not enforced — IDs just need to be unique — but it makes the manifest readable.

### Reordering beats

Change the **Order** property values within a module. Like modules, gaps are fine (e.g., `10, 20, 30`).

---

## 5. Beat Roles

Each beat's **Role** determines its visual presentation:

| Role | Visual Style | Typical Use |
|------|-------------|-------------|
| **statement** | Large centered heading (`h1`) | Key messages, thesis statements, provocative claims |
| **paragraph** | Body text in a prose container | Explanations, context, narrative |
| **signal** | Grid of signal cards | Live data from APIs (e.g., FogBell intelligence signals) |
| **breath** | Centered dot (·) | Visual pause between ideas — no content needed |
| **section** | Medium heading (`h2`) | Auto-generated transition slides between modules |

**Notes:**
- **statement** beats render as an `h1` when the content is a single paragraph. If the content contains headings, lists, or other block elements, it renders as styled prose instead.
- **breath** beats require no content — leave Source Type blank and don't add page body content.
- **section** beats are automatically inserted by Keel between modules at presentation time. You generally don't need to create them manually.

---

## 6. Content Source Types

The **Source Type** property on each beat controls where content comes from:

### `notion` (most common)

Content is written directly in the beat's Notion page body. Keel fetches the page blocks via its API and converts them to markdown.

- Set **Source Type** to `notion`
- Open the beat row as a page and write content using Notion's editor
- See [Writing Beat Content in Notion](#7-writing-beat-content-in-notion) for supported block types

### `api`

Content is fetched from an external API at presentation time.

- Set **Source Type** to `api`
- Set **Source URL** to the API endpoint
- Optionally set **Source Transform** (e.g., `fogbell` for FogBell signal data)
- Optionally set **Fallback Text** — displayed if the API call fails

**Example — FogBell signals beat:**

| Property | Value |
|----------|-------|
| Source Type | `api` |
| Source URL | `https://api.fogbell.com/api/v1/signals?level=Significant&limit=5` |
| Source Transform | `fogbell` |
| Caption | `Live signals from FogBell` |
| Fallback Text | `Signal data is temporarily unavailable.` |

### `inline`

Content is stored directly in the beat's page body as plain text, without Notion block processing. Use this for short, simple text like single-line statements.

### `file`

Legacy source type — loads content from a static markdown file in Keel's `/content/` directory. Prefer `notion` for new beats.

### No source type (breath beats)

Leave Source Type blank for `breath` beats. They render as a centered dot and require no content.

---

## 7. Writing Beat Content in Notion

For beats with Source Type = `notion`, the page body **is** the content. Open the beat row as a full page and write using Notion's editor.

### Supported Notion block types

Keel's API converts these Notion blocks to markdown:

| Notion Block | Markdown Output | How to Create in Notion |
|-------------|----------------|------------------------|
| Paragraph | Plain text | Just type normally |
| Heading 1 | `# Heading` | Type `/h1` or `#` + space |
| Heading 2 | `## Heading` | Type `/h2` or `##` + space |
| Heading 3 | `### Heading` | Type `/h3` or `###` + space |
| Bulleted list | `- Item` | Type `-` + space |
| Numbered list | `1. Item` | Type `1.` + space |
| Quote | `> Quoted text` | Type `/quote` or `>` + space |
| Divider | `---` | Type `/divider` or `---` |
| Callout | Plain text (icon stripped) | Type `/callout` |

### Rich text formatting

Within any block, these inline styles are preserved:

| Format | Notion Shortcut | Rendered As |
|--------|----------------|-------------|
| **Bold** | `Ctrl/Cmd + B` | `**bold**` |
| *Italic* | `Ctrl/Cmd + I` | `*italic*` |
| `Code` | `Ctrl/Cmd + E` | `` `code` `` |
| [Link](url) | `Ctrl/Cmd + K` | `[text](url)` |

### Tips for beat content

- **Statement beats**: Keep content to a single short sentence or phrase. Statements render as large headings — long text won't look right.
- **Paragraph beats**: Multiple paragraphs, lists, and headings all work well here.
- **Avoid unsupported blocks**: Images, embeds, tables, toggles, and code blocks are not converted — they will be silently skipped.
- **Test as you write**: Use the preview workflow (see [Testing and Previewing](#11-testing-and-previewing)) to verify rendering.

---

## 8. Editing an Existing Presentation

### Changing the title

Edit the **Title** property in the Presentations database row. The change takes effect after the API cache expires (up to 5 minutes).

### Changing the slug

Edit the **Slug** property. This changes the URL — update any shared links. The old slug will return a 404.

### Adding a new module

1. Add a row to the Modules database
2. Fill in Title, ID, Order, Estimated Minutes
3. Set the Presentation relation to the target presentation
4. Add beat rows for the new module

### Removing a module

1. Delete all beat rows linked to the module first
2. Delete the module row
3. Remaining modules don't need renumbering — Order gaps are fine

### Reordering modules

Update the **Order** values on the module rows.

### Adding a new beat

1. Add a row to the Beats database
2. Fill in Title, ID, Role, Order, Source Type
3. Set the Module relation
4. If Source Type is `notion`, open the row as a page and write content

### Removing a beat

Delete the beat row from the Beats database.

### Editing beat content

Open the beat row as a page in Notion and edit the page body. Changes are reflected in Keel after the API cache expires.

### Cache behavior

Keel caches API responses for **5 minutes** (`Cache-Control: s-maxage=300, stale-while-revalidate=60`). After editing content in Notion:

- Wait up to 5 minutes for changes to appear
- Or redeploy the Vercel project to clear the cache immediately

---

## 9. Duplicating a Presentation

To create a copy of an existing presentation:

1. **Duplicate the Presentation row** in the Presentations database
   - Update the **Title** to a new name
   - Set a new unique **Slug**

2. **Duplicate all Module rows** linked to the original presentation
   - For each duplicated module, update the **Presentation** relation to point to the new presentation
   - Keep the same ID, Order, and Estimated Minutes (or adjust as needed)

3. **Duplicate all Beat rows** for each module
   - Update the **Module** relation on each beat to point to the corresponding new module
   - Page body content is copied automatically when you duplicate a Notion database row

> **Note:** Notion's built-in "Duplicate" on database rows copies all properties and page content. You only need to update the relation properties to re-link to the new parent.

---

## 10. Deleting a Presentation

Delete in bottom-up order to keep relations clean:

1. Delete all **Beat** rows linked to the presentation's modules
2. Delete all **Module** rows linked to the presentation
3. Delete the **Presentation** row

---

## 11. Testing and Previewing

### View the full presentation

| Environment | URL |
|-------------|-----|
| Local dev | `http://localhost:5173/?notion=<slug>` |
| Production | `https://<your-domain>/?notion=<slug>` |

Start local dev with:

```bash
npm run dev
```

### Inspect the raw manifest

Hit the manifest endpoint directly to see the JSON structure Keel builds from your Notion data:

```
/api/notion?manifest=<slug>
```

This returns the full manifest with all modules and beats. Check for:
- Correct module ordering
- All beats present with correct roles
- Source types and page IDs populated correctly

### Inspect a single beat's content

Hit the beat endpoint with a Notion page ID to see the converted markdown:

```
/api/notion?beat=<pageId>
```

You can find a beat's page ID from the manifest JSON (the `pageId` field in each beat's `source` object) or from the Notion URL when you open the beat as a page.

---

## 12. Keyboard Controls

During a presentation:

| Key | Action |
|-----|--------|
| `→` / `↓` / `Space` / `Page Down` | Next beat |
| `←` / `↑` / `Page Up` | Previous beat |
| `Home` | Jump to first beat |
| `End` | Jump to last beat |
| `T` | Toggle light/dark mode |
| `F` | Toggle fullscreen |

During module selection:

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate modules |
| `Space` | Toggle module on/off |
| `Enter` | Start presentation |

---

## 13. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "Presentation not found" (404) | Slug doesn't match any Presentations row | Check the **Slug** property matches the URL parameter exactly (case-sensitive) |
| Beats missing from a module | Beat rows not linked or not ordered | Verify each beat's **Module** relation is set and **Order** has a value |
| Module missing from presentation | Module not linked to presentation | Verify the module's **Presentation** relation is set |
| Content not updating | API cache (5 minutes) | Wait for cache expiry or redeploy to clear |
| Beat shows empty | Source Type is `notion` but page body is empty | Open the beat as a page and add content |
| Formatting looks wrong | Unsupported Notion block type | Use only supported blocks (paragraphs, headings, lists, quotes, dividers, callouts) |
| API beat shows fallback text | External API is unreachable | Check the **Source URL** is correct; verify the API is operational |
| API beat shows "No signals available" | No fallback text set and API failed | Add **Fallback Text** to the beat properties |
| Statement text is too small | Content has block elements (headings, lists) | Statement beats render as `h1` only for single paragraphs — simplify the content or use `paragraph` role instead |
