# Menu-based AI estimates

Administrator-only, bounded enrichment of the Hamburg demo catalog using the server-side `OPENAI_API_KEY` and `SUPABASE_DB_URL`. Keep JWT verification enabled and use the existing administrator authentication. Never put these credentials in a web or Expo client.

The function estimates calories, protein, carbohydrates and fat from the existing dish title, description and menu category. It stores the assumed portion, ingredient quantities, model, usage and provenance in a new `ai_estimated` nutrition version. `approved` means it passed automated validation for display as an estimate; it is not restaurant verification. Web and native cards display **KI-geschätzt** and the details retain the portion assumptions. Published values are excluded from this batch list, and existing current nutrition is not replaced.

Requests through the authenticated Supabase function test panel:

- `{"action":"estimate","batch":0}` through batch `8`: at most 30 dishes in each fixed group. No automatic retries; audit reservations prevent repeated paid requests.
- `{"action":"export"}`: current AI nutrition plus import run outcomes. Merge by dish UUID into the canonical catalog snapshot, then run `node scripts/sync-catalog.mjs`.
- `{"action":"activate_pilot"}`: activates the ten prior v2 pilot estimates after automated plausibility checks; idempotent.

Recognizable titles can support a labelled estimate without a long description. Ambiguous entries remain unscored and absent from recommendations. Dietary labels are not inferred by the model. A numerical match describes alignment with the selected macro target, not the accuracy of the estimated nutrition.

Batch zero initially failed because an output UUID was mistyped. A second response was recovered with that one identity corrected against the original batch, preserving all nutrition values. The administrator-only `recover` action accepts a previously captured Responses result through the same validation/storage path without another OpenAI call. Subsequent API schemas constrain IDs to the actual candidate UUIDs. Failed audit runs remain available.

Stored results are reused by the app; opening the map does not call OpenAI. The function's `estimated_cost_usd` is an approximate token-cost calculation, not the account's billing statement.

Context corrections: batch 9 recalculates Erdapfel with its baked-potato base (verified on the restaurant website); batch 10 recalculates three ramen dishes with explicit noodle servings. Superseded AI versions are retained as rejected. The corresponding administrator actions are `fix_erdapfel_context` and `fix_ramen_context`; each targets only the known original estimate versions.

Demo result (2026-09-13): 182 current AI estimates; 184 available complete-nutrition meals across 20 restaurants after merging six curated published meals and excluding four Express-only products. 61 catalog entries remain unknown and hidden from recommendations. Snapshot copies are synchronized for web and iOS.
