import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activityStats, chooseMeal, createImportedMeal, emptyActivity, menuLineCandidates, restaurantKey, removeHistoryEntry, updateHistory, validateActivity } from '../src/activity.ts';
import { defaults, rankMeals } from '../src/domain.ts';

const source = { restaurant: 'Fixture restaurant', name: 'Fixture dish', lat: '53.5503', lon: '9.9920', sourceUrl: '', sourceText: 'Fixture dish as transcribed from test menu', photoUri: null, calories: '', protein: '', carbs: '', fat: '', price: '', cuisine: '', ingredients: '', diet: 'Unknown', mealType: 'Lunch' };

test('menu candidates only reuse literal source lines and explicit prices for review', () => {
  assert.deepEqual(menuLineCandidates('Fixture dish 12,50 €\nOther fixture dish\nProtein 40g\nFixture dish 12,50 €'), [{ name: 'Fixture dish', price: '12.50' }, { name: 'Other fixture dish', price: null }]);
  assert.deepEqual(menuLineCandidates(''), []);
});

test('manual menu intake requires source and explicit restaurant coordinates', () => {
  for (const patch of [{ restaurant: '' }, { name: '' }, { lat: '' }, { lon: '' }, { lat: '91' }, { sourceText: '' }, { sourceUrl: 'javascript:alert(1)' }, { calories: 'NaN' }, { protein: '-5' }]) assert.throws(() => createImportedMeal({ ...source, ...patch }));
});

test('menu imports never fabricate nutrition, meal photos, availability or independent verification', () => {
  const meal = createImportedMeal({ ...source, photoUri: 'file:///fixture-menu.png' });
  assert.equal(meal.provenance, 'user');
  assert.equal(meal.sourcePhotoUri, 'file:///fixture-menu.png');
  assert.equal(meal.imageUrl, null);
  assert.equal(meal.nutritionStatus, 'unknown');
  assert.equal(meal.calories, null);
  assert.equal(meal.available, null);
  assert.equal(meal.openingStatus, 'unknown');
  const match = rankMeals([meal], defaults, { lat: 53.5503, lon: 9.9920 })[0];
  assert.ok(match);
  assert.equal(match.score, null);
  assert.equal(match.exact, false);
  assert.equal(rankMeals([meal], { ...defaults, openNow: true }, meal).length, 0);
});

test('transcribed numbers keep provenance and a decimal EUR price, with no allergy guarantees', () => {
  const meal = createImportedMeal({ ...source, calories: '550', protein: '44', price: '12,50', ingredients: 'rice, beans', diet: 'Vegan' });
  assert.equal(meal.priceAmount, 12.5);
  assert.equal(meal.currency, 'EUR');
  assert.equal(meal.nutritionStatus, 'estimated');
  assert.match(meal.assumptions, /no AI estimate/);
  assert.equal(meal.excludedIngredientChecks, null);
  assert.equal(rankMeals([meal], { ...defaults, exclusions: ['peanuts'] }, meal).length, 0);
});

test('choosing snapshots a meal, does not count as eaten and prevents duplicate pending choices', () => {
  const meal = createImportedMeal(source);
  const originalName = meal.name;
  const activity = chooseMeal(emptyActivity(), meal);
  meal.name = 'Changed source name';
  assert.equal(activity.history[0].meal.name, originalName);
  assert.equal(activityStats(activity, []).chosen, 1);
  assert.equal(activityStats(activity, []).eaten, 0);
  assert.equal(chooseMeal(activity, meal).history.length, 1);
});

test('eaten status, ratings and photos persist independently and counts are derived from real records', () => {
  const meal = createImportedMeal(source);
  const activity = chooseMeal(emptyActivity(), meal);
  const entryId = activity.history[0].id;
  const updated = updateHistory(activity, entryId, { eatenAt: new Date().toISOString(), rating: 4, photoUri: 'file:///fixture-meal.jpg' });
  assert.deepEqual(activityStats(updated, [meal.id]), { chosen: 1, eaten: 1, photos: 1, rated: 1, favourites: 1, restaurants: 0 });
  assert.equal(activity.history[0].eatenAt, null);
  assert.equal(updateHistory(updated, entryId, { eatenAt: null }).history[0].rating, 4);
  assert.equal(chooseMeal(updated, meal).history.length, 2);
  assert.throws(() => updateHistory(updated, entryId, { rating: 6 }));
  assert.throws(() => updateHistory(updated, entryId, { photoUri: 'https://unapproved.example/photo.jpg' }));
  assert.throws(() => updateHistory(updated, 'missing-entry', { rating: 4 }));
});

test('activity migration is additive and corrupted persisted data is rejected', () => {
  assert.deepEqual(validateActivity(undefined), emptyActivity());
  const meal = createImportedMeal(source);
  const activity = { ...chooseMeal(emptyActivity(), meal), importedMeals: [meal], savedRestaurants: [restaurantKey(meal)], reports: [{ id: 'report', mealId: meal.id, mealName: meal.name, text: 'Price was incorrect', createdAt: new Date().toISOString(), status: 'saved-locally' }] };
  const restored = validateActivity(JSON.parse(JSON.stringify(activity)));
  assert.deepEqual(restored, activity);
  assert.equal(activityStats(restored, []).restaurants, 1);
  assert.throws(() => validateActivity({ ...activity, history: [{ ...activity.history[0], eatenAt: 'bad date' }] }));
  assert.throws(() => validateActivity({ ...activity, reports: [{ ...activity.reports[0], status: 'sent' }] }));
  assert.throws(() => validateActivity({ ...activity, importedMeals: [{ ...meal, lat: 'invalid' }] }));
});


test('removing one history entry preserves other choices, favourites and source data', () => {
  const first = createImportedMeal(source), second = createImportedMeal({ ...source, name: 'Another fixture dish' });
  const activity = chooseMeal(chooseMeal(emptyActivity(), first), second);
  activity.savedRestaurants = [restaurantKey(first)];
  activity.importedMeals = [first, second];
  const updated = removeHistoryEntry(activity, activity.history[0].id);
  assert.equal(updated.history.length, 1);
  assert.equal(updated.history[0].meal.id, first.id);
  assert.deepEqual(updated.savedRestaurants, activity.savedRestaurants);
  assert.deepEqual(updated.importedMeals, activity.importedMeals);
  assert.equal(activity.history.length, 2);
});
