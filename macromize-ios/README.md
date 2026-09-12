# MacroMize for iOS

> Integration branch update: Both apps now include a 159-entry snapshot across three Hamburg restaurants. Six curated dishes retain their verified nutrition and IDs; other unreviewed values remain unknown. The protected Supabase connection is prepared but not deployed. See [INTEGRATION.md](../INTEGRATION.md) for configuration and current validation. Descriptions of the original six-dish pilot below document the baseline.

Native React Native / Expo SDK 57 app based on the MacroMize reference. Warm off-white, forest green, white home choices and outline Meal Type icons. Home reads “Find food that fits your goals”.

## Preview

- `npm run start:simulator` starts Metro for an already running iOS simulator and opens the app. The helper uses IPv4 localhost to avoid the connection mismatch found on this Mac.
- Expo Go in the iOS simulator needs no Expo account. Physical-iPhone Expo Go SDK57 requires the same Expo login in the app and CLI. No login is configured. A standalone physical build needs Apple signing.
- Official Expo policy: https://expo.dev/changelog/expo-go-57-login

## Core features

- Guest entry; numerical meal targets or a qualitative goal, meal type, radius, diet and exclusions. Collapsed filters add EUR budget, cuisine, open-now and optional carbohydrate/fat limits. Remaining calories and later meal notes provide context without silently changing meal limits.
- Hamburg Zentrum launch area. Top three real recommendations in terrain Map/List; shared restaurant coordinates use one marker with a dish count and preview cycling. Distances are explicitly straight-line, not walking minutes.
- Numeric Match Scores and evidence-based qualitative goal labels. Unknown nutrition stays unscored; missing hard-filter evidence excludes a meal. Dietary/allergen claims are never inferred from partial ingredients.
- Meal details with provenance, recipe/portion caveats, partial ingredients, current availability and published opening-hour uncertainty. Get directions and Choose this meal close the journey.
- Separate meal and restaurant favourites, chosen/eaten history, recommendation ratings, camera/library photos copied to persistent app storage, derived profile counts.
- Menu URL/text/photo intake. Optional Tesseract.js7 photo OCR runs in an embedded WebView on the device; its code and English/German language files are downloaded from jsDelivr. Users review literal source lines and explicitly confirm dish names, price, coordinates and any stated nutrition. No meal is automatically published or independently verified by this process.
- Private correction notes and support feedback, data export through system sharing, permission controls, deletion of app-owned records/photo copies. Reports are labelled saved locally; no support delivery endpoint is configured.

Preferences, imported meals, history, feedback and photo references persist via a versioned AsyncStorage snapshot. Old preference-only records migrate additively; corrupted records reject instead of being overwritten. Native data does not sync with the website. Original camera-roll images are never deleted by the app.

## Real pilot data and limits

`src/catalog.ts` contains six real standard dishes at HANS IM GLÜCK Altes Rathaus, Hamburg. Local menu confirms dishes/prices; official chain nutrition describes standard-recipe averages, not measured individual portions. Source records and audit: `../reference-data/HAMBURG-SOURCES.md`. This is one curated restaurant, not citywide coverage or live inventory. No unverified food image is shown.

Published normal hours use Europe/Berlin, closing boundaries and daylight saving time. Labels state that exceptions are possible; schedules older than 30 days are treated as unknown. Recent explicit open/closed checks override schedules.

Automatic nutrition estimation and a live restaurant data service remain unconnected. OCR can misread a menu; review is required and a manual path remains available. No synthetic test fixtures appear in the production catalog.

## Validation

- `npm run typecheck` passes.
- `node --test tests/*.test.mjs`: 24 checks for targets, unknown evidence, all new filters, Berlin opening hours, menu review, chosen versus eaten, ratings/photos, migration and corrupted data.
- `npm run check:ios` exports the iOS Hermes bundle successfully (772 modules).
- Package versions installed with Expo SDK57 compatibility mapping; local `expo install --check` reports up to date.
- Simulator runtime checks passed: home/targets, Hamburg terrain and recentering, Map/List, chosen → eaten, rating 4, attached photo, persisted state after Metro reload, and derived profile counts. Photo OCR returned the exact text from a clearly labelled synthetic verification image; the fixture was not added to the catalog. Confirmed removal of that isolated history entry restores the empty-history state; an isolated state-preservation test also covers removal.

## Map and assets

Mize reuses the project’s generated reference asset. Native Apple map controls show OpenTopoMap terrain tiles softened to 58% opacity, with visible OpenStreetMap/SRTM/OpenTopoMap credits. Shared restaurant markers use real coordinates without jitter. This is not the Google Maps provider. https://opentopomap.org/about
