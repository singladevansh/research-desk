# The Research Desk

A static site that generates structured industry research reports section-by-section,
using each visitor's own Anthropic API key.

## How it's structured

```
index.html          → the page itself (masthead, example reports, generator, output)
assets/styles.css    → all visual design
assets/framework.js  → your report template, encoded as data (sections, prompts, invariant rules)
assets/app.js        → UI logic: initiate → form → section-by-section generation → chart rendering
api/generate.js      → tiny serverless proxy (Vercel function) — required because of CORS
```

## Why there's a backend file at all

Anthropic's API doesn't allow direct browser-to-API calls from arbitrary websites (no
permissive CORS headers). So the browser can't call `api.anthropic.com` directly — it has
to go through *some* server. `api/generate.js` is that server: it's a single serverless
function that takes the visitor's API key from the request, makes one call to Anthropic on
their behalf, and returns the text. It never logs, stores, or persists the key anywhere.

This means the report still runs entirely on the visitor's own Claude usage/billing — you're
not paying for anyone's reports — the function is just a relay, not a paid backend.

## Deploying (Vercel — recommended, free tier is enough)

### Step 1 — Push this project to GitHub

From inside this folder:

```bash
git init
git add .
git commit -m "Initial commit: Research Desk site"
git branch -M main
git remote add origin https://github.com/<your-username>/research-desk.git
git push -u origin main
```

(Create the empty repo on github.com first — New Repository → don't initialize with a
README, since this folder already has one.)

### Step 2 — Connect the repo to Vercel

1. Go to vercel.com → sign in with GitHub → **Add New Project**
2. Select your `research-desk` repo → **Import**
3. Framework preset: leave as **Other** — no build step is needed, this is plain HTML/JS
4. Click **Deploy**

Vercel automatically detects `api/generate.js` and serves it as a live serverless function
at `https://your-project.vercel.app/api/generate`, while `index.html` + `assets/` are served
as the static site at `https://your-project.vercel.app/`.

### Step 3 — Ongoing updates

From then on, every `git push` to `main` triggers an automatic redeploy. You don't need to
touch the Vercel dashboard again unless changing settings like a custom domain.


## Deploying with your existing GitHub Pages domain

GitHub Pages can't run serverless functions, so if you want to keep your main domain on
GitHub Pages for your portfolio, the clean setup is:

- Keep your portfolio on GitHub Pages at `yourdomain.com`
- Deploy this project to Vercel and point a subdomain at it, e.g. `research.yourdomain.com`
  (add the subdomain in Vercel's dashboard, then add the CNAME record it gives you in your
  domain's DNS settings — same DNS panel you used for the GitHub Pages CNAME)

## Local testing

Vercel's CLI can run the function locally:

```bash
npm install -g vercel
vercel dev
```

This serves `index.html` and runs `api/generate.js` on `localhost` together, so the relative
`/api/generate` path in `app.js` works without any changes.

## Before going live — things to finish

- [ ] Replace the placeholder cards in `index.html`'s `#reportGallery` with your real report
      files (link `href` to the actual HTML files, update the tag/title/accent color per card).
- [ ] In `api/generate.js`, change `Access-Control-Allow-Origin: *` to your real domain once
      you know it, e.g. `https://research.yourdomain.com` — tightens who can call your proxy.
- [ ] Decide if you want a basic per-IP rate limit on the proxy (optional — since it's the
      visitor's own key and billing, this is about abuse-proofing your Vercel function's free
      tier quota, not about cost to you).
- [ ] Test the full flow once with a real (low-cost) API key end to end, including a section
      that triggers the "data not available" path, to confirm the invariant rules hold.

## How the framework maps to the page

Each entry in `FRAMEWORK_SECTIONS` (in `assets/framework.js`) is one skeleton card and one
API call. `INVARIANT_RULES` is sent as the system prompt on every single call — this is
where the "never hallucinate, always cite sources" rules live, so they can't get lost in a
long combined prompt.

Sections 07, 08, 09 (and 10, conditionally) receive a `factSheet` — a short running text
summary the app builds up from earlier sections' output — so SWOT, Synthesis, and the Brand
Spotlight can genuinely cross-reference earlier findings, without resending the full text of
every prior section (which would balloon token cost for the visitor).

Section 10 (Brand/Company Spotlight) only generates if the visitor filled in the optional
"Company / brand spotlight" field — otherwise it's skipped entirely, per the original
framework's "if a specific company is the client or subject" condition.
