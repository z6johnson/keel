# Notion Setup for Keel

Set up a single Notion database to power Keel presentations.

---

## 1. Create the Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name it **`Keel`**, select your workspace, click **Submit**
4. Under **Capabilities**, enable: Read content, Update content, Insert content
5. Copy the secret token (`secret_...`) — this becomes `NOTION_TOKEN`

---

## 2. Create the Notes Database

1. Create a new page in Notion (this page's title becomes your presentation title)
2. Inside it, type `/database` → select **"Database - Inline"**
3. Rename the database to **`Notes`** (or any name you like)

### Add these properties:

| Property | Type | Purpose |
|----------|------|---------|
| Name | Title | Human label for the note (already exists) |
| Module | Select | Which section: "The Landscape", "The Opportunity", etc. |
| Order | Number | Position within the module (use gaps: 10, 20, 30) |
| Workshop | Select | *(Optional)* Only needed if one database holds multiple workshops |

That's it — 3 properties.

### Share with the integration:

1. Click **Share** on the parent page
2. Invite your **Keel** integration with **"Can edit"** access

---

## 3. Write Your Content

Every row in the Notes database is a presentation beat. The page body **is** the content.

### How it works:

- **Open a row as a page** and write using Notion's normal editor
- Keel auto-detects what kind of beat it is from the content:

| Content | Keel renders as |
|---------|----------------|
| Empty page (no body) | **Pause** — a centered dot (·) |
| Short single sentence (≤ 140 chars) | **Statement** — large heading |
| Longer text, lists, headings | **Paragraph** — body prose |
| Page body is exactly `{{signals}}` | **Live signals** — FogBell card grid |

### Reordering:

Set the **Order** number on each note. Use gaps (10, 20, 30) so you can insert notes later without renumbering everything.

### Modules:

Use the **Module** select property to tag each note. Keel groups notes by module and shows a module selector before the presentation begins.

Module order is determined by the lowest Order number in each module. So if "The Landscape" has notes starting at Order 10 and "The Opportunity" starts at Order 100, Landscape comes first.

---

## 4. Beacon Integration

Beacon-generated content works the same way — it's just another note in the database:

1. Beacon writes AI-generated briefing content into a Note page body
2. Tag the note with the appropriate Module
3. Set an Order number
4. Keel picks it up automatically — no special treatment needed

---

## 5. Environment Variables

Set these in your Vercel project settings:

| Variable | Value | Required |
|----------|-------|----------|
| `NOTION_TOKEN` | Integration secret (`secret_...`) | Yes |
| `NOTION_NOTES_DB` | Notes database ID (32-char hex from the database URL) | Yes |
| `FOGBELL_URL` | FogBell API endpoint for live signals | Only if using `{{signals}}` |

### Finding the database ID:

1. Open the Notes database as a full page
2. Look at the URL: `https://www.notion.so/workspace/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX?v=...`
3. The 32-character hex string before `?v=` is the ID
4. Format with hyphens: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`

---

## 6. Access Your Presentation

| Environment | URL |
|-------------|-----|
| Local dev | `http://localhost:5173/?notion` |
| With workshop filter | `http://localhost:5173/?notion=workshop-slug` |
| Production | `https://your-domain.vercel.app/?notion` |
| Static fallback | `http://localhost:5173/` (uses manifest.json) |

Start local dev:

```bash
npm run dev
```

---

## 7. Verification Checklist

- [ ] Notes database has Name, Module, and Order properties
- [ ] Integration has "Can edit" access to the database's parent page
- [ ] `NOTION_TOKEN` and `NOTION_NOTES_DB` are set in Vercel environment variables
- [ ] At least one note exists with a Module tag and content in the page body
- [ ] `/?notion` loads the presentation and shows the module selector
