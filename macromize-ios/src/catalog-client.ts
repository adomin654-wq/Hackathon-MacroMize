import type {Meal} from './domain';
import {mergePilotMeals,type CatalogMeal} from './pilot-catalog.ts';

function parseMeals(input:unknown):{status:string;meals:CatalogMeal[]}{
 if(!input||typeof input!=='object')throw Error('Invalid catalog');
 const data=input as Record<string,unknown>;
 if(!['connected','snapshot','stale'].includes(String(data.status))||!Array.isArray(data.meals)||data.meals.length>2000)throw Error('Invalid catalog response');
 const ids=new Set<string>();
 const meals=data.meals.map((raw:unknown):CatalogMeal=>{
  if(!raw||typeof raw!=='object')throw Error('Invalid meal');
  const m=raw as Record<string,unknown>;
  const str=(key:string)=>{const v=m[key];if(typeof v!=='string'||!v.length||v.length>2000)throw Error('Invalid text');return v;};
  const link=(v:unknown)=>{if(v===null)return null;if(typeof v!=='string'||v.length>2000)throw Error('Invalid URL');const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password)throw Error('Invalid URL');return u.href;};
  const num=(key:string,min:number,max:number,nullable=false)=>{const v=m[key];if(nullable&&v===null)return null;if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error('Invalid number');return v;};
  const list=(key:string)=>{const v=m[key];if(v===null)return null;if(!Array.isArray(v)||v.length>100||v.some(x=>typeof x!=='string'||x.length>500))throw Error('Invalid list');return v as string[];};
  const id=str('id');if(ids.has(id))throw Error('Duplicate meal');ids.add(id);
  const checkedAt=str('checkedAt');if(!Number.isFinite(Date.parse(checkedAt)))throw Error('Invalid date');
  const status=m.nutritionStatus;if(status!=='verified'&&status!=='estimated'&&status!=='unknown')throw Error('Invalid nutrition status');
  const dietary=list('dietary');if(dietary?.some(d=>!['vegan','vegetarian'].includes(d)))throw Error('Invalid diet');
  const mealTypes=list('mealTypes');if(!mealTypes?.length||mealTypes.some(t=>!['Breakfast','Lunch','Dinner','Snack'].includes(t)))throw Error('Invalid meal type');
  const nutrition=(key:string)=>{const value=num(key,0,10000,true);return status==='unknown'?null:value;};
  if(m.available!==null&&typeof m.available!=='boolean')throw Error('Invalid availability');
  const priceAmount=m.priceAmount===undefined?null:num('priceAmount',0,1000,true);
  return {id,name:str('name'),restaurant:str('restaurant'),restaurantId:str('restaurantId'),menuUrl:link(str('menuUrl'))!,checkedAt,
   lat:num('lat',-90,90)!,lon:num('lon',-180,180)!,ingredients:list('ingredients'),ingredientsComplete:false,
   dietary,excludedIngredientChecks:null,mealTypes,calories:nutrition('calories'),protein:nutrition('protein'),carbs:nutrition('carbs'),fat:nutrition('fat'),
   nutritionStatus:status,nutritionSource:link(m.nutritionSource),confidence:status==='estimated'?'Low':null,
   assumptions:typeof m.assumptions==='string'?m.assumptions.slice(0,1500):null,
   price:typeof m.price==='string'?m.price.slice(0,100):null,priceAmount,currency:m.currency==='EUR'?'EUR':'',cuisine:typeof m.cuisine==='string'?m.cuisine.slice(0,80):'',
   imageUrl:link(m.imageUrl),available:m.available as boolean|null};
 });
 return {status:String(data.status),meals};
}

/** Public restaurant data only. Never place a Supabase service key in an Expo variable. */
export async function loadMobileCatalog(endpoint:string|undefined,fallback:Meal[],curated:Meal[],signal?:AbortSignal,request:typeof fetch=fetch):Promise<{status:string;meals:Meal[]}>{
 if(!endpoint)return {status:'snapshot',meals:fallback};
 const controller=new AbortController();const abort=()=>controller.abort();
 signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();
 const timer=setTimeout(abort,10000);
 try{
  const u=new URL(endpoint);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/api/meals')throw Error('Invalid backend URL');
  const response=await request(u.href,{signal:controller.signal,credentials:'omit',redirect:'error'});
  if(!response.ok)throw Error('Catalog unavailable');
  const body=await response.text();if(body.length>2_000_000)throw Error('Catalog too large');
  const data=parseMeals(JSON.parse(body));
  return {status:data.status,meals:mergePilotMeals(curated,data.meals)};
 }catch{return {status:'stale',meals:fallback};}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
