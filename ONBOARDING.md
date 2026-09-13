# Onboarding and the meal finder

Web and iOS start new guests with Welcome -> personal onboarding -> celebration -> meal finder. Get started opens the goal question directly; there is no search-method selector or manual bypass within onboarding. Daily targets and the goal are saved in the personal profile. The map edits targets for the current meal search without changing daily profile values. Existing completed accounts still open the map.

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

## Personal daily targets (2026-09-13)

The Help me choose route now asks one question per screen in both apps: goal,
age, sex used for the estimate, height in cm, weight in kg, training days and
activity outside training. Mize guides each step. A daily-macro review leads to
a 10–100% meal-share slider, initially exactly one third. Completion is saved
atomically with the profile and meal targets before showing the celebration.
Automatic estimates require age 18 or over; younger ages stay on the age question with an explanation. Meal targets remain editable from the map after onboarding.

Profile separates Daily targets from This meal. Editing goal/details computes a
preview; editing daily macros starts directly at the daily review. Neither
changes committed values until Use these macros succeeds. The saved share is
used when daily targets change. Editing meal macros alone leaves daily values
unchanged. Web guest data and native device data still do not sync.

Calculation version 1 uses Mifflin–St Jeor (https://pubmed.ncbi.nlm.nih.gov/2305711/):
10 × kg + 6.25 × cm − 5 × years + 5 (Male) or −161 (Female). Activity factors
1.2/1.4/1.6 plus training increments 0/0.1/0.2/0.3 for 0/1–2/3–4/5–7 days are
product heuristics, not a validated activity questionnaire. Goal multipliers
are 1.10/0.85/1.15/1.00 for build/lose/gain/maintain. Protein is 2 g/kg for
build/lose and 1.6 otherwise (context: https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/).
Fat gets 30% of calories; carbohydrates get the remaining energy. Estimates
retain precision in storage and round only for display/meal targets.

Input bounds: age 18–120 whole years, height 100–250 cm, weight 30–350 kg,
training 0–7 whole days. Daily calories must be 1000–10000, protein 0–700 g,
fat 0–500 g and carbs 0–2000 g. Implausible estimates reject with a review/manual
route rather than silently clamping. These are input guards, not personalized
clinical thresholds. Manual daily edits are independent numeric targets.
Meal validation/editor bounds accommodate the full 100% share.

New meal targets store comparison=flexible. Their score combines relative
closeness of calories/protein/fat/carbs (35/35/10/10%) and distance (10%). Zero
targets fit only zero amounts. Missing required nutrition yields an unknown
score and stays visible. Existing targets default to comparison=limits and
keep their previous matching rules. Both implementations have parity tests.

### Migration and release

Apply 0004_personal_profile.sql after 0003, before releasing the web app.
The nullable guest_state.profile column preserves legacy rows; omitted profile
fields in older PUT callers preserve the existing profile. Explicit null clears
it. Native version-1 storage adds the optional profile without invalidating old
records. Deleting device/browser app data also clears the profile. The native
JSON export includes the profile. Keep the additive DB column on application
rollback. No shared database migration, publication or deployment was performed.

### Validation for this change

- Web and iOS TypeScript checks pass.
- 32 web tests, 29 native tests and 7 root integration tests pass. Coverage includes
  all goal/activity/training combinations, cross-platform calculation parity,
  missing nutrition, flexible and legacy comparisons, invalid inputs, exact
  one-third allocation, old API callers and atomic storage failure/retry.
- Browser checked mobile layout at 390 × 844, the complete flow, keyboard slider,
  age validation, saved answer prefill, daily-edit cancellation, new goal preview,
  celebration, matching targets and reload directly into meal search.
- Web production build passes. Native JavaScript export passes (783 modules, --no-bytecode);
  production Hermes bytecode export is blocked by Windows spawn EPERM. No iOS
  simulator/device is available here, so native device/accessibility interaction
  and the production Hermes build remain release checks.

### Onboarding input refinement

Goal and Gender now use single-choice dropdowns; Gender includes Non-binary.
The persisted `sex` key remains compatible with existing profiles. Non-binary
uses the arithmetic midpoint of the two existing resting-energy offsets (-78)
as an explicit product approximation, not a validated gender-specific formula.
Existing Male/Female calculations are unchanged. Height defaults to 180 cm for
Male and 170 cm for Female/Non-binary until the user edits it; returning to prior
steps retains a custom height. Height uses a 100–250 cm integer slider.
Age and weight have regular-size numeric inputs, and training uses a 1–7 days
slider with 1 preselected for new users. Legacy zero-day profiles still load;
opening the questionnaire starts their training slider at 1 and requires normal
confirmation before saving. The search-method screen has been removed. No guided onboarding step offers the manual-macros shortcut. The share step offers small (20%),
regular (exactly one third) and large (50%) meal examples alongside the slider.

### Supplied Mize animation

The welcome screen, questionnaire and celebration now use the user-supplied
`MIZE_-_Hallo_ohne_Worte (1).webm` character. The original 5-second VP9-alpha
animation is cropped to the character's movement bounds, resized to 376×496 and
encoded as silent H.264 MP4 for browser/iOS compatibility (94,982 bytes). Its
alpha is composited against the app's #f7f8f3 background. A transparent PNG from
0.2 seconds of the same source is the reduced-motion/loading/playback-failure
fallback. Assets are bundled locally in each app; no external media request is
needed. The greeting plays once per screen, pauses in the background and never
plays sound. Map pins and match-score graphics are unchanged.

Native playback uses the Expo SDK 57 compatible expo-video ~57.0.4 package.
Browser inspection verifies decoded playback, no media errors, muted playback,
completion after five seconds and the welcome/question layouts at 390×844.
Native device playback still needs an iPhone check; the Windows export verifies
the JavaScript bundle and bundled assets rather than AVPlayer behavior.

Celebration uses a separate generated Mize pose with both arms raised and a gentle two-second repeating hop (CSS on web, Animated on native). Reduced motion shows the still pose. The READY WHEN YOU ARE eyebrow is removed. The locally bundled celebration image uses the app background color.
