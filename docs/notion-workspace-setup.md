# Notion Workspace Setup

Configure a Notion database as the content source for Keel. One page = one slide.

---

## Quick Start (Automated)

Run the setup script to create the database and starter slides automatically:

```bash
NOTION_TOKEN=ntn_... node scripts/notion-setup.mjs
```

Or target an existing parent page:

```bash
NOTION_TOKEN=ntn_... node scripts/notion-setup.mjs --parent PAGE_ID
```

The script outputs the `NOTION_NOTES_DB` value you need. Skip to [Environment Variables](#environment-variables).

---

## Manual Setup

### 1. Create the Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name it **Keel**, select your workspace, click **Submit**
4. Enable **Read content** under Capabilities
5. Copy the token (`ntn_...`) — this is your `NOTION_TOKEN`

### 2. Create the Database

Create a new Notion page, then add an inline database (`/database`).

| Property | Type   | Purpose                    |
|----------|--------|----------------------------|
| Name     | Title  | Label for your own use     |
| Order    | Number | Sort position (10, 20, 30) |

Two properties. If you omit Order, slides sort by creation time.

**Share with the integration:** Click Share on the parent page, invite **Keel** with "Can view" access.

---

## Slide Roles

Every database row is a slide. Keel infers the role from the page body:

| Page content                     | Role          | Rendered as                  |
|----------------------------------|---------------|------------------------------|
| Empty page                       | **breath**    | Centered pause dot ( · )     |
| Short text ( ≤ 140 characters )  | **statement** | Large display heading        |
| Longer text, lists, headings     | **paragraph** | Body prose                   |
| A URL or `{{signals}}`           | **signal**    | Cards fetched from that URL  |

### Role inference rules

1. Empty body → `breath`
2. Body is `{{signals}}` or a bare URL → `signal`
3. Body contains block-level markdown (headings, lists, quotes, rules) → `paragraph`
4. Body has multiple paragraphs → `paragraph`
5. Body ≤ 140 characters → `statement`
6. Everything else → `paragraph`

---

## Environment Variables

Set in Vercel project settings (or `.env` for local dev):

| Variable         | Value                              | Required                  |
|------------------|------------------------------------|---------------------------|
| `NOTION_TOKEN`   | Integration token (`ntn_...`)      | Yes                       |
| `NOTION_NOTES_DB`| Database ID (32-char hex from URL) | Yes                       |
| `FOGBELL_URL`    | Default signal API endpoint        | Only for `{{signals}}`    |

### Finding the database ID

1. Open the database as a full page
2. URL: `https://www.notion.so/workspace/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX?v=...`
3. The 32-character hex string before `?v=` is the ID

---

## Front-End Architecture

The Notion API handler (`api/notion.ts`) returns a manifest consumed by the front end:

```
Notion DB → api/notion?manifest → { title, slides[], fogbellUrl? }
                                         ↓
                                   main.ts (boot)
                                         ↓
                              engine ←→ renderer
                                         ↓
                              #stage > .slide-layer (crossfade)
                                         ↓
                              .slide--statement | .slide--paragraph
                              .slide--signal    | .slide--breath
```

- **`#stage`** — viewport containing two `.slide-layer` elements for crossfade transitions
- **`engine`** — manages slide index, caching, navigation, color mode
- **`renderer`** — swaps layers, builds slide HTML by role

---

## Accessing the Presentation

| Environment    | URL                                       |
|----------------|-------------------------------------------|
| Local dev      | `http://localhost:3000/?notion`            |
| Production     | `https://your-domain.vercel.app/?notion`  |
| Static fallback| `http://localhost:3000/` (manifest.json)  |

```bash
npm run dev
```

---

## Verification Checklist

- [ ] Database has **Name** and **Order** properties
- [ ] Integration has "Can view" access to the database's parent page
- [ ] `NOTION_TOKEN` and `NOTION_NOTES_DB` are set
- [ ] At least one page has content in its body
- [ ] `/?notion` loads and shows the first slide
