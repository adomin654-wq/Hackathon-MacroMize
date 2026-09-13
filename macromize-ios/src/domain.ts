/** Device-independent meal preferences and ranking. No account or network state lives here. */
export type Targets = {
  mode: "numeric" | "goal";
  goal: string;
  calories: number;
  protein: number;
  carbsMax: number | null;
  fatMax: number | null;
  budgetMax: number | null;
  cuisine: string;
  openNow: boolean;
  remainingCalories: number | null;
  laterMeal: string;
  radius: number;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  diet: "Any" | "Vegetarian" | "Vegan";
  exclusions: string[];
};

export type Location = { lat: number; lon: number };

export type Meal = {
  id: string;
  name: string;
  restaurant: string;
  menuUrl: string;
  checkedAt: string;
  lat: number;
  lon: number;
  ingredients: string[] | null;
  ingredientsComplete: boolean;
  dietary: string[] | null;
  excludedIngredientChecks: Record<string, boolean> | null;
  mealTypes: string[];
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  nutritionStatus: "verified" | "estimated" | "unknown";
  nutritionSource: string | null;
  confidence: "High" | "Medium" | "Low" | null;
  assumptions: string | null;
  price: string | null;
  imageUrl: string | null;
  available: boolean | null;
  priceAmount?: number | null;
  currency?: string | null;
  cuisine?: string | null;
  restaurantId?: string;
  openingStatus?: "open" | "closed" | "unknown";
  openingCheckedAt?: string | null;
  openingHours?: { timeZone: string; sourceUrl: string; checkedAt: string; weekly: { days: number[]; open: string; close: string }[] };
  sourceKind?: "url" | "photo" | "text";
  sourceReference?: string;
  provenance?: "restaurant" | "user";
  estimationMethod?: "published" | "user" | "ai" | "unknown";
  evidenceText?: string | null;
  sourcePhotoUri?: string | null;
};

export type Match = Meal & {
  score: number | null;
  distanceKm: number;
  reasons: string[];
  exact: boolean;
  goalFit: "Strong" | "Possible" | "Limited" | "Unknown" | null;
};

export const defaults: Targets = {
  mode: "numeric",
  goal: "High protein",
  calories: 600,
  protein: 40,
  carbsMax: null,
  fatMax: null,
  budgetMax: null,
  cuisine: "Any",
  openNow: false,
  remainingCalories: null,
  laterMeal: "",
  radius: 2,
  mealType: "Lunch",
  diet: "Any",
  exclusions: [],
};

