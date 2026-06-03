# WinTools — Cloudflare Pages Deployment Guide

WinTools is an Astro static site for publishing Windows utility downloads and tutorials. Tool posts are stored as Markdown files, and a Decap CMS admin entry is available at `/admin`.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:4321`.

## Build

```bash
npm run build
```

The static output is generated in `dist/`.

## Deploy to Cloudflare Pages

1. Create a GitHub repository, for example `wintools`.
2. Push this project to GitHub.
3. Open the Cloudflare Dashboard and go to **Workers & Pages**.
4. Create a Pages application and connect the GitHub repository.
5. Use this build configuration:

```text
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Root directory: /
```

6. Add this environment variable in Cloudflare Pages:

```text
SITE_URL=https://winstools.com
```

Use the temporary `*.pages.dev` URL first if you have not attached a custom domain yet. After the custom domain is active, update `SITE_URL` and redeploy.

Recommended additional environment variable:

```text
ASTRO_TELEMETRY_DISABLED=1
```

## Domain Setup

You can register the domain with Cloudflare Registrar and attach it directly to the Pages project from **Custom domains**. After the domain is active, make sure `SITE_URL` matches the production URL so canonical links, RSS, Open Graph metadata, and sitemap URLs are generated correctly.

## Content

Add tool posts in `src/content/tools/*.md`. Screenshots should be placed in `public/images/` and referenced with paths like `/images/example.png`.

## CMS

Decap CMS is available at `/admin`, but GitHub authentication requires an OAuth service. Cloudflare Pages does not include Netlify Identity, so for a single-maintainer site the simplest workflow is to edit Markdown files locally, commit them to GitHub, and let Cloudflare Pages rebuild automatically.

Before using Decap CMS, update `public/admin/config.yml`:

```yaml
backend:
  name: github
  repo: Leandro162/wintools
  branch: main
```

## Safety

Do not commit `.env` files, private keys, tokens, or account credentials. Generated folders such as `node_modules/`, `dist/`, and `.astro/` are ignored.
