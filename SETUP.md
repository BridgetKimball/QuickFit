# Setting up accounts, weather, feedback, and AI photo auto-fill

QuickFit is a static site (GitHub Pages) paired with a Cloudflare Worker
(`worker/`) that now handles everything that needs a real secret or a
database: user accounts, weather, and AI photo analysis. The feedback form
uses a separate Formspree endpoint. Until you do this setup, the app can't
log anyone in (accounts and weather both depend on the worker being
deployed), and the feedback form tells visitors delivery isn't configured
yet.

Frontend secrets are configured once, as GitHub Actions secrets — the deploy
workflow (`.github/workflows/deploy.yml`) writes them into
`src/scripts/runtime-config.js` at deploy time. Worker secrets
(`GEMINI_API_KEY`, `OPENWEATHER_API_KEY`) are configured directly on
Cloudflare via `wrangler secret put` and are never written into any file in
this repo.

## 1. Feedback delivery (Formspree) — done

Your Formspree form is already created (`https://formspree.io/f/xwleqjre`).
To wire it in:

1. On GitHub: go to your repo → **Settings → Secrets and variables →
   Actions → New repository secret**.
2. Name: `FORMSPREE_ENDPOINT`
3. Value: `https://formspree.io/f/xwleqjre`
4. Push to `main`, or go to the **Actions** tab and re-run the "Deploy
   QuickFit" workflow manually.

That's it — no code changes needed. The feedback form already submits via
`fetch` in the pattern Formspree recommends for plain JS sites.

## 2. The Cloudflare Worker (accounts, weather, AI photo analysis)

`worker/` is one Cloudflare Worker that now backs three features: user
accounts + closet storage (Cloudflare D1), the weather proxy (so your
OpenWeather key never reaches the browser), and AI photo auto-fill (Google
Gemini). Since Anthropic's signup was blocked for you, photo auto-fill uses
Gemini instead of Claude — the flow is the same either way: the browser
calls your Worker, the Worker calls the AI provider with a key that never
touches the browser, and returns suggested fields.

### 2a. Get a Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   and sign in with a Google account.
2. Click **Create API key**. Google AI Studio's free tier does not require
   a credit card in most regions — if you hit a region restriction here
   too, let me know and we'll look at another provider.
3. Copy the key. You'll paste it into `wrangler` in step 2c below, not into
   any file in the repo.

### 2b. Install and log into Cloudflare's CLI (wrangler)

From the `worker/` folder in this repo:

```bash
cd worker
npm install
npx wrangler login
```

`wrangler login` opens a browser tab to authorize the CLI against your
Cloudflare account (a free account is enough — create one at
dash.cloudflare.com if you don't have one).

### 2c. Set the worker's origin check and secrets

`worker/wrangler.toml` is already set to:

```toml
ALLOWED_ORIGIN = "https://bridgetkimball.github.io"
```

That's your GitHub Pages origin based on this repo (`BridgetKimball/QuickFit`).
Double check it matches exactly what's shown at **repo Settings → Pages →
"Your site is live at ..."** — if you're using a custom domain instead, use
that domain here. This value is what stops other websites from using your
worker (accounts, weather, and Gemini quota all ride on it), so it's worth
getting right.

Then set the two real secrets (each prompts you to paste the value — never
typed on the command line or committed anywhere):

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put OPENWEATHER_API_KEY
```

If you previously had an `OPENWEATHER_API_KEY` **GitHub Actions secret** (used
to embed the key directly in client JS), delete it now — the key only lives
as a Worker secret going forward and is never shipped to the browser.

### 2d. Create the D1 database (user accounts + closet storage)

```bash
npx wrangler d1 create quickfit-db
```

This prints a `database_id` — paste it into the `[[d1_databases]]` block in
`worker/wrangler.toml` (replacing `REPLACE_WITH_ID_FROM_WRANGLER_D1_CREATE`).
Then apply the schema once, locally, to confirm it works:

```bash
npx wrangler d1 migrations apply quickfit-db --local
npx wrangler d1 migrations apply quickfit-db --remote
```

(CI applies `--remote` migrations automatically on every push after this —
see step 2f — but running it once yourself here confirms the database and
`database_id` are wired up correctly before you rely on CI.)

### 2e. Deploy the worker manually, once

```bash
npx wrangler deploy
```

Wrangler will print a URL that looks like:

```
https://quickfit-photo-analysis.<your-cloudflare-subdomain>.workers.dev
```

That's your `PHOTO_ANALYSIS_ENDPOINT` — it's now also the base URL the
frontend uses for weather, login/signup, and closet/profile/favorites
requests (`${PHOTO_ANALYSIS_ENDPOINT}/weather`,
`${PHOTO_ANALYSIS_ENDPOINT}/auth/login`, etc.), so this one secret covers
every backend feature.

### 2f. Add GitHub secrets for the worker URL and automated deploys

1. Repo → **Settings → Secrets and variables → Actions → New repository
   secret**.
2. Name: `PHOTO_ANALYSIS_ENDPOINT` → Value: the `workers.dev` URL from step 2e.
3. Create a Cloudflare API token at
   [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
   → **Create Token** → give it `Workers Scripts: Edit` and `D1: Edit`
   permissions for your account.
4. Add it as another secret: Name: `CLOUDFLARE_API_TOKEN` → Value: the token
   from step 3.
5. Push to `main`, or re-run the "Deploy QuickFit" workflow from the
   **Actions** tab.

From this point on, every push to `main` automatically applies any new D1
migrations and redeploys the worker (`deploy-worker` job in
`.github/workflows/deploy.yml`), alongside the existing Pages deploy — you
only need to `wrangler deploy`/`wrangler d1 migrations apply` by hand again
if you're testing something locally first.

Once the first deploy finishes, the app will show a login/sign-up gate,
uploading a photo in the Closet Manager will call the worker and pre-fill
the form fields for you to review before saving, and the planner's weather
will load automatically through the worker instead of needing a client-side
OpenWeather key.

## Cost and abuse notes

- Every photo upload triggers one Gemini API call. Google's free tier has
  generous but finite daily/per-minute limits — the `ALLOWED_ORIGIN` check
  in the worker keeps other websites from calling it, but doesn't stop
  someone from hitting the endpoint directly with a tool like `curl`. If
  usage becomes a concern, Cloudflare's dashboard lets you add rate
  limiting rules on the worker's route without any code changes.
- Formspree's free tier caps submissions per month; if you outgrow it,
  Formspree's paid tiers or a custom backend are both drop-in replacements —
  just swap `FORMSPREE_ENDPOINT` for whatever endpoint you're posting to.

## If you want to switch AI providers later

Photo analysis lives in its own route module, `worker/src/routes/photo.js`
(the worker also has `routes/weather.js`, `routes/auth.js`, `routes/closet.js`,
`routes/profile.js`, and `routes/favorites.js` for the other features) —
swapping in OpenAI or another vision model later just means changing the
`fetch` call inside `analyzeClothingPhoto()` in that one file and the secret
name in `wrangler.toml`. The rest of QuickFit (the client-side upload UI, the
form pre-fill logic) reads whatever JSON the worker returns and doesn't care
which provider produced it.
