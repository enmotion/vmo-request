# Documentation development & deployment

The site uses VitePress 1.6.4. Chinese is served at the site root and English at `/en/`. Both languages share the same page structure, allowing the language menu to switch corresponding pages.

## Local development

```sh
npm ci
npm run docs:dev
```

Open the URL printed by the command. Node.js 22 or later is recommended for documentation development.

## Build and preview

```sh
npm run docs:check
npm run docs:preview
```

Output goes to `docs/.vitepress/dist`. The default project path is `/vmo-request/`; use the project URL printed by the preview command.

Dead-link checking stays enabled; do not hide missing pages with `ignoreDeadLinks`. Built-in local search does not require an Algolia account.

## GitHub Pages

The target repository is [enmotion/vmo-request](https://github.com/enmotion/vmo-request). Its expected site URL is:

```text
https://enmotion.github.io/vmo-request/
```

1. Commit the documentation and workflow to the GitHub repository's default branch.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Check **Actions → Documentation / GitHub Pages**. A successful build is followed by deployment.

Pushes to `main` and `master` trigger the workflow, but only the default branch can deploy. Pull requests build without publishing. You can also run the workflow manually on the default branch.

Configuration reads `GITHUB_REPOSITORY` to derive the correct asset path, preventing missing CSS, scripts, or images on project Pages. The site uses `.html` links for static GitHub Pages hosting.

## Custom domains or paths

No custom domain is configured by default. For hosting at a domain root, set the repository Actions variable `DOCS_BASE` to `/` and configure the domain in Pages settings.

Override the path locally:

```sh
DOCS_BASE=/ npm run docs:build
```

Root domains and project subpaths require different build output. Rebuild after changing the path.

## Maintain both languages

Chinese guides live in `docs/guide/`; corresponding English pages live in `docs/en/guide/`. API pages are `docs/api/index.md` and `docs/en/api/index.md`.

Keep both languages in sync and distinguish released behavior from unreleased fixes. After publishing the reliability fixes, update the version notice and upgrade page together.

Building documentation is separate from publishing an npm package and does not change the VmoRequest API.
