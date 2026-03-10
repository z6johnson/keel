# Notion Workspace Setup

One page = one presentation. Sub-pages inside it = slides.

---

## Quick Start (Automated)

```bash
NOTION_TOKEN=ntn_... npm run notion:setup
```

Creates a presentation page with starter slides. Outputs the `NOTION_PAGE_ID` you need.

---

## Manual Setup

### 1. Create the Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name it **Keel**, enable **Read content**, click **Submit**
4. Copy the token (`ntn_...`) — this is your `NOTION_TOKEN`

### 2. Create the Presentation

1. Create a page in Notion (e.g., "Q3 Strategy") — this is your presentation
2. Inside it, create sub-pages — each one is a slide
3. Drag sub-pages to reorder them
4. **Share** the parent page with the Keel integration ("Can view")

That's it. No database, no properties, no schema.

---

## Slide Roles

Keel infers each slide's role from its page body:

| Page content                    | Role          | Rendered as                 |
|---------------------------------|---------------|-----------------------------|
| Empty page                      | **breath**    | Centered pause dot ( · )    |
| Short text ( ≤ 140 chars )      | **statement** | Large display heading       |
| Longer text, lists, headings    | **paragraph** | Body prose                  |
| A URL or `{{signals}}`          | **signal**    | Cards fetched from that URL |

---

## Environment Variables

| Variable         | Value                         | Required               |
|------------------|-------------------------------|------------------------|
| `NOTION_PAGE_ID` | Parent page ID (from the URL) | Yes                    |
| `NOTION_TOKEN`   | Integration token (`ntn_...`) | Yes                    |
| `FOGBELL_URL`    | Default signal API endpoint   | Only for `{{signals}}` |

### Finding the page ID

Open the parent page in Notion. The URL looks like:

```
https://www.notion.so/workspace/Page-Title-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

The 32-character hex string at the end is the page ID.

---

## Accessing the Presentation

| Environment     | URL                                      |
|-----------------|------------------------------------------|
| Local dev       | `http://localhost:3000/?notion`           |
| Production      | `https://your-domain.vercel.app/?notion`  |
| Static fallback | `http://localhost:3000/` (manifest.json)  |

```bash
npm run dev
```

---

## Verification Checklist

- [ ] Parent page has sub-pages (slides) inside it
- [ ] Integration has "Can view" access to the parent page
- [ ] `NOTION_TOKEN` and `NOTION_PAGE_ID` are set
- [ ] `/?notion` loads and shows the first slide
