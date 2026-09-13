import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adaptPilotCatalog,mergePilotMeals} from '../../macromize/lib/pilot-catalog.ts';
import {loadRestaurantCatalog} from '../../macromize/lib/catalog-service.ts';
import {loadMobileCatalog} from '../../macromize-ios/src/catalog-client.ts';
const raw=JSON.parse(readFileSync(new URL('../../reference-data/supabase-pilot-catalog.json',import.meta.url)));
const curated=JSON.parse(readFileSync(new URL('../../reference-data/hamburg-launch-meals.json',import.meta.url)));
const pilot=adaptPilotCatalog(raw),merged=mergePilotMeals(curated,pilot);
const originalSlugs=new Set(['hamburg-hans-altes-rathaus','hamburg-dean-jungfernstieg','hamburg-peter-bleichenhof']);
const original=adaptPilotCatalog({...raw,dishes:raw.dishes.filter(d=>originalSlugs.has(d.slug))});
test('pilot identity, diet, missing data and curated favourites survive integration',()=>{
 assert.equal(original.length,159);assert.equal(new Set(original.map(m=>m.restaurantId)).size,3);
 assert.equal(original.filter(m=>m.dietary?.includes('vegetarian')).length,89);
 assert.equal(original.filter(m=>m.dietary?.includes('vegan')).length,47);
 assert.equal(merged.length,raw.dishes.length);assert.equal(new Set(merged.map(m=>m.id)).size,raw.dishes.length);
 for(const old of curated){const meal=merged.find(m=>m.id===old.id);assert.ok(meal);assert.equal(meal.calories,old.calories);}
 for(const m of pilot){const n=raw.dishes.find(d=>d.id===m.id).nutrition;
  if(n?.method==='ai_estimated'&&n.review_status==='approved'&&n.is_current){assert.equal(m.nutritionStatus,'estimated');assert.equal(m.estimationMethod,'ai');assert.ok(m.calories>0);assert.match(m.assumptions,/KI-geschätzt/);}
  else {assert.equal(m.nutritionStatus,'unknown');assert.equal(m.calories,null);}
 }
 assert.equal(pilot.filter(m=>m.available===false).length,4);
 assert.equal(original.filter(m=>m.priceAmount!==null).length,105);
 assert.equal(new Set(merged.filter(m=>m.restaurantId==='hh-hig-altes-rathaus').map(m=>`${m.lat},${m.lon}`)).size,1);
});
test('approved updates refresh nutrition while preserving the favourite ID',()=>{
 const old=curated[0],incoming=pilot.find(m=>m.name===old.name);
 const updated=mergePilotMeals(curated,[{...incoming,nutritionStatus:'verified',calories:650}])[0];
 assert.equal(updated.id,old.id);assert.equal(updated.calories,650);
});
test('only reviewed current source nutrition becomes scoreable',()=>{
 const d=structuredClone(raw.dishes.find(d=>d.nutrition));
 d.nutrition={...d.nutrition,review_status:'approved',is_current:true,method:'restaurant_reported'};
 assert.equal(adaptPilotCatalog({...raw,dishes:[d]})[0].nutritionStatus,'verified');
 d.nutrition.is_current=false;assert.equal(adaptPilotCatalog({...raw,dishes:[d]})[0].calories,null);
 d.nutrition.is_current=true;d.nutrition.review_status='rejected';assert.equal(adaptPilotCatalog({...raw,dishes:[d]})[0].calories,null);
});
test('catalog rejects malformed sources and duplicate identifiers',()=>{
 assert.throws(()=>adaptPilotCatalog({dishes:[raw.dishes[0],raw.dishes[0]],observed_at:raw.observed_at}));
 assert.throws(()=>adaptPilotCatalog({...raw,dishes:[{...raw.dishes[0],source_item_url:'javascript:alert(1)'}]}));
});
test('complete AI values remain estimates with portion assumptions; pending or partial values stay hidden',()=>{
 const d=structuredClone(raw.dishes[0]);
 d.nutrition={kcal:600,protein:30,carbs:60,fat:27,method:'ai_estimated',review_status:'approved',is_current:true,source:d.source_item_url,portion_label:'Eine Portion, ca. 450 g',assumptions:{notes:['Reis 180 g gekocht, Gemüse 150 g, Öl 10 g.']}};
 let [m]=adaptPilotCatalog({...raw,dishes:[d]});
 assert.equal(m.nutritionStatus,'estimated');assert.equal(m.estimationMethod,'ai');assert.equal(m.confidence,'Low');assert.match(m.assumptions,/KI-geschätzt/);assert.match(m.assumptions,/450 g/);assert.match(m.assumptions,/Reis 180 g/);
 d.nutrition.fat=null;[m]=adaptPilotCatalog({...raw,dishes:[d]});assert.equal(m.nutritionStatus,'unknown');assert.equal(m.calories,null);
 d.nutrition.fat=27;d.nutrition.review_status='pending';[m]=adaptPilotCatalog({...raw,dishes:[d]});assert.equal(m.nutritionStatus,'unknown');
});
const config={SUPABASE_CATALOG_URL:'https://example.supabase.co/functions/v1/macromize-catalog',SUPABASE_CATALOG_KEY:'synthetic-test-key-not-a-credential'};
test('web adapter authenticates server-side and exposes only catalog result',async()=>{
 let sent;
 const result=await loadRestaurantCatalog(config,merged,curated,async(url,options)=>{sent={url,options};return Response.json(raw);});
 assert.equal(result.status,'connected');assert.equal(result.meals.length,raw.dishes.length);
 assert.equal(sent.options.headers.apikey,config.SUPABASE_CATALOG_KEY);
 assert.equal(sent.options.redirect,'error');assert.ok(!JSON.stringify(result).includes(config.SUPABASE_CATALOG_KEY));
});
test('unconfigured, failed, malformed or redirected backend keeps labelled snapshot',async()=>{
 assert.equal((await loadRestaurantCatalog({},merged,curated)).status,'snapshot');
 for(const request of [async()=>new Response('denied',{status:403}),async()=>Response.json({wrong:true}),async()=>{throw Error('timeout secret detail');}]){
  const result=await loadRestaurantCatalog(config,merged,curated,request);assert.equal(result.status,'stale');assert.deepEqual(result.meals,merged);
 }
 const invalid=await loadRestaurantCatalog({...config,SUPABASE_CATALOG_URL:'http://example.com'},merged,curated,()=>{throw Error('must not call');});assert.equal(invalid.status,'stale');
});
test('native app reads the web catalog without forwarding credentials',async()=>{
 const endpoint='https://example.com/api/meals';let sent;
 const result=await loadMobileCatalog(endpoint,merged,curated,undefined,async(url,options)=>{sent=options;return Response.json({status:'connected',meals:merged});});
 assert.equal(result.status,'connected');assert.equal(result.meals.length,raw.dishes.length);assert.equal(sent.credentials,'omit');assert.equal(sent.headers,undefined);
 for(const m of result.meals.filter(m=>m.nutritionStatus==='estimated'))assert.equal(m.estimationMethod,'ai');
 const fallback=await loadMobileCatalog(endpoint,merged,curated,undefined,async()=>new Response('sign in',{status:401}));assert.equal(fallback.status,'stale');
 assert.equal((await loadMobileCatalog(undefined,merged,curated)).status,'snapshot');
});

test('additional venues require source-backed Hamburg coordinates and preserve unknown nutrition',()=>{
 const venue={slug:'test-hamburg',name:'Test venue',latitude:53.55,longitude:9.99,location_source_url:'https://www.openstreetmap.org/node/123',menu_url:'https://example.com/menu'};
 const input={...raw,venues:[venue],dishes:[{...raw.dishes[0],slug:venue.slug,nutrition:null}]};
 const [meal]=adaptPilotCatalog(input);assert.equal(meal.restaurant,'Test venue');assert.equal(meal.lat,53.55);assert.equal(meal.calories,null);
 assert.throws(()=>adaptPilotCatalog({...input,venues:[{...venue,latitude:0}]}));
 assert.throws(()=>adaptPilotCatalog({...input,venues:[{...venue,location_source_url:'javascript:bad'}]}));
});
