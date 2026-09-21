# MEN'S HEALTH — AI Health & Fitness Coach

A premium, dark-navy health dashboard: Dashboard, My Plan (daily timeline),
Food, Sleep, Workout, Hydration, AI Coach (Thai, mock mode), Health Tips,
Weekly Progress, and Profile — all data-driven and persisted in the browser.

## 1. Project Structure (flat — GitHub Pages ready)

```
/  (repo root)
├── index.html
├── style.css
├── data.js         # Static content: image map, workout library, health tips, day template
├── storage.js       # localStorage model ("healthAppData"), date helpers, Store API
├── aiService.js      # Mock AI Coach engine (Thai) + documented seam for a real backend
├── charts.js          # Chart.js wrappers for sleep / hydration / progress trends
├── app.js               # Routing + render function per view + all event binding
├── README.md
└── images/
    ├── workout-1.jpg      # Deadlift — Dashboard & Workout hero
    ├── workout-2.jpg      # Dumbbell — My Plan & AI Coach visual
    ├── running.jpg        # Running — Progress hero
    ├── recovery.jpg       # Post-workout rest — Sleep, Health Tips & Hydration hero
    ├── food-hero.jpg      # Italian spread on dark table — Food page hero
    ├── food-breakfast.jpg # Fruit bowl — default Breakfast card photo
    ├── food-lunch.jpg     # Grilled chicken rice bowl — default Lunch card photo
    ├── food-dinner.jpg    # Roast chicken plate — default Dinner card photo
    └── food-snack.jpg     # Vegetable & fruit basket — default Snack card photo
```

Every path in `index.html` and every image path in `data.js` is a **relative**
`./...` path, so this works unchanged at `https://<user>.github.io/<repo>/`.

## 2. How to Run

Just open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## 3. Where Each Photo Is Used

Page hero banners live in the `imageAssets` object at the top of `data.js`:

```js
const imageAssets = {
  dashboardHero: { url: "./images/workout-1.jpg", alt: "..." }, // Dashboard hero
  workoutHero:   { url: "./images/workout-1.jpg", alt: "..." }, // Workout hero
  planHero:      { url: "./images/workout-2.jpg", alt: "..." }, // My Plan banner
  runningHero:   { url: "./images/running.jpg",   alt: "..." }, // Progress banner
  recoveryHero:  { url: "./images/recovery.jpg",  alt: "..." }, // Sleep banner
  coachVisual:   { url: "./images/workout-2.jpg", alt: "..." }, // AI Coach header backdrop
  hydrationHero: { url: "./images/recovery.jpg",  alt: "..." }, // Hydration banner
  foodHero:      { url: "./images/food-hero.jpg", alt: "..." }  // Food banner
};
```

Health Tips reuses `recoveryHero` (a "lifestyle / recovery" photo fits that
page's tone).

Individual Food-page meal cards get their own default photo per meal type,
from `mealDefaultImages` (also in `data.js`) — shown until the user attaches
their own photo to a logged item:

```js
const mealDefaultImages = {
  breakfast: { url: "./images/food-breakfast.jpg", alt: "..." },
  lunch:     { url: "./images/food-lunch.jpg",      alt: "..." },
  dinner:    { url: "./images/food-dinner.jpg",     alt: "..." },
  snack:     { url: "./images/food-snack.jpg",      alt: "..." }
};
```

To swap any photo site-wide, replace the file in `images/` (or point the
`url` at a new file) — nothing in `app.js` or `style.css` needs to change.

Same pattern for replacing any other photo — only `data.js` needs to change,
nothing in `app.js` or `style.css`.

## 4. How to Connect a Real Claude API (instead of Mock AI)

The AI Coach never calls Claude directly and never holds an API key in the
browser. Today it runs `AI_MODE = "mock"` in `aiService.js`, which answers
with rule-based Thai responses built from the user's own logged data (see
`buildReply()`).

To go live:

1. **Build a backend endpoint** (Node/Express, Python/FastAPI, etc.) that
   holds `ANTHROPIC_API_KEY` as a server-side environment variable —
   *never* in frontend code. That endpoint should accept
   `POST /api/coach { message, context, history }` and call the Anthropic
   SDK/API using `SYSTEM_PROMPT` (already written out in `aiService.js`)
   as the system prompt.
2. In `aiService.js`, set:
   ```js
   const AI_MODE = "live";
   ```
3. `callBackendAI()` in the same file already `fetch()`es `/api/coach` and
   expects `{ reply: "..." }` back — point the URL at your real backend if
   it's hosted elsewhere.
4. No changes are needed in `app.js` — `getAIResponse()` returns the same
   `{ text }` shape in both modes.

**Where the API key goes:** only in your backend's environment/secret
store — never committed, never shipped to the browser.

## 5. How to Test LocalStorage

1. Open the site, log a meal, sleep entry, workout, or water intake.
2. Open DevTools → Application (Chrome) / Storage (Firefox) → Local
   Storage → your origin. You'll see one key: `healthAppData`, holding
   `profile`, `dailyPlans` (keyed by date, e.g. `2026-09-14`),
   `chatHistory`, and `settings`.
3. Refresh the page — all data should still be there.
4. Profile → **Reset Data** clears the key entirely and reseeds defaults.

## 6. How to Deploy on GitHub Pages

This repo is already flat at root, which is what GitHub Pages needs:

1. Push all files (including the `images/` folder) to your repo's default
   branch.
2. Repo → Settings → Pages → Source → deploy from that branch, root folder.
3. Visit `https://<username>.github.io/<repo-name>/`.

No build step, no server — it's a static site.

## 7. What Was Verified Before Delivery

- Every nav item (sidebar, mobile bottom nav, hamburger menu) routes correctly.
- Forms (timeline, food, sleep log) add/edit/delete and persist to localStorage.
- Dashboard cards and progress bars update live from logged data.
- Date navigation (Previous/Today/Next) keeps each day's data separate.
- Charts (Sleep 7-day, Hydration 7-day, Progress trend) render from real stored data.
- AI Coach chat keeps context within a session, uses today's data in replies,
  and never claims to give a medical diagnosis.
- Every page now has a contextual photo hero (Dashboard, My Plan, Food,
  Sleep, Workout, Hydration, AI Coach, Progress, Health Tips) with a dark
  overlay so text stays readable, cover-style cropping, rounded corners, and
  no layout-breaking stretch.
- Responsive layout checked at desktop, tablet, and mobile widths — hero
  images shrink in height on mobile instead of dominating the screen.
- All `./`-relative paths (CSS, JS, images) verified to return HTTP 200 from
  a flat root, matching the GitHub Pages structure.
- Empty states appear wherever a section has no data yet.
- Mock AI shows a graceful Thai error message if `getAIResponse()` throws,
  and the rest of the site keeps working regardless.
