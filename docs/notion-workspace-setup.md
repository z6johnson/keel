# Notion Workspace Setup — UCSD AI Strategy

Complete GUI-based configuration for the **"UCSD AI Strategy"** Notion workspace (`11a94bc5-c952-81cd-bfb2-00037c214b9f`) to serve as:

- **Ingestion layer** for Beacon (receives intelligence briefings)
- **Publishing layer** for Keel (serves presentation content)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Rename the Workspace](#2-rename-the-workspace)
3. [Create the Notion Integration](#3-create-the-notion-integration)
4. [Build the Page Hierarchy](#4-build-the-page-hierarchy)
5. [Create Database: Beacon Workshops](#5-create-database-beacon-workshops)
6. [Create Database: Presentations](#6-create-database-presentations)
7. [Create Database: Modules](#7-create-database-modules)
8. [Create Database: Beats](#8-create-database-beats)
9. [Connect Databases with Relations](#9-connect-databases-with-relations)
10. [Share Pages with the Integration](#10-share-pages-with-the-integration)
11. [Set Up the Beacon Automation](#11-set-up-the-beacon-automation)
12. [Populate Your First Presentation](#12-populate-your-first-presentation)
13. [Collect Your Database IDs](#13-collect-your-database-ids)
14. [Environment Variable Reference](#14-environment-variable-reference)
15. [Verification Checklist](#15-verification-checklist)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                   Notion Workspace                               │
│  "UCSD AI Strategy"                                              │
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────────────────────┐  │
│  │ Beacon Workshops  │     │ Keel Content                     │  │
│  │ (database)        │     │                                  │  │
│  │                   │     │  ┌──────────────┐                │  │
│  │  Workshop page ◄──┼─ ─ ─  │ Presentations│ (database)     │  │
│  │   └─ briefing     │     │  └──────┬───────┘                │  │
│  │      callout      │     │         │ relation               │  │
│  └──────────────────┘     │  ┌──────▼───────┐                │  │
│                            │  │   Modules    │ (database)     │  │
│          ▲                 │  └──────┬───────┘                │  │
│          │ writes          │         │ relation               │  │
│          │ briefings       │  ┌──────▼───────┐                │  │
│          │                 │  │    Beats      │ (database)     │  │
│          │                 │  │  (page body = │                │  │
│          │                 │  │   markdown)   │                │  │
│          │                 │  └───────────────┘                │  │
│          │                 └──────────────────────────────────┘  │
│          │                            │                          │
└──────────┼────────────────────────────┼──────────────────────────┘
           │                            │
     ┌─────┴─────┐               ┌──────▼──────┐
     │  Beacon   │               │    Keel     │
     │ (serverless)              │  (Vercel    │
     │           │               │   SPA +     │
     │ FogBell → │               │   /api/     │
     │ filter →  │               │   notion)   │
     │ LLM →     │               └─────────────┘
     │ write     │
     └───────────┘
```

**Data flows:**

1. **Beacon → Notion**: User checks "Generate Briefing" on a Workshop page → Notion automation POSTs to Beacon → Beacon fetches FogBell signals, filters for relevance, generates an LLM briefing, and writes a callout block back to that Workshop page.

2. **Notion → Keel**: Keel's `/api/notion?manifest=<slug>` endpoint queries the Presentations → Modules → Beats database chain and dynamically builds a manifest. For each beat with `source.type: "notion"`, Keel calls `/api/notion?beat=<pageId>` to fetch the beat's page body as markdown.

---

## 2. Rename the Workspace

The current name "UCSD AI Strategy" works well. If you want to change it:

1. Click the workspace name in the **top-left corner** of Notion's sidebar
2. Select **Settings & members**
3. Under **Settings** tab → **Workspace** section → **Name** field
4. Type your new name → changes save automatically

**Recommendation**: Keep "UCSD AI Strategy" — both Beacon and Keel reference this workspace by ID, not name.

---

## 3. Create the Notion Integration

You need **one** internal integration that both Beacon and Keel will share.

1. Open [notion.so/my-integrations](https://www.notion.so/my-integrations) (you must be logged in as a workspace admin)
2. Click **"+ New integration"**
3. Configure:
   - **Name**: `Keel + Beacon`
   - **Associated workspace**: Select **"UCSD AI Strategy"**
   - **Logo**: Optional (choose something recognizable)
4. Click **Submit**
5. Under **Capabilities**, ensure ALL of these are checked:
   - **Read content** ✓
   - **Update content** ✓
   - **Insert content** ✓
   - Leave "Read user information" unchecked (not needed)
6. Click **Save changes**
7. Go to the **Secrets** tab → click **Show** → click **Copy**
8. Save this token securely — it starts with `secret_...`
   - This becomes `NOTION_TOKEN` for both Beacon and Keel

---

## 4. Build the Page Hierarchy

Create this exact page structure in the sidebar. Each item below is a **page** (not a database yet — we'll convert inline databases inside them).

1. In the sidebar, click **"+ Add a page"** (or hover over "UCSD AI Strategy" and click **+**)
2. Create a blank page named: **`Beacon`**
3. Create another blank page named: **`Keel Content`**

Your sidebar should now look like:

```
UCSD AI Strategy
├── Beacon
└── Keel Content
```

---

## 5. Create Database: Beacon Workshops

This is the database Beacon reads from and writes briefings into.

1. **Open** the **Beacon** page
2. Type `/database` and select **"Database - Inline"** (this creates a database inside the page)
3. Click on the database title (it says "Untitled") and rename it to: **`Beacon Workshops`**
4. You'll see a default "Name" column already — this is the **Title** property (keep it)

Now add the remaining properties. For each one, click the **+** button to the right of the last column header:

### Property 1: Topic
- Click **+** → name it **`Topic`**
- Click the property type dropdown → select **Text**

### Property 2: Date
- Click **+** → name it **`Date`**
- Click the property type dropdown → select **Date**

### Property 3: Status
- Click **+** → name it **`Status`**
- Click the property type dropdown → select **Select**
- Click into the property → add these options one at a time:
  - `Planning` → click the color dot → choose **Gray**
  - `Prep` → click the color dot → choose **Yellow**
  - `Ready` → click the color dot → choose **Green**
  - `Complete` → click the color dot → choose **Blue**

### Property 4: Generate Briefing
- Click **+** → name it **`Generate Briefing`**
- Click the property type dropdown → select **Checkbox**

### Final schema for Beacon Workshops:

| Property | Type | Purpose |
|---|---|---|
| Name | Title | Workshop name (Beacon uses this as the topic for signal filtering) |
| Topic | Text | Extended description for more precise signal filtering |
| Date | Date | Workshop date |
| Status | Select | Planning / Prep / Ready / Complete |
| Generate Briefing | Checkbox | Trigger — checking this fires the Beacon automation |

---

## 6. Create Database: Presentations

This is the top-level database Keel queries to build a manifest.

1. **Open** the **Keel Content** page
2. Type `/database` and select **"Database - Inline"**
3. Rename it to: **`Presentations`**

### Property 1: Title (already exists as "Name")
- Click the **"Name"** column header → rename it to **`Title`**

### Property 2: Slug
- Click **+** → name it **`Slug`**
- Type: **Text**
- This is the URL-friendly identifier Keel uses to look up a presentation (e.g., `ai-strategy-2026`)

### Final schema for Presentations:

| Property | Type | Purpose |
|---|---|---|
| Title | Title | Presentation display name (e.g., "AI Strategy — UC San Diego") |
| Slug | Text | URL identifier Keel queries (e.g., `ai-strategy-2026`) |

---

## 7. Create Database: Modules

1. Still inside the **Keel Content** page, below the Presentations database
2. Type `/database` and select **"Database - Inline"**
3. Rename it to: **`Modules`**

### Property 1: Title (rename)
- Rename the default "Name" column to **`Title`**

### Property 2: ID
- Click **+** → name it **`ID`**
- Type: **Text**
- This is the module's slug (e.g., `landscape`, `opportunity`, `architecture`, `action`)

### Property 3: Order
- Click **+** → name it **`Order`**
- Type: **Number**
- Format: **Number** (no decimals needed)

### Property 4: Estimated Minutes
- Click **+** → name it **`Estimated Minutes`**
- Type: **Number**
- Format: **Number**

### Final schema for Modules:

| Property | Type | Purpose |
|---|---|---|
| Title | Title | Display title (e.g., "The Landscape") |
| ID | Text | Slug used in manifest sequence (e.g., `landscape`) |
| Order | Number | Sort order within the presentation (1, 2, 3, 4) |
| Estimated Minutes | Number | Reading time estimate |

> The **Presentation** relation will be added in Step 9.

---

## 8. Create Database: Beats

1. Still inside the **Keel Content** page, below the Modules database
2. Type `/database` and select **"Database - Inline"**
3. Rename it to: **`Beats`**

### Property 1: Title (rename)
- Rename the default "Name" column to **`Title`**
- This is a human-readable label for the beat (e.g., "Landscape Opening Statement")

### Property 2: ID
- Click **+** → name it **`ID`**
- Type: **Text**
- The beat's unique identifier (e.g., `l-statement-1`, `o-paragraph-1`)

### Property 3: Role
- Click **+** → name it **`Role`**
- Type: **Select**
- Add these options:
  - `statement`
  - `paragraph`
  - `signal`
  - `breath`
  - `section`

### Property 4: Order
- Click **+** → name it **`Order`**
- Type: **Number**

### Property 5: Caption
- Click **+** → name it **`Caption`**
- Type: **Text**

### Property 6: Source Type
- Click **+** → name it **`Source Type`**
- Type: **Select**
- Add these options:
  - `notion` — content lives in the beat's page body (most common)
  - `api` — content fetched from an external API (e.g., FogBell signals)
  - `file` — legacy, content from a static file
  - `inline` — content stored directly as text

### Property 7: Source URL
- Click **+** → name it **`Source URL`**
- Type: **URL**
- Only used when Source Type = `api` (e.g., `https://api.fogbell.com/api/v1/signals?level=Significant&limit=5`)

### Property 8: Source Transform
- Click **+** → name it **`Source Transform`**
- Type: **Text**
- Only used with `api` source type (e.g., `fogbell`)

### Property 9: Fallback Text
- Click **+** → name it **`Fallback Text`**
- Type: **Text**
- Shown if an API source fails

### Final schema for Beats:

| Property | Type | Purpose |
|---|---|---|
| Title | Title | Human-readable label |
| ID | Text | Unique beat identifier (e.g., `l-statement-1`) |
| Role | Select | statement / paragraph / signal / breath / section |
| Order | Number | Sort position within the module |
| Caption | Text | Optional display caption |
| Source Type | Select | notion / api / file / inline |
| Source URL | URL | API endpoint (when Source Type = api) |
| Source Transform | Text | Transform name for API data (e.g., `fogbell`) |
| Fallback Text | Text | Fallback if API source fails |

> The **Module** relation will be added in Step 9.

**Key concept**: For beats with Source Type = `notion` (or left blank for non-breath beats), the **page body** of the beat's database row IS the content. Write your markdown content directly inside the beat page. Keel fetches the Notion page blocks via `/api/notion?beat=<pageId>` and converts them to markdown.

---

## 9. Connect Databases with Relations

### 9a. Link Modules → Presentations

1. Open the **Modules** database (click into it from the Keel Content page)
2. Click **+** to add a new property
3. Name it **`Presentation`**
4. Type: **Relation**
5. In the relation picker, search for and select **`Presentations`**
6. Choose **"Limit to 1 page"** (each module belongs to exactly one presentation)
7. When asked about a reverse relation, say **Yes** — name the reverse property **`Modules`** (this appears automatically on the Presentations database)

### 9b. Link Beats → Modules

1. Open the **Beats** database
2. Click **+** to add a new property
3. Name it **`Module`**
4. Type: **Relation**
5. Select the **`Modules`** database
6. Choose **"Limit to 1 page"** (each beat belongs to one module)
7. Accept the reverse relation — name it **`Beats`** (appears on the Modules database)

### Resulting relation chain:

```
Presentations  ←──1:N──  Modules  ←──1:N──  Beats
   (has many)              (has many)
```

---

## 10. Share Pages with the Integration

Notion integrations can only access pages explicitly shared with them.

1. Open the **Beacon** page (the parent page containing Beacon Workshops)
2. Click **Share** (top-right corner)
3. In the "Invite" field, type **`Keel + Beacon`** (the integration name from Step 3)
4. Select it → set permission to **"Can edit"**
5. Click **Invite**

6. Open the **Keel Content** page
7. Repeat: **Share** → invite **`Keel + Beacon`** → **"Can edit"** → **Invite**

Sharing a parent page automatically grants access to all child databases and pages within it.

---

## 11. Set Up the Beacon Automation

This makes Notion automatically call Beacon when someone checks the "Generate Briefing" checkbox.

1. Open the **Beacon Workshops** database
2. Click the **⚡ lightning bolt** icon at the top-right of the database (or click **"..."** menu → **Automations**)
3. Click **"+ New automation"**

### Configure the Trigger:
4. Under **"When..."**, click **"Add trigger"**
5. Select **"Property changed"**
6. Choose the property **"Generate Briefing"**

### Add a Condition:
7. Click **"Add condition"**
8. Set it to: **"Generate Briefing"** → **"is"** → **"Checked"** ✓

### Configure the Action:
9. Under **"Do..."**, click **"Add action"**
10. Select **"Send webhook"**
11. Configure the webhook:
    - **URL**: `https://<your-beacon-deployment>.vercel.app/api/briefing/generate`
      (Replace with your actual Beacon deployment URL)
    - **Method**: Leave as POST (default)
    - **Headers**: Click **"+ Add header"**
      - Key: `x-webhook-secret`
      - Value: (your `WEBHOOK_SECRET` value — the same one set in Beacon's environment)
    - **Body**: Select **"Custom"** and enter:
      ```json
      {"pageId": "{{Page ID}}"}
      ```
      Use the template variable picker to insert the actual `Page ID` token if Notion provides one — otherwise type `{{id}}` or `{{Page ID}}` depending on what Notion's automation UI offers.

12. Click **"Save"** (or **"Create"**)

### Test the automation:
13. Create a test row in Beacon Workshops:
    - Name: `Test Workshop`
    - Topic: `artificial intelligence in higher education`
    - Date: today
    - Status: `Planning`
14. Check the **Generate Briefing** checkbox
15. Wait 30-60 seconds — Beacon should:
    - Receive the webhook
    - Fetch and filter signals from FogBell
    - Generate and write a briefing callout back into the page
    - Uncheck the "Generate Briefing" checkbox automatically

---

## 12. Populate Your First Presentation

Here's how to populate the current AI Strategy presentation into the Notion databases.

### 12a. Create the Presentation row

1. Open the **Presentations** database
2. Add a new row:
   - **Title**: `AI Strategy — UC San Diego`
   - **Slug**: `ai-strategy-2026`

### 12b. Create the Module rows

Open the **Modules** database and create these 4 rows:

| Title | ID | Order | Estimated Minutes | Presentation |
|---|---|---|---|---|
| The Landscape | `landscape` | 1 | 60 | AI Strategy — UC San Diego |
| The Opportunity | `opportunity` | 2 | 45 | AI Strategy — UC San Diego |
| The Architecture | `architecture` | 3 | 75 | AI Strategy — UC San Diego |
| What's Next | `action` | 4 | 60 | AI Strategy — UC San Diego |

For the **Presentation** column, click the cell and search for / select the "AI Strategy — UC San Diego" presentation you created.

### 12c. Create the Beat rows

Open the **Beats** database and create rows for each beat. Here is the full set:

**Module: The Landscape (select "The Landscape" in the Module relation)**

| Title | ID | Role | Order | Source Type | Notes |
|---|---|---|---|---|---|
| Opening Breath | `l-breath-open` | breath | 1 | *(leave blank)* | No content needed |
| Landscape Opening | `l-statement-1` | statement | 2 | notion | Write content in page body |
| Landscape Context | `l-paragraph-1` | paragraph | 3 | notion | Write content in page body |
| Live Signals | `l-signals` | signal | 4 | api | See details below |
| Closing Breath | `l-breath-close` | breath | 5 | *(leave blank)* | No content needed |

For the **Live Signals** beat specifically:
- Source Type: `api`
- Source URL: `https://api.fogbell.com/api/v1/signals?level=Significant&limit=5`
- Source Transform: `fogbell`
- Caption: `Live signals from FogBell`
- Fallback Text: `Signal data is temporarily unavailable.`

**Module: The Opportunity**

| Title | ID | Role | Order | Source Type |
|---|---|---|---|---|
| Opportunity Opening | `o-statement-1` | statement | 1 | notion |
| Opportunity Detail | `o-paragraph-1` | paragraph | 2 | notion |
| Strategy Statement | `o-statement-2` | statement | 3 | *(inline)* |
| Opportunity Breath | `o-breath` | breath | 4 | *(leave blank)* |

For "Strategy Statement": Open the beat page and type the content directly:
> Strategy is a design problem.

**Module: The Architecture**

| Title | ID | Role | Order | Source Type |
|---|---|---|---|---|
| Architecture Opening | `a-statement-1` | statement | 1 | notion |
| Architecture Detail | `a-paragraph-1` | paragraph | 2 | notion |
| Primitives Statement | `a-statement-2` | statement | 3 | *(inline)* |
| Architecture Breath | `a-breath` | breath | 4 | *(leave blank)* |

For "Primitives Statement" page body:
> Build the primitives. Compose the solutions.

**Module: What's Next**

| Title | ID | Role | Order | Source Type |
|---|---|---|---|---|
| Action Detail | `x-paragraph-1` | paragraph | 1 | notion |
| Build Statement | `x-statement-1` | statement | 2 | *(inline)* |
| Final Breath | `x-breath` | breath | 3 | *(leave blank)* |

For "Build Statement" page body:
> Let's build.

### 12d. Write beat content in page bodies

For every beat with Source Type = `notion`, click into the beat row to open it as a page and write the content using Notion's normal editor. Use:
- **Headings** for `## Section Title`
- **Paragraphs** for body text
- **Bulleted lists** for bullet points
- **Quotes** for `> blockquotes`
- **Dividers** for `---`

Keel's API converts these Notion blocks into markdown automatically.

---

## 13. Collect Your Database IDs

Keel needs the database IDs as environment variables.

For each database:

1. Open the database in **full page view** (click the ↗️ icon or "Open as full page")
2. Look at the URL in your browser — it will look like:
   ```
   https://www.notion.so/your-workspace/1234567890abcdef1234567890abcdef?v=...
   ```
3. The **32-character hex string** before the `?v=` is the database ID
4. Format it with hyphens: `12345678-90ab-cdef-1234-567890abcdef`

Do this for all three Keel databases:
- **Presentations** → `NOTION_PRESENTATIONS_DB`
- **Modules** → `NOTION_MODULES_DB`
- **Beats** → `NOTION_BEATS_DB`

---

## 14. Environment Variable Reference

### Keel (Vercel project)

Set these in Vercel Dashboard → your Keel project → **Settings** → **Environment Variables**:

| Variable | Value | Example |
|---|---|---|
| `NOTION_TOKEN` | Integration secret from Step 3 | `secret_abc123...` |
| `NOTION_PRESENTATIONS_DB` | Presentations database ID | `12a34b56-...` |
| `NOTION_MODULES_DB` | Modules database ID | `78c90d12-...` |
| `NOTION_BEATS_DB` | Beats database ID | `34e56f78-...` |

### Beacon (Vercel project)

Set these in Vercel Dashboard → your Beacon project → **Settings** → **Environment Variables**:

| Variable | Value | Example |
|---|---|---|
| `NOTION_TOKEN` | Same integration secret from Step 3 | `secret_abc123...` |
| `NOTION_WORKSPACE_PAGE_ID` | The Beacon page ID (parent of Beacon Workshops DB) | `11a94bc5-c952-81cd-bfb2-00037c214b9f` |
| `WEBHOOK_SECRET` | A strong random string (you generate this) | `whsec_a1b2c3d4...` |
| `FOGBELL_API_URL` | FogBell API base URL | `https://api.fogbell.news` |
| `FOGBELL_EMAIL` | FogBell login email | *(your credentials)* |
| `FOGBELL_PASSWORD` | FogBell login password | *(your credentials)* |
| `LITELLM_BASE_URL` | LiteLLM proxy URL | *(your proxy URL)* |
| `LITELLM_API_KEY` | LiteLLM API key | *(your key)* |

---

## 15. Verification Checklist

After setup, verify everything works:

### Notion structure
- [ ] Workspace has two top-level pages: **Beacon** and **Keel Content**
- [ ] **Beacon Workshops** database exists inside the Beacon page with 5 properties
- [ ] **Presentations** database exists inside Keel Content with 2 properties
- [ ] **Modules** database exists inside Keel Content with 5 properties (including Presentation relation)
- [ ] **Beats** database exists inside Keel Content with 10 properties (including Module relation)
- [ ] Relations are correctly linked: Presentations ← Modules ← Beats

### Integration access
- [ ] The `Keel + Beacon` integration has "Can edit" access to both **Beacon** and **Keel Content** pages
- [ ] The integration token (`secret_...`) is saved in both Keel and Beacon environment variables

### Beacon flow
- [ ] Beacon Workshops automation is configured and active
- [ ] Checking "Generate Briefing" on a workshop row triggers the webhook
- [ ] Beacon writes a briefing callout block back to the workshop page
- [ ] The checkbox is automatically unchecked after briefing delivery

### Keel flow
- [ ] At least one Presentation row exists with a Slug
- [ ] Modules are linked to the Presentation via the relation property
- [ ] Beats are linked to Modules via the relation property
- [ ] Beat pages with Source Type = `notion` have content in their page bodies
- [ ] Hitting `/api/notion?manifest=<slug>` returns a valid manifest JSON
- [ ] Hitting `/api/notion?beat=<pageId>` returns markdown content
