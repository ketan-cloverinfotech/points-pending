# Status Mail Builder with AI

This repository contains a GitHub Pages app for preparing status update emails.

It supports:

- Completed Points - green
- On Hold Points - amber/yellow
- Pending Points - red
- AI sentence improvement through a Cloudflare Worker proxy

## Important

Do not put your OpenAI API key in `index.html`, `script.js`, `site/index.html`, or any frontend file.

This setup uses GitHub Repository Secrets like this:

```text
GitHub Repository Secret: OPENAI_API_KEY
        |
        | used only inside GitHub Actions
        v
GitHub Action deploys Cloudflare Worker and sets Worker secret
        |
        v
GitHub Pages app calls Worker URL
        |
        v
Worker calls OpenAI API safely
```

## Branch setup

You can use either deployment method now.

### Option A: Publish from `master / root`

The app files are also available at repo root:

```text
index.html
style.css
script.js
```

Use this if your GitHub Pages setting is:

```text
Source: Deploy from a branch
Branch: master
Folder: /root
```

### Option B: Publish from `gh-pages / root`

The workflow publishes only the app files from `site/` to `gh-pages`.

Use this if your GitHub Pages setting is:

```text
Source: Deploy from a branch
Branch: gh-pages
Folder: /root
```

Recommended method: **Option B**.


## AI reasoning effort selection

The page now has a **Reasoning Effort** dropdown.

| Effort | When to use | Note |
|---|---|---|
| `none` | Fastest basic cleanup | Lowest sentence improvement |
| `low` | Quick low-cost correction | Good for small grammar fixes |
| `medium` | Recommended default | Better sentence quality for status mails |
| `high` | Important or poorly written points | Slower and may cost more |
| `xhigh` | Maximum reasoning | Slowest and highest cost |

For your status mail use case, start with `medium`. Use `high` only when the text needs stronger rewriting.


## Rich copy and exact table width

Use **Copy exact table** when pasting into Gmail or Outlook.

The copied HTML now uses one fixed-width centered email table:

```text
Email width: 760px
Content width: 712px
Font: Aptos, Calibri, Arial, sans-serif
```

This avoids the large full-page blue selection box that happens when the copied HTML contains a `width="100%"` outer wrapper.

`Copy plain text` and `Open mail app` are still plain text by design. `mailto:` links do not reliably support HTML tables.

## Folder structure

```text
index.html                  # Same app at root for master/root Pages
style.css
script.js
.nojekyll

site/
  index.html                # GitHub Pages app source
  style.css                 # UI styles
  script.js                 # Mail builder and AI logic
  .nojekyll

worker/
  openai-worker.js          # Cloudflare Worker proxy for OpenAI

.github/workflows/
  deploy-pages-branch.yml   # Publishes site/ to gh-pages branch
  deploy-worker.yml         # Deploys Worker and sets OpenAI secret

wrangler.toml               # Cloudflare Worker config
package.json                # Wrangler dependency
```

## GitHub repository secrets

Create these secrets here:

```text
Repository → Settings → Secrets and variables → Actions → New repository secret
```

Required secrets:

```text
OPENAI_API_KEY
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

## Deploy frontend app

Push this code to your `master` branch.

```bash
# Add all updated files
git add .
```

```bash
# Commit changes
git commit -m "Update status mail builder for master and gh-pages"
```

```bash
# Push to master
git push origin master
```

Then run:

```text
Actions → Deploy GitHub Pages Branch → Run workflow
```

Then set GitHub Pages to one of these:

```text
Recommended:
Branch: gh-pages
Folder: /root
```

or:

```text
Fallback:
Branch: master
Folder: /root
```

## Deploy AI Worker

Run:

```text
Actions → Deploy AI Proxy Worker → Run workflow
```

After success, open Cloudflare Worker and copy the Worker URL:

```text
https://mail-status-ai-proxy.<your-subdomain>.workers.dev
```

Paste that URL in the app under:

```text
AI Proxy URL
```

Then click:

```text
Enhance from AI
```

## Common mistakes

### GitHub Pages shows README instead of app

Reason: Pages is publishing from a branch/folder that does not have `index.html` at root.

Fix:

```text
Settings → Pages → Branch: gh-pages → Folder: /root → Save
```

or use the root files and publish from:

```text
Settings → Pages → Branch: master → Folder: /root → Save
```

### AI button says OpenAI key missing

Reason: Worker does not have `OPENAI_API_KEY` secret.

Fix:

```text
Actions → Deploy AI Proxy Worker → Run workflow
```

### AI button fails before Worker deployment

Reason: Cloudflare Worker still has default Hello World code.

Fix: Deploy Worker using GitHub Action.


## Fix for Wrangler Node.js error

If GitHub Actions shows this error:

```text
Wrangler requires at least Node.js v22.0.0. You are using v20.x.x.
```

The workflow already fixes it by using:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "22"
```

After pushing this code, rerun:

```text
Actions → Deploy AI Proxy Worker → Run workflow
```


## Fix included

This version fixes the OpenAI API error:

```text
Unsupported value: 'minimal' is not supported with the selected GPT-5.4 model. This version sends a user-selected value only: none, low, medium, high, or xhigh.
```

The Cloudflare Worker now uses:

```javascript
reasoning: {
  effort: 'low'
}
```

After pushing this code, run:

```text
Actions → Deploy AI Proxy Worker → Run workflow
```


## Rich email copy update

The **Copy mail body** button now copies a formatted HTML table with inline email-safe styles.

Recommended mail font:

```text
Aptos, Calibri, Arial, sans-serif
```

Why: Aptos is the current Microsoft 365 default font, Calibri is still common in older Outlook, and Arial is a safe fallback for Gmail and browsers.

Important:

- Use **Copy mail body** for formatted table output.
- **Copy plain text** intentionally copies only text.
- **Open mail app** uses `mailto:` and most mail clients accept only plain text through that path.

