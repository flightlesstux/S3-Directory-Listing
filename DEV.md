# Developer Notes

## Project Overview

S3-Directory-Listing is a zero-build, client-side web app that turns an AWS S3 bucket's XML listing into a navigable UI. It's deployed directly to S3 as a static website.

## Development

No build step, no package manager, no test runner. Open `index.html` locally in a browser or serve it with any static file server:

```bash
python3 -m http.server 8080
```

For deployment, push to `main` — GitHub Actions syncs the four app files to S3 automatically via `aws s3 sync`.

## Configuration

All options are in `config.js`:

```js
export const bucketName   = 'your-bucket-name';
export const s3Domain     = 's3.amazonaws.com';
export const itemsPerPage = 10;
export const hiddenFiles  = ['index.html', 's3.js', 'config.js'];
```

## Architecture

**Entry point:** `index.html` loads Font Awesome and imports `s3.js` as an ES6 module. All styles are inline in `index.html` using CSS variables for theming.

**Data flow:**
1. `s3.js` reads `?prefix=` from the URL on load and calls `navigateTo(prefix, true)`
2. `listObjects(path)` fetches the S3 XML API: `https://{bucketName}.{s3Domain}/?list-type=2&prefix={prefix}&delimiter=%2F`
3. Follows `NextContinuationToken` recursively until all items are loaded
4. `parseXML()` builds a flat `allItems` array; `renderItems()` sorts and paginates it client-side
5. Navigation pushes state to `history`, back/forward fires `popstate`

**Key behaviors in `s3.js`:**
- Hidden files list comes from `config.js` (`hiddenFiles`)
- Folders detected by trailing `/` in the S3 key
- Pagination is client-side from `allItems` cache — no re-fetch on page change
- Dark mode toggles `body[data-theme="dark"]` and defaults to system preference
- Sort state (`sortKey`, `sortAsc`) is in-memory; resets on folder navigation

## AWS Setup Requirements

The target S3 bucket needs:
- Static website hosting enabled
- Public read bucket policy
- CORS configuration allowing GET requests
- These files uploaded: `index.html`, `s3.js`, `config.js`, `dark-mode.css`

## CI/CD

`.github/workflows/main.yml` deploys on push to `main`:
- Syncs app files to S3 with `--delete`, excluding `docs/`, `DEV.md`, `README.md`, `package.json`, `.github/`
- Requires GitHub Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

`.github/workflows/release.yml` triggers on `v*` tags:
- Creates a GitHub Release with the four app files attached
