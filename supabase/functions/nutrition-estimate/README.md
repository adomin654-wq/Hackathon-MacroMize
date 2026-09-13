# Nutrition estimate pilot

Administrator-only POST endpoint; keep gateway JWT verification enabled. Uses server-side `OPENAI_API_KEY`, `SUPABASE_DB_URL` and existing Supabase administrator credentials. Never place these credentials in either app.

- `{"action":"status"}` reads up to ten eligible HANS IM GLUECK burger descriptions without calling OpenAI.
- `{"action":"estimate"}` reserves one audited pilot run, calls `gpt-5-mini` once, validates structured results and stores eligible estimates as `ai_estimated`, `pending`, `is_current=false`.
- `{"action":"diagnose"}` makes one minimal OpenAI request and returns only its HTTP status, sanitized error code and token usage. Use deliberately; do not poll.

The run reservation prevents an automatic retry, including after a failed request. Inspect the existing run before deliberately changing the pilot version for a retry. No estimated values become visible to users until separately reviewed and integrated. Existing restaurant nutrition is preserved.

Estimates include German portion and ingredient assumptions, oil/sauce quantities and a plausible calorie range. This range represents portion scenarios, not a statistical confidence interval. Classification as vegetarian/vegan is not inferred by this function. Cost reporting uses an indicative USD token-price calculation; billing remains authoritative.

## Verified deployment status, 2026-09-13

Deployed to project `esimnakchvqwwdchdmrx` with JWT verification enabled. Status returned ten eligible dishes and confirmed the server secret exists. The initial estimate request failed with HTTP 429; run `5eff1202-4aae-4cd3-accf-fed060418b4e` remains in the audit log. A subsequent diagnostic returned `credit_balance_exhausted`. No nutrition estimates were saved. The key's organization needs usable billing credit before retrying. A displayed spending limit is not proof of available credit.

After the user confirmed credit activation, a diagnostic returned HTTP 200. A deliberate v2 retry then returned `saved_pending_review`, with all ten estimates saved. Reported usage: 928 input tokens and 4,996 output tokens; indicative calculated cost: USD 0.010224 for the batch. The original v1 failure remains preserved. Estimates include portion assumptions and scenario ranges; they remain pending and non-current. This is a successful integration test, not independent verification of nutritional accuracy.

Local validation: `deno check supabase/functions/nutrition-estimate/index.ts` passed again. Restaurant expansion to 20–30 locations and displaying reviewed AI estimates in the apps remain pending; the apps still use the existing three-restaurant snapshot.
