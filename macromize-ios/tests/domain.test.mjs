import assert from "node:assert/strict";
import { test } from "node:test";
import { defaults, distanceKm, openingInfo, rankMeals, validateTargets } from "../src/domain.ts";

// These synthetic records are test fixtures only; production uses independently sourced pilot records.
const location = { lat: 52.52, lon: 13.405 };
function fixture(overrides = {}) {
  return {
    id: "fixture", name: "Test meal", restaurant: "Test restaurant", menuUrl: "https://example.com/menu",
    checkedAt: "2026-09-01T00:00:00Z", ...location, ingredients: ["rice"], ingredientsComplete: true,
    dietary: ["vegan"], excludedIngredientChecks: { peanuts: true }, mealTypes: ["Lunch"],
    calories: 550, protein: 45, carbs: 60, fat: 15, nutritionStatus: "verified",
    nutritionSource: "Test fixture", confidence: "High", assumptions: null,
    price: null, imageUrl: null, available: true, ...overrides,
  };
}

test("targets reject non-finite numbers, invalid enums and empty exclusions", () => {
  for (const patch of [{ calories: NaN }, { protein: Infinity }, { radius: 0 },
    { calories: "600" }, { diet: "pescatarian" }, { mealType: "Brunch" }, { exclusions: [" "] }]) {
    assert.throws(() => validateTargets({ ...defaults, ...patch }));
  }
  assert.deepEqual(validateTargets({ ...defaults, exclusions: [" Peanuts ", "peanuts"] }).exclusions, ["Peanuts"]);
});

test("distance handles coincident and antipodal points and rejects invalid coordinates", () => {
  assert.equal(distanceKm(location, location), 0);
  assert.ok(Math.abs(distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 180 }) - Math.PI * 6371) < 0.001);
  assert.throws(() => distanceKm({ lat: 91, lon: 0 }, location));
});

test("known unavailable meals, invalid source data and locations outside radius never qualify", () => {
  const candidates = [fixture({ available: false }), fixture({ menuUrl: "https://" }),
    fixture({ checkedAt: "not a date" }), fixture({ lat: NaN }), fixture({ lat: 53.52 }), fixture()];
  assert.equal(rankMeals(candidates, defaults, location).length, 1);
});

test("unknown availability remains visible with an explicit label", () => {
  const matches = rankMeals([fixture({ available: null })], defaults, location);
  assert.equal(matches.length, 1);
  assert.ok(matches[0].reasons.includes("Current availability is unconfirmed"));
});

test("diet, meal type and exclusions fail closed and contradictory ingredients do not pass", () => {
  const targets = { ...defaults, diet: "Vegetarian", exclusions: ["Peanuts"] };
  const candidates = [fixture({ dietary: null }), fixture({ mealTypes: ["Dinner"] }),
    fixture({ excludedIngredientChecks: null }), fixture({ excludedIngredientChecks: { peanuts: false } }),
    fixture({ ingredients: ["peanuts"] }), fixture()];
  assert.equal(rankMeals(candidates, targets, location).length, 1);
});

test("unknown nutrition cannot receive a numeric score or retain untrusted numeric macros", () => {
  const matches = rankMeals([fixture({ nutritionStatus: "unknown" })], defaults, location);
  assert.equal(matches[0].score, null);
  assert.equal(matches[0].calories, null);
  assert.equal(matches[0].exact, false);
});

test("invalid nutrition is not scored; estimates remain labeled and cannot claim an exact match", () => {
  assert.equal(rankMeals([fixture({ calories: -20 })], defaults, location)[0].score, null);
  assert.equal(rankMeals([fixture({ protein: Infinity })], defaults, location)[0].score, null);
  const estimated = rankMeals([fixture({ nutritionStatus: "estimated" })], defaults, location)[0];
  assert.equal(estimated.exact, false);
  assert.ok(estimated.reasons.includes("Nutrition is estimated"));
});

