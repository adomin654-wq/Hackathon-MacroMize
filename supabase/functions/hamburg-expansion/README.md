# Hamburg menu expansion

Administrator-only, explicit one-off batch import of 21 menu URLs linked by restaurant websites. No arbitrary URL input, no scheduling, no public database grants, no automatic paid retry. Gateway JWT verification stays enabled. `FIRECRAWL_API_KEY` and database credentials stay server-side.

`POST {"action":"start"}` reserves an audited batch before submitting to Firecrawl. JSON extraction requests at most five main dishes per menu. PDF parsing and JSON extraction consume Firecrawl credits in addition to HTML scraping. The source job ID is saved for recovery. If submission has an uncertain outcome, inspect it instead of changing the version and resubmitting.

`POST {"action":"collect"}` polls the existing batch. Once complete it checks page status, validates extracted names against normalized source text, saves raw menu snapshots and provenance, and inserts draft restaurants/dishes. Descriptions not found in the source text are omitted. A source lock and completed per-source run prevent duplicates on repeated collection. A restaurant is inserted only when at least one source-grounded dish exists.

`POST {"action":"export"}` returns the new dish records and venue metadata for refreshing the bundled app catalog. Review the result before updating that snapshot. This endpoint requires administrator authentication for every action.

Nutrition, prices and dietary classifications are intentionally not guessed. New dishes have no numerical match until nutritional evidence is added. The separate ten-dish OpenAI pilot is unaffected.

Locations derive from OpenStreetMap (ODbL), Overpass data timestamp 2026-07-24, retrieved 2026-09-13. Individual OSM source links are stored for each venue. Restaurant websites supplied menu links; older PDFs remain labelled as potentially dated. Fetch success does not guarantee current availability or a restaurant's nutritional verification. See https://www.openstreetmap.org/copyright for attribution and data terms.

Verified result (2026-09-13): batch 01a099d5-d7f3-73c5-922a-91133ee084fe completed, 19 restaurants and 90 dishes imported, 164 Firecrawl credits reported. Piccolo Paradiso (no grounded dishes) and Il Siciliano (no valid page) were skipped. Total bundled catalog: 22 restaurants / 249 dishes. Web and native snapshots are synchronized. The app map showed all 22 restaurant pins with default demo targets; narrower filters can hide dishes with unknown data.
