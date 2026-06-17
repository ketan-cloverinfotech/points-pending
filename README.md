# Status Mail Builder with AI using GitHub Repository Secrets

This repository contains a GitHub Pages app for preparing status update emails.

It has three sections:

- Completed Points - green
- On Hold Points - amber/yellow
- Pending Points - red

It also has **Enhance from AI** for improving sentence quality.

## Important design

Do not put your OpenAI API key in `site/index.html`, `site/script.js`, or any frontend file.

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

Why: GitHub Pages is a static website. Browser JavaScript cannot safely read secrets.

## Folder structure

```text
site/
  index.html          # GitHub Pages UI
  style.css           # UI colors and layout
  script.js           # Mail builder and AI button logic

worker/
  openai-worker.js    # Cloudflare Worker proxy for OpenAI

.github/workflows/
  deploy-worker.yml        # Uses GitHub Secrets and deploys Worker
  deploy-pages-branch.yml  # Publishes site/ to gh-pages branch

wrangler.toml         # Cloudflare Worker config
package.json          # Wrangler dependency
```

## Step 1: Create repository

Create a new GitHub repository, for example:

```text
mail-status-builder
```

Then push this code to the `main` branch.

```bash
# Clone your empty repository
git clone https://github.com/<your-user>/mail-status-builder.git
cd mail-status-builder

# Copy all files from this ZIP into the repository folder

# Commit the code
git add .
git commit -m "Add status mail builder with AI proxy"

# Push to main branch
git push origin main
```

## Step 2: Create GitHub Repository Secrets

Open your repository in GitHub.

Go to:

```text
Repository → Settings → Secrets and variables → Actions → New repository secret
```

Create these secrets:

| Secret name | Value |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token used by Wrangler |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

Secret names must be exactly the same.

## Step 3: Create Cloudflare API token

In Cloudflare:

```text
Cloudflare Dashboard → My Profile → API Tokens → Create Token
```

Use a token that can deploy/edit Workers.

Save that token in GitHub as:

```text
CLOUDFLARE_API_TOKEN
```

## Step 4: Run Worker deployment workflow

In GitHub:

```text
Repository → Actions → Deploy AI Proxy Worker → Run workflow
```

This workflow will:

1. Deploy `worker/openai-worker.js` to Cloudflare Workers.
2. Read `OPENAI_API_KEY` from GitHub Repository Secrets.
3. Store it as a Cloudflare Worker secret named `OPENAI_API_KEY`.

After it completes, your Worker URL will look like this:

```text
https://mail-status-ai-proxy.<your-cloudflare-subdomain>.workers.dev
```

Use this in the app as your **AI Proxy URL**.

Example:

```text
https://mail-status-ai-proxy.<your-cloudflare-subdomain>.workers.dev/api/enhance
```

The Worker accepts any path, so `/api/enhance` is okay.

## Step 5: Deploy GitHub Pages using branch

Run this workflow:

```text
Repository → Actions → Deploy GitHub Pages Branch → Run workflow
```

It publishes only the `site/` folder to the `gh-pages` branch.

Then enable GitHub Pages:

```text
Repository → Settings → Pages
```

Select:

```text
Source: Deploy from a branch
Branch: gh-pages
Folder: / root
```

Save it.

Your app URL will look like:

```text
https://<your-user>.github.io/mail-status-builder/
```

## Step 6: Configure AI in the app

Open the GitHub Pages app.

In **AI Sentence Improvement**, add:

```text
AI Proxy URL: https://mail-status-ai-proxy.<your-cloudflare-subdomain>.workers.dev/api/enhance
Model: gpt-5.4-nano
```

Click:

```text
Save AI settings
```

Then use:

```text
Enhance from AI
```

or:

```text
Enhance all points with AI
```

## Example raw input

```text
Point Title:
Actual K8s Cluster Overview

Action / Owner:
Sandeep pal didn't explain AKS cluster and configuration as this is required while Upgradation

Details:
Cluster configuration is crusial part as client required to upgrade the version
```

## Example improved output

```text
Point Title:
Actual AKS Cluster Overview

Action / Owner:
The AKS cluster overview and configuration details are required before proceeding with the upgrade activity.

Details:
Cluster configuration is a critical prerequisite because the client has requested a Kubernetes version upgrade.
```

## Common mistakes

### 1. Expecting GitHub Pages to read secrets

GitHub Pages cannot read GitHub Repository Secrets at runtime.

Secrets are available to GitHub Actions workflow runs only.

### 2. Hardcoding OpenAI API key in frontend code

Do not do this:

```js
const OPENAI_API_KEY = "sk-xxxx";
```

Anyone can open browser DevTools and copy the key.

### 3. Publishing Worker files to GitHub Pages

This setup publishes only the `site/` folder to the `gh-pages` branch.

The Worker code remains in `main` and is deployed using GitHub Actions.

### 4. Using a costly model for simple sentence improvement

Start with:

```text
gpt-5.4-nano
```

Use a bigger model only if the output quality is not enough.

### 5. Sending sensitive customer data

Do not paste passwords, tokens, secrets, private keys, or confidential customer data into AI enhancement.

## Local Worker test

For local testing, install dependencies:

```bash
# Install Wrangler dependency
npm install
```

Run locally:

```bash
# Start Worker locally
npx wrangler dev
```

Set the secret locally using a `.dev.vars` file if needed:

```text
OPENAI_API_KEY=sk-xxxx
```

Do not commit `.dev.vars` or `.env` files.
