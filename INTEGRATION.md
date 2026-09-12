# App and Supabase integration

Branch: `codex/integrate-app-backend`, created from `origin/main` at `6bbd916`.
This branch is for review. It does not deploy an app, execute database migrations, change Supabase grants, or merge into main.

## Data flow

```text
Restaurant websites → firecrawl-import → Supabase makromize schema
                                              ↓
                         macromize-catalog (administrator-only Edge Function)
                                              ↓ server credential only
                            Web app GET /api/meals → web map and filters
                                              ↓ public restaurant facts only
                                        Expo iOS app
```

The web app retains its existing D1 guest preferences/history and R2 photo storage. The native app retains its existing device-local storage. Personal records and photos are not sent to the catalog function. There is no new account sync or database migration.

Both clients now use the same 159-entry Hamburg snapshot from 12 September 2026, covering HANS IM GLÜCK Altes Rathaus, dean&david Jungfernstieg and PETER PANE Bleichenhof. It includes sides, dips, sweets and offers, not only main dishes. Four Express-only entries are excluded from Jungfernstieg recommendations. Prices and source notes remain attached; chain availability is not asserted.

The six previously curated HANS dishes keep their original IDs and published nutrition, protecting existing favourites and history. Matching by restaurant ID and exact normalized dish name avoids duplicate entries. All dishes at a restaurant use the same venue coordinates. The other 51 chain-nutrition matches are still pending: their source records are retained in the raw snapshot, but are **not converted into verified values or scores**. A live source becomes usable only when its review is approved, current, complete and sourced. No AI estimates are manufactured.

Existing numeric matching stays unchanged: calories/protein fit plus straight-line distance determine the score; selected carbohydrate/fat limits and diet are eligibility filters. This branch does not introduce a new weighting formula. Vegetarian includes vegan, unknown exclusions fail closed, and unknown nutrition remains unknown.

## Offline and error behaviour

- With no backend configuration, `/api/meals` returns the bundled snapshot with status `snapshot`.
- With a working Supabase connection it returns `connected`; requests have a 10-second timeout and are not cached.
- Failed authentication, malformed responses and connection failures return a labelled `stale` snapshot. Raw errors and credentials are never returned to clients.
- iOS starts with the same bundled catalog and fetches the configured web endpoint once on app mount. It does not scrape menus when someone searches. Restart the app to fetch again; there is no background schedule yet.
- Local imports, favourites, ratings and photo ownership keep using their existing storage paths.

## Activating live data after branch review

Nothing in this section has been executed against the shared project by this branch.

1. Review and deploy `supabase/functions/macromize-catalog` to the existing Supabase project `esimnakchvqwwdchdmrx`. Keep JWT verification enabled. The function also checks administrator credentials itself and uses the existing `SUPABASE_DB_URL`. It opens a read-only transaction and only selects public restaurant/menu fields from the three pilot restaurants. It accepts no SQL, source URL or restaurant selection from callers. No public-schema grants are needed.
2. Configure these **server-only secrets/bindings** on the web app backend:

   - `SUPABASE_CATALOG_URL=https://esimnakchvqwwdchdmrx.supabase.co/functions/v1/macromize-catalog`
   - `SUPABASE_CATALOG_KEY`: the existing legacy Supabase **service-role JWT**, so the JWT gateway and function check both succeed. Never use an anon/publishable key here, never commit the value, and never prefix it with `NEXT_PUBLIC_` or `EXPO_PUBLIC_`.

   Local Cloudflare development uses an ignored `.dev.vars` file. Hosted environments need corresponding runtime bindings. The key is confined to the backend request. Use the hosting provider's secrets UI rather than sharing login details.
3. Deploy the reviewed web branch to an agreed test environment. Check `/api/meals` returns `source: "supabase"` rather than treating a working fallback as proof of connectivity.
4. Configure iOS `EXPO_PUBLIC_CATALOG_API_URL=https://YOUR-AGREED-BACKEND/api/meals` and rebuild. This is a public URL, **not a secret**. No service-role or Firecrawl key belongs in the mobile bundle. A private Sites sign-in page cannot serve as an anonymously reachable native API: until an agreed endpoint is available, the app explicitly uses the snapshot.
5. Before making that endpoint anonymously reachable, confirm the intended audience. The earlier anonymous Supabase read-grant proposal remains unexecuted; this branch is not approval to publish the catalog or change site sharing.

Rollback: return app code to main or unset the two backend bindings to use the bundled snapshot. This does not undo changes to a shared database; none are made by this integration. No existing hosting project IDs are replaced and neither existing website is redeployed here.

## Catalog maintenance and checks

`reference-data/supabase-pilot-catalog.json` is the canonical snapshot. `macromize/lib/pilot-catalog.ts` is the canonical dependency-free adapter. Copies live inside each app so their independent lockfiles/builds remain usable without a workspace migration.

```sh
node scripts/sync-catalog.mjs
node scripts/sync-catalog.mjs --check
node --test scripts/tests/catalog.test.mjs
```

Run each app's existing tests, TypeScript check and build/export too. Keep `supabase/config.toml` JWT protection enabled. Real Supabase connectivity requires the runtime configuration above; local mock-response tests do not verify production connectivity. An iOS export is a bundle check, not an iPhone/simulator interaction test.

## Validation of this branch

Passed: 7 integration tests, 17 existing web tests, 24 existing native tests, both TypeScript checks, web production build and iOS Hermes export (775 modules). The running local GET /api/meals returned 159 entries across three venues with snapshot status; the native client accepted that actual response. No live Supabase request or iPhone interaction was tested.
