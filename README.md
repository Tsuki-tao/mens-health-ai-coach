# MEN'S HEALTH — AI Health & Fitness Coach

A premium, dark-navy health dashboard: Dashboard, My Plan (daily timeline),
Food, Sleep, Workout, Hydration, AI Coach (Thai, mock mode), Health Tips,
Weekly Progress, and Profile — all data-driven and persisted in the browser.

## 1. Project Structure

```
menshealth/
├── index.html          # App shell: sidebar, mobile topbar/bottom nav, view mount point
├── css/
│   └── style.css       # Design tokens, layout, every view's styles, responsive rules
└── js/
    ├── data.js         # Static content: image map, workout library, health tips, day template
    ├── storage.js      # localStorage model ("healthAppData"), date helpers, Store API
    ├── aiService.js    # Mock AI Coach engine (Thai) + documented seam for a real backend
    ├── charts.js       # Chart.js wrappers for sleep / hydration / progress trends
    └── app.js          # Routing + render function per view + all event binding
```

Nothing is bundled — it's plain HTML/CSS/JS plus two CDN libraries
(Chart.js, Lucide icons), so it runs directly in any modern browser.

## 2. How to Run

Just open `index.html` in a browser, or serve the folder locally, e.g.:

```bash
cd menshealth
python3 -m http.server 8080
# then visit http://localhost:8080
```

A local server is only needed if your browser blocks `fetch`/module-style
loading for `file://` pages — this app doesn't use ES modules, so opening
`index.html` directly usually works too.

## 3. How to Change Images

Everything goes through the `imageAssets` object in `js/data.js`:

```js
const imageAssets = {
  workout:  { url: "...", prompt: "..." },
  food:     { url: "...", prompt: "..." },
  sleep:    { url: "...", prompt: "..." },
  lifestyle:{ url: "...", prompt: "..." },
  aiCoach:  { url: "...", prompt: "..." }
};
```

Replace any `url` with your own image (local file path or hosted URL). The
`prompt` field is kept alongside each image so you can regenerate it with
an AI image tool later without hunting through the codebase.

## 4. How to Connect a Real Claude API (instead of Mock AI)

The AI Coach never calls Claude directly and never holds an API key in the
browser. Today it runs `AI_MODE = "mock"` in `js/aiService.js`, which
answers with rule-based Thai responses built from the user's own logged
data (see `buildReply()`).

To go live:

1. **Build a backend endpoint** (Node/Express, Python/FastAPI, etc.) that
   holds `ANTHROPIC_API_KEY` as a server-side environment variable —
   *never* in frontend code. That endpoint should accept
   `POST /api/coach { message, context, history }` and call the Anthropic
   SDK/API using `SYSTEM_PROMPT` (already written out in `aiService.js`)
   as the system prompt.
2. In `js/aiService.js`, set:
   ```js
   const AI_MODE = "live";
   ```
3. `callBackendAI()` in the same file already `fetch()`es
   `/api/coach` and expects `{ reply: "..." }` back — point the URL at
   your real backend if it's hosted elsewhere.
4. No changes are needed in `app.js` — `getAIResponse()` returns the same
   `{ text }` shape in both modes.

**Where the API key goes:** only in your backend's environment/secret
store (e.g. `.env`, a cloud provider's secret manager) — never committed,
never shipped to the browser.

## 5. How to Test LocalStorage

1. Open the site, log a meal, sleep entry, workout, or water intake.
2. Open DevTools → Application (Chrome) / Storage (Firefox) → Local
   Storage → your origin. You'll see one key: `healthAppData`, holding
   `profile`, `dailyPlans` (keyed by date, e.g. `2026-09-14`),
   `chatHistory`, and `settings`.
3. Refresh the page — all data should still be there.
4. Profile → **Reset Data** clears the key entirely and reseeds defaults.

## 6. How to Deploy

Since this is a static site with no server-side code (until you add the
AI backend from step 4), you can deploy the `menshealth/` folder as-is to
any static host:

- **Netlify / Vercel**: drag-and-drop the folder, or connect a Git repo.
- **GitHub Pages**: push to a repo, enable Pages on the `main` branch.
- **Any static bucket** (S3 + CloudFront, Cloudflare Pages, Firebase
  Hosting): upload the folder contents; `index.html` is the entry point.

If you add the real AI backend, deploy that separately (e.g. a small
Node/Express app on Render/Fly.io/Vercel Functions) and point
`callBackendAI()`'s `fetch()` URL at it.

## 7. What Was Verified Before Delivery

- Every nav item (sidebar, mobile bottom nav, hamburger menu) routes correctly.
- Forms (timeline, food, sleep log) add/edit/delete and persist to localStorage.
- Dashboard cards and progress bars update live from logged data.
- Date navigation (Previous/Today/Next) keeps each day's data separate.
- Charts (Sleep 7-day, Hydration 7-day, Progress trend) render from real stored data.
- AI Coach chat keeps context within a session, uses today's data in replies,
  and never claims to give a medical diagnosis.
- Responsive layout checked at desktop, tablet, and mobile widths.
- Empty states appear wherever a section has no data yet.
- Mock AI shows a graceful Thai error message if `getAIResponse()` throws,
  and the rest of the site keeps working regardless.
