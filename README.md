# Backstep

A lightweight React + Vite frontend for tracking check-ins and assignments.

Live demo: https://medthic.github.io/backstep/

## What is this

Backstep is a small single-page application built with React and Vite. It shows assignments, calendar pages, charts, and integrates with Supabase for data. The app is designed to be fast, mobile-friendly, and easy to deploy to GitHub Pages.

## Features

- React 19 + Vite
- Supabase integration (see `src/lib/supabase.ts`)
- Calendar and charts (react-big-calendar, chart.js)
- TailwindCSS for styling
- Ready-to-deploy to GitHub Pages

## Tech stack

- React 19
- Vite
- TailwindCSS
- Supabase JS
- Chart.js / react-chartjs-2
- react-big-calendar

## Quickstart

Prerequisites

- Node.js (recommended >= 18)
- npm (or pnpm/yarn)

Clone and install

```powershell
git clone https://github.com/Medthic/backstep.git
cd backstep
npm install
```

Run development server

```powershell
npm run dev
```

Build for production

```powershell
npm run build
```

Preview the production build locally

```powershell
npm run preview
```

Deploy to GitHub Pages

This project includes a `deploy` script that uses `gh-pages` to publish the `dist` folder. The `homepage` in package.json is already set to the GitHub Pages URL.

```powershell
npm run predeploy
npm run deploy
```

Notes: ensure the `homepage` field in `package.json` points to your deployed URL if you fork the repo.

## Repository structure

Top-level files

- `package.json` — scripts and dependencies
- `vite.config.js` — Vite configuration
- `tailwind.config.js` — Tailwind configuration

Key source folders

- `src/` — application source
	- `main.jsx` — app entry
	- `App.jsx` — root component
	- `components/` — UI components and pages
	- `lib/supabase.ts` — Supabase client wrapper

Static assets

- `public/` — static files served by Vite

## Environment & configuration

If the app expects environment variables (for Supabase keys, etc.), create a `.env` file in project root or set them in your deployment environment. Example variables (do not commit secrets):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Access them in code with `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.

## Tests

There are no unit tests included by default. `playwright` is present in `devDependencies` and can be used to add end-to-end tests.

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes and run `npm run dev` to verify
4. Open a pull request with a clear summary of your changes

Please follow the existing code style and update or add tests where appropriate.

## License

This project is released under the MIT License. See the `LICENSE` file for details.

## Contact

For questions or help, open an issue on GitHub: https://github.com/Medthic/backstep/issues

---

Small note: If you'd like, I can add badges, a short walkthrough GIF, environments example `.env.example`, or CI/CD instructions for GitHub Actions to automatically deploy on push.