const mealTypes: Targets["mealType"][] = ["Breakfast", "Lunch", "Dinner", "Snack"];
const diets: Targets["diet"][] = ["Any", "Vegetarian", "Vegan"];

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function requireNumber(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} must be a number from ${min} to ${max}.`);
  }
  return value;
}

function optionalNumber(value: unknown, label: string, max: number): number | null {
  return value === undefined || value === null ? null : requireNumber(value, label, 0, max);
}

function cleanText(value: unknown, fallback: string, label: string, max: number, allowEmpty = false): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || value.trim().length > max || (!allowEmpty && !value.trim())) {
    throw new Error(`${label} could not be read.`);
  }
  return value.trim();
}

/** Validates an entire preference object and returns a clean copy; never coerces strings to numbers. */
export function validateTargets(input: unknown): Targets {
  if (!isRecord(input)) throw new Error("Your meal targets could not be read.");
  const mode = input.mode === undefined ? defaults.mode : input.mode;
  if (mode !== "numeric" && mode !== "goal") throw new Error("Choose a meal goal or your own macro targets.");
  const goal = cleanText(input.goal, defaults.goal, "Meal goal", 100);
  if (mode === "goal" && !intents.some((intent) => intent.title === goal)) throw new Error("Choose one of the available meal goals.");
  const calories = requireNumber(input.calories, "Calories", 100, 3000);
  const protein = requireNumber(input.protein, "Protein", 0, 250);
  const radius = requireNumber(input.radius, "Search radius", 0.5, 20);
  if (!mealTypes.includes(input.mealType as Targets["mealType"])) {
    throw new Error("Choose Breakfast, Lunch, Dinner, or Snack.");
  }
  if (!diets.includes(input.diet as Targets["diet"])) {
    throw new Error("Choose Any, Vegetarian, or Vegan for your diet.");
  }
  if (!Array.isArray(input.exclusions) || input.exclusions.length > 20) {
    throw new Error("Add no more than 20 ingredient exclusions.");
  }
  const exclusions: string[] = [];
  const seen = new Set<string>();
  for (const entry of input.exclusions) {
    if (typeof entry !== "string" || !entry.trim() || entry.trim().length > 80) {
      throw new Error("Each ingredient exclusion must contain 1 to 80 characters.");
    }
    const trimmed = entry.trim();
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      exclusions.push(trimmed);
      seen.add(key);
    }
  }
  if (input.openNow !== undefined && typeof input.openNow !== "boolean") throw new Error("The opening-hours filter could not be read.");
  return {
    mode,
    goal,
    calories,
    protein,
    carbsMax: optionalNumber(input.carbsMax, "Carbohydrate limit", 500),
    fatMax: optionalNumber(input.fatMax, "Fat limit", 250),
    budgetMax: optionalNumber(input.budgetMax, "Budget in EUR", 1000),
    cuisine: cleanText(input.cuisine, defaults.cuisine, "Cuisine", 60),
    openNow: input.openNow === true,
    remainingCalories: optionalNumber(input.remainingCalories, "Remaining daily calories", 10000),
    laterMeal: cleanText(input.laterMeal, defaults.laterMeal, "Later meal", 160, true),
    radius,
    mealType: input.mealType as Targets["mealType"],
    diet: input.diet as Targets["diet"],
    exclusions,
  };
}

function validLocation(location: Location): boolean {
  return Number.isFinite(location.lat) && Math.abs(location.lat) <= 90
    && Number.isFinite(location.lon) && Math.abs(location.lon) <= 180;
}

/** Great-circle distance, not walking distance. Invalid coordinates throw instead of becoming a match. */
export function distanceKm(a: Location, b: Location): number {
  if (!validLocation(a) || !validLocation(b)) throw new Error("The location could not be read. Please try again.");
  const radians = Math.PI / 180;
  const dlat = (b.lat - a.lat) * radians;
  const dlon = (b.lon - a.lon) * radians;
  const haversine = Math.sin(dlat / 2) ** 2
    + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, haversine))));
}

function hasMenuSource(meal: Meal, now: number): boolean {
  if (typeof meal.checkedAt !== "string" || !Number.isFinite(Date.parse(meal.checkedAt))
    || Date.parse(meal.checkedAt) > now + 5 * 60 * 1000) return false;
  if (meal.sourceKind === "photo" || meal.sourceKind === "text") {
    return meal.provenance === "user" && typeof meal.sourceReference === "string" && Boolean(meal.sourceReference.trim());
  }
  try {
    const url = new URL(meal.menuUrl);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function usableNutrition(value: number | null, status: Meal["nutritionStatus"]): number | null {
  if ((status !== "verified" && status !== "estimated") || typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return value;
}

/** Published schedules describe normal hours, not a real-time guarantee. Day 0 is Sunday. */
export function openingInfo(meal: Meal, now = Date.now()): { open: boolean | null; label: string } {
  const checked = typeof meal.openingCheckedAt === 'string' ? Date.parse(meal.openingCheckedAt) : NaN;
  if ((meal.openingStatus === 'open' || meal.openingStatus === 'closed') && Number.isFinite(checked) && checked <= now + 300000 && now - checked <= 7200000) return { open: meal.openingStatus === 'open', label: meal.openingStatus === 'open' ? 'Open at the latest status check' : 'Closed at the latest status check' };
  const hours = meal.openingHours;
  if (!hours) return { open: null, label: 'Opening hours unknown' };
  try {
    const checkedAt = Date.parse(hours.checkedAt);
    if (!Number.isFinite(checkedAt) || checkedAt > now + 300000 || now - checkedAt > 30 * 86400000 || new URL(hours.sourceUrl).protocol !== 'https:') throw new Error();
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: hours.timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find(p => p.type === 'weekday')!.value);
    const minute = Number(parts.find(p => p.type === 'hour')!.value) * 60 + Number(parts.find(p => p.type === 'minute')!.value);
    const readTime = (value: string) => { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error(); return Number(value.slice(0, 2)) * 60 + Number(value.slice(3)); };
    const open = hours.weekly.some(period => {
      const start = readTime(period.open), end = readTime(period.close);
      if (period.days.some(day => !Number.isInteger(day) || day < 0 || day > 6) || start === end) throw new Error();
      return start < end ? period.days.includes(day) && minute >= start && minute < end : (period.days.includes(day) && minute >= start) || (period.days.includes((day + 6) % 7) && minute < end);
    });
    return { open, label: `${open ? 'Open' : 'Closed'} according to published hours; exceptions possible` };
  } catch { return { open: null, label: 'Opening hours could not be confirmed' }; }
}

function withinLimit(value: number | null, limit: number | null): boolean {
  return limit === null || (value !== null && value <= limit);
}

/** Qualitative goal categories describe the available evidence; they are never a numeric match score. */
function assessGoal(meal: Meal, targets: Targets): { fit: Exclude<Match["goalFit"], null>; reasons: string[]; order: number } {
  const intent = intents.find((entry) => entry.title === targets.goal)!;
  const protein = meal.protein;
  const calories = meal.calories;
  const carbs = meal.carbs;
  let fit: Exclude<Match["goalFit"], null> = "Unknown";
  let order = 0;
  const reasons: string[] = [];
  if (targets.goal === "Eat lighter" || targets.goal === "A bigger dinner later") {
    if (calories !== null) {
      fit = calories <= intent.calories ? "Strong" : calories <= intent.calories * 1.25 ? "Possible" : "Limited";
      order = -calories;
      reasons.push(`${calories} kcal recorded — ${calories <= intent.calories ? "a lighter option for this goal" : "more energy than the lighter-meal preference"}`);
    }
  } else if (targets.goal === "Post workout") {
    if (protein !== null && carbs !== null) {
      fit = protein >= intent.protein && carbs >= 30 ? "Strong" : protein >= 20 && carbs > 0 ? "Possible" : "Limited";
      order = protein;
      reasons.push(`${protein} g protein and ${carbs} g carbs recorded for your post-workout preference`);
    }
  } else if (protein !== null) {
    fit = protein >= intent.protein ? "Strong" : protein >= intent.protein * 0.65 ? "Possible" : "Limited";
    order = protein;
    reasons.push(`${protein} g protein recorded for your ${targets.goal.toLowerCase()} preference`);
    if (targets.goal === "Stay full longer") reasons.push("Fullness varies; protein is the available signal, fibre is not recorded");
    if (targets.goal === "Build muscle") reasons.push("This is a protein-focused choice; muscle gain depends on your overall routine");
  }
  if (fit === "Unknown") reasons.push("Not enough recorded nutrition to assess this goal");
  reasons.push("Qualitative goal fit; no numeric match score");
  return { fit, reasons, order };
}

function confirmsExclusion(meal: Meal, exclusion: string): boolean {
  const key = exclusion.trim().toLowerCase();
  const checks = meal.excludedIngredientChecks;
  if (!checks) return false;
  // Explicit source checks are required. A missing ingredient in a partial list is not confirmation.
  const matches = Object.entries(checks).filter(([ingredient]) => ingredient.trim().toLowerCase() === key);
  if (!matches.length || matches.some(([, confirmed]) => confirmed !== true)) return false;
  // Contradictory source data must not pass a hard restriction.
  return !meal.ingredients?.some((ingredient) => ingredient.trim().toLowerCase() === key);
}

/** Required filters fail closed when evidence is missing. Numeric targets rank; goals use qualitative evidence. */
export function rankMeals(meals: Meal[], input: Targets, location: Location, now = Date.now(), simple=false): Match[] {
  const targets = validateTargets(input);
  if (!validLocation(location)) throw new Error("The location could not be read. Please try again.");
  if (!Number.isFinite(now)) throw new Error("The current time could not be read.");

  return meals
    .filter((meal) => hasMenuSource(meal, now) && meal.available !== false && validLocation(meal))
    .filter((meal) => {
      const dietary = meal.dietary?.map((entry) => entry.trim().toLowerCase());
      return targets.diet === "Any" || dietary?.includes(targets.diet.toLowerCase())
        || (targets.diet === "Vegetarian" && dietary?.includes("vegan"));
    })
    .filter((meal) => targets.exclusions.every((exclusion) => confirmsExclusion(meal, exclusion)))
    .filter((meal) => simple || meal.mealTypes.includes(targets.mealType))
    .filter((meal) => targets.cuisine === "Any" || meal.cuisine?.trim().toLowerCase() === targets.cuisine.toLowerCase())
    .filter((meal) => targets.budgetMax === null || (typeof meal.priceAmount === "number" && Number.isFinite(meal.priceAmount)
      && meal.priceAmount >= 0 && meal.priceAmount <= targets.budgetMax && meal.currency?.toUpperCase() === "EUR"))
    .filter((meal) => !targets.openNow || openingInfo(meal, now).open === true)
    .filter((meal) => withinLimit(usableNutrition(meal.carbs, meal.nutritionStatus), targets.carbsMax)
      && withinLimit(usableNutrition(meal.fat, meal.nutritionStatus), targets.fatMax))
    .map((meal): Match => {
      const distance = distanceKm(location, meal);
      const calories = usableNutrition(meal.calories, meal.nutritionStatus);
      const protein = usableNutrition(meal.protein, meal.nutritionStatus);
      const calorieFit = calories === null ? null
        : Math.max(0, 1 - Math.max(0, calories - targets.calories) / targets.calories);
      const proteinFit = protein === null ? null
        : targets.protein === 0 ? 1 : Math.min(1, protein / targets.protein);
      const reasons: string[] = [];
      const cleanMeal = { ...meal, calories, protein, carbs: usableNutrition(meal.carbs, meal.nutritionStatus), fat: usableNutrition(meal.fat, meal.nutritionStatus) };
      const goal = targets.mode === "goal" ? assessGoal(cleanMeal, targets) : null;
      if (goal) reasons.push(...goal.reasons);
      else {
        if (calories === null) reasons.push("Calories unavailable");
        else reasons.push(calories <= targets.calories ? "Within your calorie target"
          : `${Math.round(calories - targets.calories)} kcal above your target`);
        if (protein === null) reasons.push("Protein unavailable");
        else reasons.push(protein >= targets.protein ? "Reaches your protein target"
          : `${Math.round(targets.protein - protein)} g below your protein target`);
      }
      if (meal.nutritionStatus === "estimated") reasons.push("Nutrition is estimated");
      if (meal.provenance === "user") reasons.push("Menu entered by you; not independently verified");
      if (targets.diet !== "Any") reasons.push(`${targets.diet} requirement confirmed`);
      if (targets.exclusions.length) reasons.push("Your ingredient exclusions are confirmed by the source");
      if (targets.budgetMax !== null) reasons.push(`Within your €${targets.budgetMax} budget`);
      if (targets.cuisine !== "Any") reasons.push(`${targets.cuisine} cuisine confirmed`);
      if (targets.openNow) reasons.push(openingInfo(meal, now).label);
      if (targets.carbsMax !== null) reasons.push("Within your carbohydrate limit");
      if (targets.fatMax !== null) reasons.push("Within your fat limit");
      if (targets.remainingCalories !== null) {
        if (calories === null) reasons.push("Calories unavailable; remaining daily calories cannot be compared");
        else reasons.push(calories <= targets.remainingCalories
          ? `Within the ${targets.remainingCalories} kcal you have left today (context only)`
          : `${Math.round(calories - targets.remainingCalories)} kcal above the amount you have left today (context only)`);
      }
      if (meal.available === null) reasons.push("Current availability is unconfirmed");
      reasons.push(`${distance.toFixed(1)} km away (straight-line distance)`);
      const score = goal !== null || calorieFit === null || proteinFit === null ? null
        : Math.round(100 * (0.45 * calorieFit + 0.45 * proteinFit
          + 0.1 * Math.max(0, 1 - distance / targets.radius)));
      return {
        ...cleanMeal,
        score,
        distanceKm: distance,
        reasons,
        exact: goal === null && calorieFit === 1 && proteinFit === 1 && meal.nutritionStatus === "verified" && meal.provenance !== "user",
        goalFit: goal?.fit ?? null,
      };
    })
    .filter((meal) => simple || meal.distanceKm <= targets.radius)
    .sort((a, b) => {
      if (targets.mode === "goal") {
        const quality = { Strong: 3, Possible: 2, Limited: 1, Unknown: 0 };
        const left = assessGoal(a, targets);
        const right = assessGoal(b, targets);
        return quality[right.fit] - quality[left.fit] || right.order - left.order
          || a.distanceKm - b.distanceKm || a.id.localeCompare(b.id);
      }
      return (b.score ?? -1) - (a.score ?? -1) || a.distanceKm - b.distanceKm || a.id.localeCompare(b.id);
    });
}

export const intents = [
  { title: "Post workout", description: "Higher protein, with room for carbohydrates.", calories: 700, protein: 40 },
  { title: "High protein", description: "Make protein the priority for this meal.", calories: 650, protein: 45 },
  { title: "Eat lighter", description: "A lighter calorie target, while keeping protein in mind.", calories: 500, protein: 30 },
  { title: "Stay full longer", description: "A substantial meal with a protein focus.", calories: 700, protein: 35 },
  { title: "Build muscle", description: "More room for energy and protein.", calories: 800, protein: 45 },
  { title: "A bigger dinner later", description: "A lighter meal now, with some protein.", calories: 450, protein: 30 },
];

export function simplifyTargets(t:Targets):Targets{return {...t,mode:'numeric',diet:t.diet==='Vegan'?'Vegan':'Any',mealType:'Lunch',radius:2,exclusions:[],budgetMax:null,cuisine:'Any',openNow:false,remainingCalories:null,laterMeal:''};}
export function hasCompleteNutrition(meal:Meal){return meal.nutritionStatus!=='unknown'&&[meal.calories,meal.protein,meal.carbs,meal.fat].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0)&&meal.calories!>0;}
export function rankSimpleMeals(meals:Meal[],targets:Targets,location:Location){return rankMeals(meals.filter(hasCompleteNutrition),simplifyTargets(targets),location,Date.now(),true);}
