/** Canonical, dependency-free catalog adapter. Sync to iOS with scripts/sync-catalog.mjs. */
export type CatalogMeal = {
 id:string; name:string; restaurant:string; restaurantId:string; menuUrl:string; checkedAt:string;
 lat:number; lon:number; ingredients:string[]|null; ingredientsComplete:boolean; dietary:string[]|null;
 excludedIngredientChecks:Record<string,boolean>|null; mealTypes:string[];
 calories:number|null; protein:number|null; carbs:number|null; fat:number|null;
 nutritionStatus:'verified'|'estimated'|'unknown'; nutritionSource:string|null;
 estimationMethod?:'published'|'user'|'ai'|'unknown';
 confidence:'High'|'Medium'|'Low'|null; assumptions:string|null;
 price:string|null; priceAmount:number|null; currency:string; cuisine:string;
 imageUrl:string|null; available:boolean|null;
};
type RecordValue = Record<string,unknown>;
const record=(v:unknown):v is RecordValue=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max=2000)=>typeof v==='string'?v.slice(0,max):'';
const url=(v:unknown)=>{try{const u=new URL(text(v));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
const number=(v:unknown,max=10000)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max?v:null;
const strings=(v:unknown)=>Array.isArray(v)?v.filter((s):s is string=>typeof s==='string').slice(0,100).map(s=>s.slice(0,500)):[];
const venues:Record<string,{id:string;name:string;lat:number;lon:number;cuisine:string}>= {
 'hamburg-hans-altes-rathaus':{id:'hh-hig-altes-rathaus',name:'HANS IM GLÜCK · Altes Rathaus',lat:53.548597,lon:9.992385,cuisine:'Burgers & bowls'},
 'hamburg-dean-jungfernstieg':{id:'hamburg-dean-jungfernstieg',name:'dean&david · Jungfernstieg',lat:53.551658,lon:9.994826,cuisine:'Salads & bowls'},
 'hamburg-peter-bleichenhof':{id:'hamburg-peter-bleichenhof',name:'PETER PANE · Bleichenhof',lat:53.551404,lon:9.987726,cuisine:'Burgers & bowls'},
};

export function adaptPilotCatalog(input:unknown):CatalogMeal[]{
 if(!record(input)||!Array.isArray(input.dishes)||input.dishes.length>2000)throw Error('Invalid pilot catalog');
 const additional:typeof venues={};
 if(Array.isArray(input.venues))for(const v of input.venues){
  if(!record(v))throw Error('Invalid venue');
  const lat=number(v.latitude,90),lon=number(v.longitude,180),slug=text(v.slug,100),name=text(v.name,150);
  if(!slug||!name||lat===null||lon===null||lat<53.50||lat>53.60||lon<9.90||lon>10.10||!url(v.location_source_url)||!url(v.menu_url))throw Error('Invalid Hamburg venue location or source');
  additional[slug]={id:slug,name,lat,lon,cuisine:'Restaurant'};
 }
 const ids=new Set<string>();
 return input.dishes.map((raw):CatalogMeal|null=>{
  if(!record(raw))throw Error('Invalid catalog entry');
  const venue=venues[text(raw.slug)]||additional[text(raw.slug)];if(!venue)return null;
  if(raw.status==='inactive')return null;
  const id=text(raw.id,100),name=text(raw.name,150),menuUrl=url(raw.source_item_url);
  const checkedAt=text(raw.observed_at||input.observed_at,100);
  if(!id||!name||!menuUrl||!Number.isFinite(Date.parse(checkedAt))||ids.has(id))throw Error('Invalid catalog identity or source');
  ids.add(id);
  const n=record(raw.nutrition)?raw.nutrition:null;
  // Pending chain matches and rejected records must never become verified scores.
  const approved=n?.review_status==='approved'&&n?.is_current===true;
  const values=approved?[number(n?.kcal),number(n?.protein),number(n?.carbs),number(n?.fat)]:[null,null,null,null];
  const complete=values.every(v=>v!==null)&&!!url(n?.source);
  const published=complete&&n?.method==='restaurant_reported';
  const estimated=complete&&['ai_estimated','recipe_calculated'].includes(text(n?.method));
  const usable=published||estimated;
  const category=text(raw.menu_category).toUpperCase();
  const snack=/SWEET|NACHSPEIS|DIPS|BEILAGEN|FINGERFOOD/.test(category);
  // Chain-exclusive Express products are not branch inventory at Jungfernstieg.
  const express=/nur in express stores/i.test(name);
  const assumptions=record(n?.assumptions)?n.assumptions:null;
  const notes=estimated?[n?.method==='ai_estimated'?'KI-geschätzt anhand von Titel und Beschreibung; keine bestätigten Restaurantwerte.':'Aus einer Rezeptannahme berechnet; keine bestätigten Restaurantwerte.',text(n?.portion_label),...strings(assumptions?.notes),text(raw.description),...strings(raw.quality_notes).map(note=>note.replace('Nährwerte und Portionsgrößen unbekannt.', 'Restaurant-Nährwerte und tatsächliche Portionsgrößen nicht bestätigt.'))]:[text(raw.description),text(n?.portion_label),...strings(raw.quality_notes)];
  if(n&&!approved)notes.push('Chain nutrition awaits review; no numerical match is calculated from it.');
  if(raw.source_scope==='chain')notes.push('Chain menu: branch availability and price are not confirmed.');
  if(express)notes.push('Express-only item; excluded from this branch’s recommendations.');
  const priceAmount=number(raw.price_eur,1000);
  return {id,name,restaurant:venue.name,restaurantId:venue.id,menuUrl,checkedAt,
   lat:venue.lat,lon:venue.lon,ingredients:strings(raw.ingredient_mentions).length?strings(raw.ingredient_mentions):null,
   ingredientsComplete:false,excludedIngredientChecks:null,
   dietary:raw.is_vegan===true?['vegan','vegetarian']:raw.is_vegetarian===true?['vegetarian']:null,
   mealTypes:snack?['Snack']:['Lunch','Dinner'],
   calories:usable?values[0]:null,protein:usable?values[1]:null,carbs:usable?values[2]:null,fat:usable?values[3]:null,
   nutritionStatus:published?'verified':estimated?'estimated':'unknown',nutritionSource:url(n?.source),
   estimationMethod:published?'published':estimated&&n?.method==='ai_estimated'?'ai':'unknown',
   confidence:estimated?'Low':null,assumptions:notes.filter(Boolean).join(' ').slice(0,1500)||null,
   price:priceAmount===null?null:`${priceAmount.toFixed(2)} €${raw.price_scope==='chain'?' · chain price':''}`,
   priceAmount,currency:'EUR',cuisine:venue.cuisine,imageUrl:null,available:express?false:null};
 }).filter((m):m is CatalogMeal=>m!==null);
}

/** Retain curated IDs so existing favourites/history remain valid, without duplicating dishes. */
export function mergePilotMeals<T extends {id:string;name:string;restaurantId?:string;nutritionStatus:string}>(curated:T[], incoming:CatalogMeal[]):(T|CatalogMeal)[]{
 const key=(m:{name:string;restaurantId?:string})=>`${m.restaurantId}|${m.name.trim().normalize('NFKC').toLocaleLowerCase('de-DE')}`;
 const existing=new Map(curated.map(m=>[key(m),m]));
 return incoming.map(m=>{
  const old=existing.get(key(m));if(!old)return m;
  // Keep independent recipe evidence while a new mapping is pending; approved updates win.
  return m.nutritionStatus==='unknown'
   ? {...m,...old,id:old.id,lat:m.lat,lon:m.lon}
   : {...old,...m,id:old.id};
 });
}
