import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
import {z} from 'zod';
import * as personal from '../lib/personal-profile.ts';
import * as domain from '../lib/macromize.ts';
import * as pilot from '../lib/pilot-catalog.ts';
const rawPilot=JSON.parse(readFileSync(new URL('../data/supabase-pilot-catalog.json',import.meta.url),'utf8'));
const catalog={};
new Function('require','exports',ts.transpileModule(readFileSync(new URL('../data/meals.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>name.endsWith('.json')?{__esModule:true,default:rawPilot}:pilot,catalog);

const id='11111111-1111-4111-8111-111111111111';
function setup(legacy=false){
 const sql=new DatabaseSync(':memory:');
 for(const name of ['0000_mean_spiral','0001_exotic_lady_bullseye','0002_boring_lightspeed']) sql.exec(readFileSync(new URL(`../drizzle/${name}.sql`,import.meta.url),'utf8'));
 if(legacy)sql.prepare('INSERT INTO guest_state (id,targets,saved) VALUES (?,?,?)').run(id,JSON.stringify({...domain.defaults,mode:'goal'}),JSON.stringify(['old-catalog-id']));
 sql.exec(readFileSync(new URL('../drizzle/0003_onboarding.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../drizzle/0004_personal_profile.sql',import.meta.url),'utf8'));
 let fail=false;
 const database=()=>({prepare:text=>({bind:(...args)=>({first:async()=>sql.prepare(text).get(...args)??null,all:async()=>({results:sql.prepare(text).all(...args)}),run:async()=>{if(fail)throw Error('Simulated disk failure');return sql.prepare(text).run(...args);}})})});
 const source=readFileSync(new URL('../app/api/preferences/route.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};new Function('require','exports',code)(name=>({'cloudflare:workers':{env:{}},'@/lib/guest-db':{database},'@/lib/macromize':domain,'@/lib/personal-profile':personal,'@/data/meals':catalog,'zod':{z},'@/lib/catalog-service':{loadRestaurantCatalog:async()=>({meals:[...catalog.meals,{id:'live-only'}]})}}[name]),exports);
 const request=(method='GET',body)=>new Request('https://example.test/api/preferences',{method,headers:{cookie:`mm_guest=${id}`,origin:'https://example.test','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 return {sql,api:exports,request,fail:v=>{fail=v;}};
}

test('new browser starts incomplete; migration preserves old goal mode and saved IDs',async()=>{
 const fresh=setup();assert.equal((await (await fresh.api.GET(fresh.request())).json()).onboardingCompleted,false);fresh.sql.close();
 const old=setup(true);const value=await (await old.api.GET(old.request())).json();
 assert.equal(value.onboardingCompleted,true);assert.equal(value.targets.mode,'goal');assert.deepEqual(value.saved,['old-catalog-id']);old.sql.close();
});

test('explicit completion round-trips with macros; old clients preserve status',async()=>{
 const s=setup();const targets={...domain.defaults,calories:750,protein:50};
 assert.equal((await s.api.PUT(s.request('PUT',{targets,saved:[],onboardingCompleted:false}))).status,200);
 await s.api.PUT(s.request('PUT',{targets,saved:[]}));assert.equal((await (await s.api.GET(s.request())).json()).onboardingCompleted,false);
 await s.api.PUT(s.request('PUT',{targets,saved:[],onboardingCompleted:true}));
 await s.api.PUT(s.request('PUT',{targets,saved:[]}));
 const result=await (await s.api.GET(s.request())).json();assert.equal(result.onboardingCompleted,true);assert.equal(result.targets.calories,750);s.sql.close();
});

test('snapshot and live catalog favourites save; retained missing meals survive; arbitrary IDs reject',async()=>{
 const s=setup(true);const snapshot=catalog.meals.find(m=>!catalog.curatedMeals.some(c=>c.id===m.id));assert.ok(snapshot);
 const input={targets:domain.defaults,saved:[snapshot.id,'live-only','old-catalog-id'],onboardingCompleted:true};
 assert.equal((await s.api.PUT(s.request('PUT',input))).status,200);
 assert.deepEqual((await (await s.api.GET(s.request())).json()).saved,input.saved);
 assert.equal((await s.api.PUT(s.request('PUT',{...input,saved:['made-up']}))).status,400);s.sql.close();
});

test('invalid values and failed storage never complete onboarding or overwrite saved macros',async()=>{
 const s=setup();assert.equal((await s.api.PUT(s.request('PUT',{targets:{...domain.defaults,calories:null},saved:[],onboardingCompleted:true}))).status,400);
 s.fail(true);assert.equal((await s.api.PUT(s.request('PUT',{targets:domain.defaults,saved:[],onboardingCompleted:true}))).status,503);
 assert.equal((await (await s.api.GET(s.request())).json()).onboardingCompleted,false);s.sql.close();
});

test('profile and flexible targets are atomic, old API callers preserve profile, invalid profiles reject',async()=>{
 const s=setup(true);const answers={goal:'Build muscle',age:30,sex:'Male',height:180,weight:80,trainingDays:3,activity:'Mostly sitting'};
 const profile={...answers,daily:personal.estimate(answers),mealShare:1/3,calculationVersion:1};
 const targets={...domain.defaults,...personal.mealMacros(profile),comparison:'flexible'};
 const body={profile,targets,saved:['old-catalog-id'],onboardingCompleted:true};
 assert.equal((await s.api.PUT(s.request('PUT',body))).status,200);
 assert.deepEqual((await (await s.api.GET(s.request())).json()).profile,profile);
 await s.api.PUT(s.request('PUT',{targets,saved:body.saved}));assert.deepEqual((await (await s.api.GET(s.request())).json()).profile,profile);
 s.fail(true);assert.equal((await s.api.PUT(s.request('PUT',{...body,profile:{...profile,goal:'Lose weight'}}))).status,503);
 assert.deepEqual((await (await s.api.GET(s.request())).json()).profile,profile);s.fail(false);
 assert.equal((await s.api.PUT(s.request('PUT',{...body,profile:{...profile,age:17}}))).status,400);
 assert.equal((await s.api.PUT(s.request('PUT',{...body,profile:null}))).status,200);
 assert.equal((await (await s.api.GET(s.request())).json()).profile,null);s.sql.close();
});
