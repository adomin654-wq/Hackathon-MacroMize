import type { Meal, Targets } from './domain';

export type HistoryEntry = { id: string; meal: Meal; chosenAt: string; eatenAt: string | null; rating: number | null; photoUri: string | null };
export type Correction = { id: string; mealId: string | null; mealName: string | null; text: string; createdAt: string; status: 'saved-locally' };
export type Activity = { importedMeals: Meal[]; savedRestaurants: string[]; history: HistoryEntry[]; reports: Correction[] };
export const emptyActivity = (): Activity => ({ importedMeals: [], savedRestaurants: [], history: [], reports: [] });
export const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
export const restaurantKey = (meal: Meal) => meal.restaurantId || `${meal.restaurant.trim().toLowerCase()}|${meal.lat.toFixed(4)}|${meal.lon.toFixed(4)}`;
export function activityStats(activity: Activity, saved: string[]) {
  return { chosen: activity.history.length, eaten: activity.history.filter(e => e.eatenAt !== null).length, photos: activity.history.filter(e => e.photoUri !== null).length, rated: activity.history.filter(e => e.rating !== null).length, favourites: saved.length, restaurants: activity.savedRestaurants.length };
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const date = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const text = (value: unknown, max = 10000): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const id = (value: unknown): value is string => text(value, 512);
function isMeal(value: unknown): value is Meal {
  if (!record(value) || !id(value.id) || !text(value.name, 200) || !text(value.restaurant, 200) || !date(value.checkedAt)) return false;
  if (typeof value.lat !== 'number' || !Number.isFinite(value.lat) || Math.abs(value.lat) > 90 || typeof value.lon !== 'number' || !Number.isFinite(value.lon) || Math.abs(value.lon) > 180) return false;
  if (!Array.isArray(value.mealTypes) || value.mealTypes.some(v => !['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(v))) return false;
  if (!['unknown', 'estimated', 'verified'].includes(String(value.nutritionStatus))) return false;
  if (!['calories', 'protein', 'carbs', 'fat'].every(k => value[k] === null || (typeof value[k] === 'number' && Number.isFinite(value[k]) && (value[k] as number) >= 0))) return false;
  return typeof value.menuUrl === 'string' && (value.ingredients === null || (Array.isArray(value.ingredients) && value.ingredients.every(v => typeof v === 'string'))) && (value.dietary === null || (Array.isArray(value.dietary) && value.dietary.every(v => typeof v === 'string')));
}
/** Old preference records migrate with empty activity; damaged records fail instead of being overwritten. */
export function validateActivity(value: unknown): Activity {
  if (value === undefined) return emptyActivity();
  if (!record(value) || !Array.isArray(value.importedMeals) || value.importedMeals.some(m => !isMeal(m)) || !Array.isArray(value.savedRestaurants) || value.savedRestaurants.some(v => !id(v)) || !Array.isArray(value.history) || !Array.isArray(value.reports)) throw new Error('Your saved activity could not be read.');
  for (const e of value.history) if (!record(e) || !id(e.id) || !isMeal(e.meal) || !date(e.chosenAt) || !(e.eatenAt === null || date(e.eatenAt)) || !(e.rating === null || (Number.isInteger(e.rating) && Number(e.rating) >= 1 && Number(e.rating) <= 5)) || !(e.photoUri === null || (typeof e.photoUri === 'string' && e.photoUri.startsWith('file://')))) throw new Error('Your meal history could not be read.');
  for (const r of value.reports) if (!record(r) || !id(r.id) || !(r.mealId === null || id(r.mealId)) || !(r.mealName === null || text(r.mealName, 200)) || !text(r.text, 2000) || !date(r.createdAt) || r.status !== 'saved-locally') throw new Error('Your saved feedback could not be read.');
  return JSON.parse(JSON.stringify({ ...value, savedRestaurants: [...new Set(value.savedRestaurants)] })) as Activity;
}
export function chooseMeal(activity: Activity, meal: Meal, now = new Date().toISOString()): Activity {
  if (!isMeal(meal) || !date(now)) throw new Error('This meal could not be added to your history.');
  const pending = activity.history.find(e => e.meal.id === meal.id && e.eatenAt === null);
  if (pending) return activity;
  return { ...activity, history: [{ id: newId('choice'), meal: JSON.parse(JSON.stringify(meal)), chosenAt: now, eatenAt: null, rating: null, photoUri: null }, ...activity.history] };
}
export function updateHistory(activity: Activity, entryId: string, patch: Partial<Pick<HistoryEntry, 'eatenAt' | 'rating' | 'photoUri'>>): Activity {
  if (!activity.history.some(e => e.id === entryId)) throw new Error('This meal is no longer in your history.');
  return validateActivity({ ...activity, history: activity.history.map(e => e.id === entryId ? { ...e, ...patch } : e) });
}
export function removeHistoryEntry(activity: Activity, entryId: string): Activity {
  if (!activity.history.some(entry => entry.id === entryId)) throw new Error('This meal is no longer in your history.');
  return { ...activity, history: activity.history.filter(entry => entry.id !== entryId) };
}
export type MenuInput = { restaurant: string; name: string; lat: string; lon: string; sourceUrl: string; sourceText: string; photoUri: string | null; calories: string; protein: string; carbs: string; fat: string; price: string; cuisine: string; ingredients: string; diet: string; mealType: Targets['mealType'] };
/** Literal source lines are candidates to review, never automatically accepted dishes. */
export function menuLineCandidates(sourceText: string): { name: string; price: string | null }[] {
  return [...new Set(sourceText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length >= 3 && line.length <= 180 && /[A-Za-zÀ-ž]{2}/.test(line) && !/kcal|kJ|protein|carbohydrate|nutrition|allergen|nährwert/i.test(line)))].slice(0, 12).map(line => {
    const match = line.match(/\s+(?:€\s*)?(\d{1,3}[,.]\d{2})\s*(?:€|EUR)?$/i);
    return { name: match ? line.slice(0, match.index).trim() : line, price: match ? match[1].replace(',', '.') : null };
  }).filter(line => line.name.length > 1);
}
export function createImportedMeal(input: MenuInput, now = new Date().toISOString()): Meal {
  if (input.photoUri !== null && !input.photoUri.startsWith('file://')) throw new Error('Choose a menu photo from this device.');
  if (!input.restaurant.trim() || !input.name.trim()) throw new Error('Add the real restaurant and dish names from your menu.');
  if (input.restaurant.length > 200 || input.name.length > 200 || input.sourceText.length > 10000) throw new Error('Please shorten the restaurant, dish name, or menu text.');
  if (input.sourceUrl.trim()) { try { const url = new URL(input.sourceUrl.trim()); if (url.protocol !== 'https:' || !url.hostname) throw new Error(); } catch { throw new Error('Use an HTTPS link to the original menu.'); } }
  if (!input.sourceUrl.trim() && !input.sourceText.trim() && !input.photoUri) throw new Error('Attach the menu photo, paste its text, or add its original link.');
  if (!input.lat.trim() || !input.lon.trim()) throw new Error('Confirm the restaurant coordinates. Search its address on the map first if needed.');
  const lat = Number(input.lat), lon = Number(input.lon);
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180) throw new Error('Enter valid restaurant coordinates.');
  function number(value: string, name: string, maximum: number) { if (!value.trim()) return null; const parsed = Number(value.replace(',', '.')); if (!Number.isFinite(parsed) || parsed < 0 || parsed > maximum) throw new Error(`${name} must be a number between 0 and ${maximum}, or left blank.`); return parsed; }
  const calories = number(input.calories, 'Calories', 5000), protein = number(input.protein, 'Protein', 500), carbs = number(input.carbs, 'Carbohydrates', 1000), fat = number(input.fat, 'Fat', 500), priceAmount = number(input.price, 'Price', 1000);
  const hasNutrition = [calories, protein, carbs, fat].some(v => v !== null);
  const sourceKind = input.sourceUrl.trim() ? 'url' : input.photoUri ? 'photo' : 'text';
  const sourceReference = input.sourceUrl.trim() || input.photoUri || input.sourceText.trim();
  return { id: newId('menu'), name: input.name.trim(), restaurant: input.restaurant.trim(), restaurantId: `${input.restaurant.trim().toLowerCase()}|${lat.toFixed(4)}|${lon.toFixed(4)}`, lat, lon, menuUrl: input.sourceUrl.trim(), checkedAt: now, ingredients: input.ingredients.trim() ? input.ingredients.split(',').map(v => v.trim()).filter(Boolean) : null, ingredientsComplete: false, dietary: input.diet === 'Unknown' ? null : [input.diet.toLowerCase()], excludedIngredientChecks: null, mealTypes: [input.mealType], calories, protein, carbs, fat, nutritionStatus: hasNutrition ? 'estimated' : 'unknown', nutritionSource: input.sourceUrl.trim() || null, confidence: hasNutrition ? 'Low' : null, assumptions: hasNutrition ? 'Entered by you from a menu. Values have not been independently verified; no AI estimate was generated.' : null, price: priceAmount === null ? null : `€${priceAmount.toFixed(2)}`, priceAmount, currency: priceAmount === null ? null : 'EUR', cuisine: input.cuisine.trim() || null, imageUrl: null, available: null, openingStatus: 'unknown', openingCheckedAt: null, provenance: 'user', sourceKind, sourceReference, evidenceText: input.sourceText.trim() || null, sourcePhotoUri: input.photoUri };
}
