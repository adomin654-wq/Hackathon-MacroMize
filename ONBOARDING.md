# Onboarding and the meal finder

Web and iOS now start new guests with Welcome → Search method → Set your macros → Find my meals. The manual route starts with empty macro inputs. Goal presets suggest calories and protein for confirmation. Both routes save numeric matching preferences. Fat and carbohydrate limits remain optional.

Returning guests land on Find my meals, with a macro header, location search, a separate map and all eligible recommendations, with Map and List tabs. The four header macro fields can be edited directly; blur or Enter validates and saves them, refreshing matches. Failed saves retain the draft and offer a retry. Recommendations use compact, clickable photo rows with calories, protein, distance and a small match score. Missing photos have an explicit placeholder. Get directions is available only in the meal detail view. The detail stack contains restaurant website, recommendation reasons, ingredient evidence and meal/restaurant saves. Missing ingredient evidence is labelled without fabricating a photo estimate. Details and history remain available. Main navigation is Find my meals, Favourites and Profile.

## State and compatibility

- `onboardingCompleted` is stored alongside preferences. Final confirmation writes it with validated macros; failed saves do not complete onboarding.
- Native version-1 records remain readable. Missing flags in existing valid records mean completed; missing storage means a fresh user. Corrupt records reject without overwriting them.
- Web migration `0003_onboarding.sql` adds `guest_state.onboarding_completed`, defaulting existing rows to completed. GET returns false when no row exists. PUT accepts an optional boolean; older callers that omit it preserve an existing row's value.
- Preferences being edited are separate from committed matching targets. Cancelling changes keeps the header and recommendations unchanged.
- Existing qualitative preferences are preserved until the macro editor is confirmed. Deleting app data clears completion. Web and native storage remain separate.
- Location is requested on first meal-finder entry and refreshed at startup if permitted. Denied access leaves manual area search and the labelled Hamburg search area available. Native refreshes only on returning to the foreground, without subscribing to background location.

## Release order

1. Apply the existing migrations and then `0003_onboarding.sql` to the agreed web environment before deploying the new web code. Older code tolerates the added column.
2. Deploy web and native app updates. No Supabase activation or catalog publication is part of this change.
3. Smoke-test fresh onboarding, restarting into the map, legacy preferences, favourites, denied location and failed saves. When rolling back application code, leave the additive column in place.

No shared or production database migration or deployment was performed during implementation. Browser checks used a separate in-memory local database.

## Validation

- Web and native TypeScript checks pass.
- Existing matching/activity and catalog integration tests pass. Added tests cover persistence, legacy migration, atomic failures, retained and live catalog favourite IDs, zero-to-three recommendation cards and missing nutrition/website data.
- Browser checks cover both onboarding routes, draft retention, numeric prefill, completion, restarting directly into the map, persisted meal/restaurant favourites, slider navigation, cancelled macro edits and a zero-result filter.
- iOS JavaScript export succeeds with 780 modules using `--no-bytecode`; this is a debugging bundle check, not a production Hermes build or device interaction test.
- Full web production build and Hermes bytecode export are blocked in this Windows environment by `spawn EPERM` (esbuild / Hermes). An iOS simulator/device was not available here. These remain release checks.

Run the tests with Node 24; this Windows sandbox requires `node --test --test-isolation=none tests/*.test.mjs` to avoid spawning test subprocesses. Run root integration tests with the same isolation option against `scripts/tests/*.test.mjs`.

The inline-header refinement passes both TypeScript checks and all 24 web / 28 native tests. Browser checks verify inline persistence across reload, required-field validation, score updates, and the mobile recommendation layout. Native device interaction remains unverified.

Compact recommendation refinement: browser checked mobile card sizing, opening details and returning, small scores and detail-only saves. Both typechecks, 24 web tests and the iOS no-bytecode export pass.

Map/List refinement: Map shows all eligible results grouped by restaurant, using the original Avocado-Pin 1A SVG/PNG from MacroMize-Logo-Deck-korrigiert.pptx (slide 2 media). Marker counts describe meals, never match scores. List shows every compact card in ranking order, with distance breaking equal scores. The chosen view survives detail navigation. Browser validation covered 112 results across three restaurant markers, marker selection (56/112), vertical listing and return to List. 25 web and 28 native tests pass; both typechecks and the native no-bytecode export pass.

Simplified preferences: all app forms expose only calories, minimum protein, optional carbohydrate/fat ceilings and Vegan. Header Vegan saves directly. App loading/saving normalizes obsolete preference fields; ranking ignores meal-type and radius cutoffs, and clears price, cuisine, opening-hours, exclusion and daily-context constraints. Legacy schema fields remain readable for backwards compatibility. Existing favourites, history and imports are retained. Map recommendations remain top-three, List includes all results and no location-search controls. Both typechecks, 27 web tests (including cross-platform obsolete-filter and vegan checks), 28 native tests and native no-bytecode export pass. Browser checked Profile fields and Vegan on/off result updates.
