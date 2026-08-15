# Setting up feedback and AI photo auto-fill

QuickFit is a static site (GitHub Pages), so the feedback form and the "add a
closet item from a photo" feature both need a small piece of outside
infrastructure to actually work. Until you do this setup, both features
degrade gracefully: the feedback form tells visitors delivery isn't
configured yet, and photo upload still attaches a thumbnail but skips
auto-filling the fields.

Everything below is configured once, as GitHub Actions secrets. Nothing
sensitive is ever committed to the repo — the deploy workflow
(`.github/workflows/deploy.yml`) writes these into
`src/scripts/runtime-config.js` at deploy time, the same way it already does
for `OPENWEATHER_API_KEY`.

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

## 2. Photo analysis (Google Gemini + Cloudflare Worker)

Since Anthropic's signup was blocked for you, photo auto-fill uses Google
Gemini instead (`worker/src/index.js` already calls Gemini's API). The flow
is the same either way: the browser sends a photo to your Cloudflare
Worker, the worker calls the AI provider with a key that never touches the
browser, and returns suggested fields.

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

### 2c. Set the worker's origin check and secret

`worker/wrangler.toml` is already set to:

```toml
ALLOWED_ORIGIN = "https://bridgetkimball.github.io"
```

That's your GitHub Pages origin based on this repo (`BridgetKimball/QuickFit`).
Double check it matches exactly what's shown at **repo Settings → Pages →
"Your site is live at ..."** — if you're using a custom domain instead, use
that domain here. This value is what stops other websites from using your
worker and spending your Gemini quota, so it's worth getting right.

Then set the actual key as a secret (this prompts you to paste it — it's
never typed on the command line or committed anywhere):

```bash
npx wrangler secret put GEMINI_API_KEY
```

### 2d. Deploy

```bash
npx wrangler deploy
```

Wrangler will print a URL that looks like:

```
https://quickfit-photo-analysis.<your-cloudflare-subdomain>.workers.dev
```

That's your `PHOTO_ANALYSIS_ENDPOINT`.

### 2e. Add the worker URL as a GitHub secret

1. Repo → **Settings → Secrets and variables → Actions → New repository
   secret**.
2. Name: `PHOTO_ANALYSIS_ENDPOINT`
3. Value: the `workers.dev` URL from step 2d.
4. Push to `main`, or re-run the "Deploy QuickFit" workflow from the
   **Actions** tab.

Once that deploy finishes, uploading a photo in the Closet Manager will call
the worker and pre-fill the form fields (color, type, style, and so on) for
you to review before saving.

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

The worker is small and isolated in `worker/src/index.js` — swapping in
OpenAI or another vision model later just means changing the `fetch` call
inside `analyzeClothingPhoto()` and the secret name in `wrangler.toml`. The
rest of QuickFit (the client-side upload UI, the form pre-fill logic) reads
whatever JSON the worker returns and doesn't care which provider produced
it.
