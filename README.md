# Backstep

Backstep — UI for department assignments and admin tools.

This repo has been prepared for a beta release.

Quick tasks done for beta:
- Fixed lint errors and build issues.
- Ensured Vite build succeeds and produced `dist/`.
- Added package metadata (version, repository, license).

How to build locally

1. Install dependencies:

```powershell
npm ci
```

2. Run dev server:

```powershell
npm run dev
```

3. Create a production build:

```powershell
npm run build
```

Preview the production build:

```powershell
npm run preview
```

Deploy options

- GitHub Pages (already configured):
  - `npm run predeploy && npm run deploy` (deploys `dist/` via `gh-pages`)
- Vercel / Netlify: Connect the repo, set build command `npm run build` and publish `dist/`.
- Docker: build and run the included Docker image (see Dockerfile).

Docker (quick):

```powershell
# build
docker build -t backstep:beta .
# run (exposes port 8080)
docker run -p 8080:80 backstep:beta
```

Notes and next steps

- Consider code-splitting large bundles flagged by Vite (see build output warnings).
- Add CI workflow (GitHub Actions) to run `npm ci`, `npm run lint`, and `npm run build` on PRs.
- Review third-party dependencies and vulnerabilities reported by `npm audit`.

Contact

Repository: https://github.com/Medthic/backstep
