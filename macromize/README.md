# MacroMize

> Integration branch update: Both apps now include a 159-entry snapshot across three Hamburg restaurants. Six curated dishes retain their verified nutrition and IDs; other unreviewed values remain unknown. The protected Supabase connection is prepared but not deployed. See [INTEGRATION.md](../INTEGRATION.md) for configuration and current validation. Descriptions of the original six-dish pilot below document the baseline.

A mobile meal finder and Expo iOS companion for Hamburg Zentrum, built from the supplied product brief and design. Home uses “Find food that fits your goals”, a small Mize companion, white entry cards, forest green controls, outline meal icons and a softened OpenTopoMap terrain view.

## Functional MVP

Guest preferences; numeric calories/protein with optional carbohydrate/fat caps; qualitative goals; radius, euro budget, cuisine, open-hours, diet and exclusion filters; top three meal recommendations; map/list and reasons; dish and restaurant favourites; directions; chosen/eaten history; ratings and private food photos; correction reports; privacy, export/delete and in-app support.

Menus can be added from an original URL/text or photo. Tesseract.js reads photo text locally in the browser; price-bearing candidate lines are offered for review. The person confirms the dish, restaurant street address and any stated nutrition. Unknown nutrients stay unknown. User estimates are labeled; no model-based hidden-ingredient or nutrition inference is claimed.

## Hamburg pilot and trust

Six real dishes from HANS IM GLÜCK Altes Rathaus, sourced from the location's official menu and the chain's published standard-recipe nutrition. See [sources](data/SOURCES.md). This is one restaurant and a curated pilot, not complete city coverage, automatic menu refresh or live inventory. Nutritional averages may vary by serving and customisation.

The open filter uses regular weekly hours in Europe/Berlin and expires old source checks after 30 days; exceptional closures can differ. Unknown required prices, nutrients and ingredient exclusions fail closed. Distances are explicitly straight-line. Overlapping dishes share one restaurant map pin; the list exposes the top three.

## Persistence

D1 stores guest preferences and owned menu/history/report/favourite records. R2 stores photo bytes; every read verifies the guest owner in D1. Guest identity is an HttpOnly, SameSite=Lax cookie. Account deletion removes both records and uploaded files. Native device data does not sync with the separate browser guest profile.

Reports are stored with guest data and can be exported. No external support inbox or delivery integration is connected. JSON exports contain private photo links; save any original photos before deleting the profile.

## Development and checks

Use package scripts for development and builds. Drizzle migrations are schema-only: 0000 is the original guest state; 0001 adds owned items/files; 0002 indexes their owners. Preserve applied migrations.

Validation: TypeScript and production build; `node --test tests/core.test.mjs tests/matching.test.mjs` (17 cases); API round trips for canonical nutrition, history/rating, guest isolation, private photo ownership and deletion. Local OCR reads a synthetic menu fixture. Browser visual testing remains unavailable because browser policy verification fails. Native simulator journeys are tested separately.

## Maps and media

Terrain imagery: OpenTopoMap, OpenStreetMap and SRTM, with visible CC-BY-SA attribution. https://opentopomap.org/about
Area lookups use Nominatim only on explicit searches. Mize is the original generated reference asset. No unverified dish images or fictional catalog records are supplied.
