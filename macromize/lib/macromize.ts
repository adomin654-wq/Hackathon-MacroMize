import { mealFitReasons } from "./meal-fit-reasons.ts";
import { flexibleScore } from "./personal-profile.ts";
import { z } from "zod";

export const targetsSchema = z.object({
  comparison:z.enum(["limits","flexible"]).default("limits"),
  mode:z.enum(["numeric","goal"]).default("numeric"), goal:z.string().max(100).default("High protein"),
  carbs:z.number().min(0).max(2000).nullable().default(null), fat:z.number().min(0).max(500).nullable().default(null),
  budget:z.number().min(1).max(500).nullable().default(null), cuisine:z.string().max(80).default("Any"), openNow:z.boolean().default(false),
  remainingCalories:z.number().min(0).max(6000).nullable().default(null), laterMeal:z.string().max(300).default(""),
  calories: z.number().min(100).max(10000), protein: z.number().min(0).max(700),
  radius: z.number().min(.5).max(20), mealType: z.enum(["Breakfast","Lunch","Dinner","Snack"]),
  diet: z.enum(["Any","Vegetarian","Vegan"]), exclusions: z.array(z.string().trim().min(1).max(80)).max(20),
});
export type Targets = z.infer<typeof targetsSchema>;
export const defaults: Targets = targetsSchema.parse({calories:600,protein:40,radius:2,mealType:"Lunch",diet:"Any",exclusions:[]});
export type Meal = {
  id:string; name:string; restaurant:string; menuUrl:string; checkedAt:string;
  lat:number; lon:number; ingredients:string[]|null; ingredientsComplete:boolean;
  dietary:string[]|null; excludedIngredientChecks:Record<string,boolean>|null;
  mealTypes:string[]; calories:number|null; protein:number|null; carbs:number|null; fat:number|null;
  nutritionStatus:"verified"|"estimated"|"unknown"; nutritionSource:string|null;
  confidence:"High"|"Medium"|"Low"|null; assumptions:string|null;
  price:string|null; illustrationCategory?:string; imageUrl:string|null; imageSourceUrl?:string|null; imageAttribution?:string|null; available:boolean|null;
  restaurantId?:string; priceAmount?:number|null; currency?:string; cuisine?:string;
  openingHours?:{timezone:string;source:string;checkedAt:string;weekly:Record<string,[string,string][]>};
  openingStatus?:"open"|"closed"|"unknown"; openingCheckedAt?:string|null;
  sourceKind?:"restaurant"|"user-menu"; sourcePhoto?:string|null; sourceText?:string;
  estimationMethod?:"published"|"user"|"ai"|"unknown";
};
export type Match = Meal & {score:number|null; distanceKm:number; reasons:string[]; exact:boolean; fitLabel?:string; sortValue?:number};
export function distanceKm(a:{lat:number;lon:number},b:{lat:number;lon:number}){
  const r=Math.PI/180;const dlat=(b.lat-a.lat)*r,dlon=(b.lon-a.lon)*r;
  return 6371*2*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlon/2)**2));
}
export function restaurantKey(meal:Meal){return meal.restaurantId??`${meal.restaurant.toLowerCase().trim()}|${meal.lat.toFixed(5)},${meal.lon.toFixed(5)}`;}
export function hasSource(m:Meal){return (/^https:\/\//.test(m.menuUrl)||m.sourceKind==="user-menu"&&!!m.sourcePhoto?.startsWith("/api/photos/"))&&Number.isFinite(Date.parse(m.checkedAt))&&Number.isFinite(m.lat)&&Number.isFinite(m.lon)&&Math.abs(m.lat)<=90&&Math.abs(m.lon)<=180;}
export function isOpenAt(m:Meal,now=new Date()){
 const stamp=m.openingCheckedAt?Date.parse(m.openingCheckedAt):NaN;
 if(Number.isFinite(stamp)&&now.getTime()-stamp>=0&&now.getTime()-stamp<3600000)return m.openingStatus==="open";
 const hours=m.openingHours;if(!hours||!/^https:\/\//.test(hours.source)||!Number.isFinite(Date.parse(hours.checkedAt))||now.getTime()-Date.parse(hours.checkedAt)>30*86400000)return false;
 try{const parts=new Intl.DateTimeFormat('en-GB',{timeZone:hours.timezone,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);const part=(type:string)=>parts.find(p=>p.type===type)?.value??'';const day=part('weekday'),minute=Number(part('hour'))*60+Number(part('minute'));const toMinutes=(v:string)=>Number(v.split(':')[0])*60+Number(v.split(':')[1]);return (hours.weekly[day]??[]).some(([start,end])=>minute>=toMinutes(start)&&minute<toMinutes(end));}catch{return false;}
}
export function rankMeals(meals:Meal[], targets:Targets, location:{lat:number;lon:number}, simple=false):Match[]{
  return meals.filter(m=>hasSource(m)&&m.available!==false)
    .filter(m=>targets.budget==null||(m.currency==="EUR"&&m.priceAmount!=null&&m.priceAmount<=targets.budget))
    .filter(m=>!targets.cuisine||targets.cuisine==="Any"||m.cuisine?.toLowerCase()===targets.cuisine.toLowerCase())
    .filter(m=>!targets.openNow||isOpenAt(m))
    .filter(m=>targets.diet==="Any"||m.dietary?.includes(targets.diet.toLowerCase())||(targets.diet==="Vegetarian"&&m.dietary?.includes("vegan")))
    .filter(m=>targets.exclusions.every(e=>m.excludedIngredientChecks?.[e.toLowerCase()]===true&&!m.ingredients?.some(i=>i.trim().toLowerCase()===e.trim().toLowerCase())))
    .filter(m=>simple||m.mealTypes.includes(targets.mealType))
    .map(raw=>{
      const clean=(value:number|null)=>raw.nutritionStatus==="unknown"||value===null||!Number.isFinite(value)||value<0?null:value;
      const m={...raw,calories:clean(raw.calories),protein:clean(raw.protein),carbs:clean(raw.carbs),fat:clean(raw.fat)};
      if(targets.comparison!=="flexible"&&targets.carbs!=null&&(m.carbs===null||m.carbs>targets.carbs))return null;
      if(targets.comparison!=="flexible"&&targets.fat!=null&&(m.fat===null||m.fat>targets.fat))return null;
      const distance=distanceKm(location,m);const reasons:string[]=[];
      const calorieFit=m.calories===null?null:Math.max(0,1-Math.max(0,m.calories-targets.calories)/targets.calories);
      const proteinFit=m.protein===null?null:targets.protein===0?1:Math.min(1,m.protein/targets.protein);
      if(m.calories===null)reasons.push("Calories unavailable");
      if(m.protein===null)reasons.push("Protein unavailable");
      if(targets.mode!=="goal"&&m.calories!==null)reasons.push(m.calories<=targets.calories?"Within your calorie target":`${Math.round(m.calories-targets.calories)} kcal above your target`);
      if(targets.mode!=="goal"&&m.protein!==null)reasons.push(m.protein>=targets.protein?"Reaches your protein target":`${Math.round(targets.protein-m.protein)} g below your protein target`);
      if(targets.diet!=="Any")reasons.push(`${targets.diet} requirement confirmed`);
      reasons.push(`${distance.toFixed(1)} km away (straight-line distance)`);
      const score=targets.comparison==="flexible"?flexibleScore(m,targets,distance,targets.radius):calorieFit===null||proteinFit===null?null:Math.round(100*(.45*calorieFit+.45*proteinFit+.1*Math.max(0,1-distance/targets.radius)));
      if(targets.comparison==="flexible"){reasons.splice(0,reasons.length,...mealFitReasons(m,targets,m.nutritionStatus==='estimated'),...reasons.filter(reason=>!/(Within your calorie target|kcal above your target|Reaches your protein target|g below your protein target|Within your carbohydrate limit|Within your fat limit)/.test(reason)));}
      if(targets.budget!=null)reasons.push("Within your budget");
      if(targets.openNow)reasons.push(m.openingHours?"Open according to published hours; exceptions possible":"Recently confirmed open");
      if(m.sourceKind==="user-menu")reasons.push("From your menu · details confirmed by you");
      if(targets.mode==="goal"){
        const light=/lighter|dinner later/i.test(targets.goal);
        const hasEvidence=m.calories!==null&&m.protein!==null;
        const sortValue=hasEvidence?(light?3000-m.calories!:m.protein!/(Math.max(m.calories!,100)/100)): -1;
        reasons.unshift(hasEvidence?(light?"A lower-energy option for your selected goal":"Prioritises protein for your selected goal"):"Nutrition evidence is missing for this goal");
        return {...m,score:null,sortValue,distanceKm:distance,reasons,exact:false,fitLabel:hasEvidence?"Goal fit":"Fit unknown"};
      }
      return {...m,score,sortValue:score??-1,distanceKm:distance,reasons,exact:(targets.comparison!=="flexible"||score===100)&&calorieFit===1&&proteinFit===1&&m.nutritionStatus==="verified"};
    }).filter((m):m is NonNullable<typeof m>=>m!==null).filter(m=>simple||m.distanceKm<=targets.radius).sort((a,b)=>(b.sortValue??-1)-(a.sortValue??-1)||a.distanceKm-b.distanceKm||a.id.localeCompare(b.id));
}

export const intents = [
  {title:"Post workout",description:"Higher protein, with room for carbohydrates.",calories:700,protein:40},
  {title:"High protein",description:"Make protein the priority for this meal.",calories:650,protein:45},
  {title:"Eat lighter",description:"A lighter calorie target, while keeping protein in mind.",calories:500,protein:30},
  {title:"Stay full longer",description:"A substantial meal with a protein focus.",calories:700,protein:35},
  {title:"Build muscle",description:"More room for energy and protein.",calories:800,protein:45},
  {title:"A bigger dinner later",description:"A lighter meal now, with some protein.",calories:450,protein:30},
];

export function simplifyTargets(t:Targets):Targets{return {...t,mode:'numeric',diet:t.diet,mealType:'Lunch',radius:2,exclusions:[],budget:null,cuisine:'Any',openNow:false,remainingCalories:null,laterMeal:''};}
export function hasCompleteNutrition(meal:Meal){return meal.nutritionStatus!=='unknown'&&[meal.calories,meal.protein,meal.carbs,meal.fat].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0)&&meal.calories!>0;}
export function rankSimpleMeals(meals:Meal[],targets:Targets,location:{lat:number;lon:number}){return rankMeals(meals.filter(hasCompleteNutrition),simplifyTargets(targets),location,true);}
