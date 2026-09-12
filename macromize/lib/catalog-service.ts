import { adaptPilotCatalog, mergePilotMeals } from './pilot-catalog.ts';
import type { Meal } from './macromize';
export type CatalogConfig={SUPABASE_CATALOG_URL?:string;SUPABASE_CATALOG_KEY?:string};
export async function loadRestaurantCatalog(config:CatalogConfig,fallback:Meal[],curated:Meal[],request:typeof fetch=fetch){
 const {SUPABASE_CATALOG_URL:endpoint,SUPABASE_CATALOG_KEY:key}=config;
 if(!endpoint&&!key)return {status:'snapshot',source:'bundled' as const,meals:fallback};
 try{
  if(!endpoint||!key)throw Error('Incomplete catalog configuration');
  const u=new URL(endpoint);
  if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||u.pathname!=='/functions/v1/macromize-catalog'||u.username||u.password||u.search||u.hash)throw Error('Invalid catalog endpoint');
  const response=await request(u.href,{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:`Bearer ${key}`},body:'{}',signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!response.ok)throw Error('Catalog unavailable');
  const content=await response.text();if(content.length>2_000_000)throw Error('Catalog too large');
  const incoming=adaptPilotCatalog(JSON.parse(content));
  return {status:'connected',source:'supabase' as const,meals:mergePilotMeals(curated,incoming)};
 }catch{
  // Never return backend URLs, keys, database errors, or raw upstream bodies.
  return {status:'stale',source:'bundled' as const,meals:fallback};
 }
}