test("ranks quantified target fits before near matches and unknown nutrition without mutating inputs", () => {
  const candidates = [fixture({ id: "unknown", protein: null }), fixture({ id: "near", protein: 20 }), fixture({ id: "fit" })];
  const before = JSON.stringify(candidates);
  const matches = rankMeals(candidates, defaults, location);
  assert.deepEqual(matches.map((meal) => meal.id), ["fit", "near", "unknown"]);
  assert.equal(matches[0].exact, true);
  assert.equal(matches[1].exact, false);
  assert.equal(JSON.stringify(candidates), before);
});

test("zero protein target does not divide by zero", () => {
  const match = rankMeals([fixture({ protein: 0 })], { ...defaults, protein: 0 }, location)[0];
  assert.equal(match.score, 100);
  assert.equal(match.exact, true);
});

test("legacy preferences migrate without silently coercing new fields", () => {
  const legacy = { calories: 650, protein: 35, radius: 3, mealType: "Dinner", diet: "Vegan", exclusions: [] };
  const migrated = validateTargets(legacy);
  assert.equal(migrated.mode, "numeric");
  assert.equal(migrated.calories, 650);
  assert.equal(migrated.budgetMax, null);
  assert.equal(migrated.openNow, false);
  assert.equal(migrated.laterMeal, "");
  for (const patch of [{ carbsMax: "40" }, { fatMax: NaN }, { budgetMax: -1 }, { openNow: "true" },
    { remainingCalories: Infinity }, { laterMeal: "x".repeat(161) }, { mode: "goal", goal: "unsupported" }]) {
    assert.throws(() => validateTargets({ ...defaults, ...patch }));
  }
});

test("budget, cuisine and macro limits exclude missing, contradictory and unusable evidence", () => {
  const targets = { ...defaults, budgetMax: 15, cuisine: "Japanese", carbsMax: 65, fatMax: 20 };
  const valid = fixture({ priceAmount: 12, currency: "EUR", cuisine: "Japanese" });
  const candidates = [valid, { ...valid, id: "no-price", priceAmount: null }, { ...valid, id: "other-currency", currency: "USD" },
    { ...valid, id: "expensive", priceAmount: 16 }, { ...valid, id: "no-cuisine", cuisine: null },
    { ...valid, id: "wrong-cuisine", cuisine: "Italian" }, { ...valid, id: "many-carbs", carbs: 80 },
    { ...valid, id: "no-fat", fat: null }, { ...valid, id: "unknown-nutrition", nutritionStatus: "unknown" }];
  assert.deepEqual(rankMeals(candidates, targets, location).map((meal) => meal.id), ["fixture"]);
});

test("open-now requires a recent explicit check; unknown, stale and future checks fail closed", () => {
  const now = Date.parse("2026-09-12T12:00:00Z");
  const open = fixture({ openingStatus: "open", openingCheckedAt: "2026-09-12T11:00:00Z" });
  const candidates = [open, { ...open, id: "closed", openingStatus: "closed" },
    { ...open, id: "unknown", openingStatus: "unknown" }, { ...open, id: "stale", openingCheckedAt: "2026-09-12T09:59:00Z" },
    { ...open, id: "future", openingCheckedAt: "2026-09-13T12:00:00Z" }, { ...open, id: "missing", openingCheckedAt: null }];
  assert.deepEqual(rankMeals(candidates, { ...defaults, openNow: true }, location, now).map((meal) => meal.id), ["fixture"]);
  assert.equal(rankMeals(candidates, defaults, location, now).length, candidates.length);
});

test("remaining daily calories supplies context without changing inclusion, order, score or exactness", () => {
  const candidates = [fixture({ id: "within", calories: 400 }), fixture({ id: "over", calories: 550 }), fixture({ id: "unknown", calories: null })];
  const summary = (meals) => meals.map(({ id, score, exact }) => ({ id, score, exact }));
  const baseline = rankMeals(candidates, defaults, location);
  const withContext = rankMeals(candidates, { ...defaults, remainingCalories: 500 }, location);
  assert.deepEqual(summary(withContext), summary(baseline));
  assert.deepEqual(summary(rankMeals(candidates, { ...defaults, remainingCalories: 0 }, location)), summary(baseline));
  assert.ok(withContext.find((meal) => meal.id === "over").reasons.includes("50 kcal above the amount you have left today (context only)"));
  assert.ok(withContext.find((meal) => meal.id === "unknown").reasons.includes("Calories unavailable; remaining daily calories cannot be compared"));
});

