# Hackathon-MacroMize

Find food that fits your goals.

This repository contains the MacroMize web app and its native iOS companion.

- `macromize/`: React/Vinext web app, API routes, D1 migrations and R2 photo storage.
- `macromize-ios/`: React Native / Expo iOS app with device-local persistence.
- `reference-data/`: Hamburg pilot catalog and source documentation.

Current website: https://macromize-meal-finder.franzi-s.chatgpt.site/

## Web development

Requires Node.js 22.13 or newer; Node.js 24 is recommended for the TypeScript test files.

```sh
cd macromize
npm run install:ci
npm run dev
```

The development server uses http://localhost:5173. Cloudflare D1 and R2 bindings are declared in `.openai/hosting.json`; local development uses the existing Vite/Cloudflare setup. Keep the three schema migrations in order. The Sites project ID identifies the existing deployment; cloning this repository does not grant access to its hosted data or deployment.

```sh
node --test tests/*.test.mjs
npx tsc --noEmit
npm run build
```

## iOS development

```sh
cd macromize-ios
npm ci
npm run ios
```

Use a compatible iOS simulator and Expo SDK 57. See `macromize-ios/README.md` for device requirements and the simulator helper.

```sh
npm run typecheck
node --test tests/*.test.mjs
npm run check:ios
```

## Scope and data

Both apps include meal targets, filtering, map/list recommendations, favourites, chosen/eaten history, ratings, menu import, photos and privacy controls. The pilot includes six real dishes from one Hamburg restaurant; it is not a citywide or live inventory service. Unknown nutritional values remain unknown. Source details and limitations are documented in each app's README and `reference-data/HAMBURG-SOURCES.md`.

Browser guest data and native device data are separate and do not sync. No credentials, user records, installed dependencies or generated build output are included in the source import.
