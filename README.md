# Campus Sync — T3 Stack

Campus Sync has been rebuilt on the [T3 stack](https://create.t3.gg/) so it can deploy cleanly to Vercel. The app now runs on Next.js with the App Router and uses tRPC, React Query, Tailwind CSS, and superjson to expose a typed API for tunnel data.

## What’s inside

- **Next.js 14 App Router** with React 18 for hybrid static/server rendering
- **tRPC v11** + **React Query** for fully typed client/server communication
- **Tailwind CSS** alongside the existing handcrafted styles
- **Superjson** serialization and **Zod** validation scaffolding for future mutations
- **Type-safe environment handling** via `@t3-oss/env-nextjs`

## Getting started

```bash
nvm use
npm install
npm run dev
```

The development server runs on `http://localhost:3000`. The map view uses MapLibre GL to render the GeoJSON overlays exported from the ArcGIS services.

### Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

These align with Vercel’s CI pipeline (`next build`).

### Refreshing ArcGIS datasets

Use the helper script to download the ArcGIS services listed in `src/server/data/arcgis-features.txt`. For each feature the script saves the service metadata alongside layer/table data (GeoJSON when geometry is present):

```bash
node scripts/download-arcgis-data.mjs
```

Pass `--feature <NAME>` to target a subset or `--features-file <PATH>` to point at a different list. Downloads automatically trim each GeoJSON FeatureCollection to a campus bounding box (≈ 44.94°–45.01° N, −93.26°–−93.18° W) so out-of-area geometry never pollutes the map. To re-trim existing datasets in place, run:

```bash
node scripts/trim-local-geojson.mjs
```

The Next.js map view consumes the GeoJSON files in `src/server/data/json`, so refreshing the exports updates the overlays without additional code changes.

## Deployment on Vercel

1. Push the repository to GitHub (or another Git provider).
2. Create a new project in Vercel and import the repo.
3. Vercel auto-detects Next.js and uses `npm install`, `npm run build`, and `Next.js` defaults.
4. No environment variables are required yet. If you add them later, define them in `src/env.mjs` and in the Vercel dashboard.

After the first deployment, Vercel will automatically build & deploy on every `main` branch push. Preview deployments work the same way for PRs.

### Node version

The project targets Node.js 20. Install it with [`nvm`](https://github.com/nvm-sh/nvm) or your preferred version manager, then run `nvm use` (reads `.nvmrc`) before installing dependencies locally or on CI.