test("user text and photo imports need a source reference and date and cannot claim verified exactness", () => {
  const text = fixture({ id: "text", menuUrl: "", sourceKind: "text", sourceReference: "Menu transcribed from restaurant board", provenance: "user" });
  const photo = { ...text, id: "photo", sourceKind: "photo", sourceReference: "file:///menu-photo.jpg" };
  const candidates = [text, photo, { ...text, id: "no-reference", sourceReference: " " },
    { ...text, id: "no-provenance", provenance: undefined }, { ...text, id: "no-date", checkedAt: "unknown" }];
  const matches = rankMeals(candidates, defaults, location);
  assert.deepEqual(matches.map((meal) => meal.id).sort(), ["photo", "text"]);
  assert.ok(matches.every((meal) => !meal.exact && meal.reasons.includes("Menu entered by you; not independently verified")));
});

test("general goals rank evidence qualitatively and never expose numeric scores or exact macro claims", () => {
  const candidates = [fixture({ id: "unknown", nutritionStatus: "unknown" }), fixture({ id: "low", protein: 10 }),
    fixture({ id: "good", protein: 45 }), fixture({ id: "possible", protein: 35 })];
  const matches = rankMeals(candidates, { ...defaults, mode: "goal", goal: "High protein" }, location);
  assert.deepEqual(matches.map((meal) => meal.id), ["good", "possible", "low", "unknown"]);
  assert.deepEqual(matches.map((meal) => meal.goalFit), ["Strong", "Possible", "Limited", "Unknown"]);
  assert.ok(matches.every((meal) => meal.score === null && !meal.exact));
  assert.ok(matches.every((meal) => !meal.reasons.some((reason) => reason.includes("calorie target"))));
  const light = rankMeals([fixture({ id: "big", calories: 800 }), fixture({ id: "light", calories: 400 })],
    { ...defaults, mode: "goal", goal: "Eat lighter" }, location);
  assert.equal(light[0].id, "light");
  const incomplete = rankMeals([fixture({ carbs: null })], { ...defaults, mode: "goal", goal: "Post workout" }, location)[0];
  assert.equal(incomplete.goalFit, "Unknown");
});

test('published opening hours respect Berlin time, closing boundaries, fresh overrides and source age', () => {
  const hours = { timeZone: 'Europe/Berlin', sourceUrl: 'https://example.com/hours', checkedAt: '2026-09-12T07:00:00Z', weekly: [{ days: [0, 1, 2, 3, 4], open: '12:00', close: '22:00' }, { days: [5, 6], open: '12:00', close: '23:00' }] };
  const meal = fixture({ openingHours: hours });
  assert.equal(openingInfo(meal, Date.parse('2026-09-12T09:59:00Z')).open, false);
  assert.equal(openingInfo(meal, Date.parse('2026-09-12T10:00:00Z')).open, true);
  assert.equal(openingInfo(meal, Date.parse('2026-09-12T21:00:00Z')).open, false);
  const match = rankMeals([meal], { ...defaults, openNow: true }, location, Date.parse('2026-09-12T12:00:00Z'))[0];
  assert.ok(match.reasons.includes('Open according to published hours; exceptions possible'));
  assert.equal(openingInfo({ ...meal, openingStatus: 'closed', openingCheckedAt: '2026-09-12T11:30:00Z' }, Date.parse('2026-09-12T12:00:00Z')).open, false);
  assert.equal(openingInfo(meal, Date.parse('2026-11-12T12:00:00Z')).open, null);
  const winter = { ...meal, openingHours: { ...hours, checkedAt: '2026-12-12T07:00:00Z' } };
  assert.equal(openingInfo(winter, Date.parse('2026-12-12T10:00:00Z')).open, false);
  assert.equal(openingInfo(winter, Date.parse('2026-12-12T11:00:00Z')).open, true);
});
