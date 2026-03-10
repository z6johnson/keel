# Notion Setup for Keel

Set up a Notion database to power Keel presentations. One page per slide.

---

## 1. Create the Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name it **`Keel`**, select your workspace, click **Submit**
4. Under **Capabilities**, enable: Read content
5. Copy the secret token (`secret_...`) — this becomes `NOTION_TOKEN`

---

## 2. Create the Workshop Database

1. Create a new page in Notion (the database title becomes your presentation title)
2. Inside it, type `/database` → select **"Database - Inline"**

### Properties:

| Property | Type | Purpose |
|----------|------|---------|
| Name | Title | Label for your own navigation in Notion |
| Order | Number | Sort position (use gaps: 10, 20, 30) |

That's it — two properties. If you omit Order, slides sort by creation time.

### Share with the integration:

1. Click **Share** on the parent page
2. Invite your **Keel** integration with **"Can view"** access

---

## 3. Write Your Slides

Every row in the database is a slide. Open a row as a page and write — Keel auto-detects what kind of slide it is:

| What you write | What Keel shows |
|----------------|-----------------|
| Nothing (empty page) | **Breath** — a centered pause dot (·) |
| A short sentence (≤ 140 chars) | **Statement** — large heading |
| Longer text, lists, headings | **Paragraph** — body prose |
| A URL (e.g. `https://api.example.com/signals`) | **Signal cards** — fetched from that URL |
| `{{signals}}` | **Signal cards** — fetched from configured beacon |

### Reordering:

Set the **Order** number on each page. Use gaps (10, 20, 30) so you can insert slides later without renumbering.

---

## 4. Beacon / Agent Integration

Beacon or agent-generated content works the same way — it's just another page in the database:

1. Write content into a page body (or paste a signal URL)
2. Set an Order number
3. Keel picks it up automatically

---

## 5. Environment Variables

Set these in your Vercel project settings:

| Variable | Value | Required |
|----------|-------|----------|
| `NOTION_TOKEN` | Integration secret (`secret_...`) | Yes |
| `NOTION_NOTES_DB` | Database ID (32-char hex from the database URL) | Yes |
| `FOGBELL_URL` | Default signal API endpoint | Only if using `{{signals}}` |

### Finding the database ID:

1. Open the database as a full page
2. Look at the URL: `https://www.notion.so/workspace/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX?v=...`
3. The 32-character hex string before `?v=` is the ID
4. Format with hyphens: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`

---

## 6. Access Your Presentation

| Environment | URL |
|-------------|-----|
| Local dev | `http://localhost:3000/?notion` |
| Production | `https://your-domain.vercel.app/?notion` |
| Static fallback | `http://localhost:3000/` (uses manifest.json) |

Start local dev:

```bash
npm run dev
```

---

## 7. Verification Checklist

- [ ] Database has Name and Order properties
- [ ] Integration has access to the database's parent page
- [ ] `NOTION_TOKEN` and `NOTION_NOTES_DB` are set in environment variables
- [ ] At least one page exists with content in the body
- [ ] `/?notion` loads the presentation and goes straight to the first slide
