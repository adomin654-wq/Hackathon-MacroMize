import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as preferences from '../src/preferences.ts';
import {defaults} from '../src/domain.ts';
import {emptyActivity} from '../src/activity.ts';

test('fresh install is incomplete; legacy records preserve goals, favourites and activity',()=>{
 assert.equal(preferences.freshPreferences().onboardingCompleted,false);
 const legacy={version:1,targets:{...defaults,mode:'goal'},saved:['existing'],activity:emptyActivity()};
 const migrated=preferences.parseStored(JSON.stringify(legacy));
 assert.equal(migrated.onboardingCompleted,true);
 assert.equal(migrated.targets.mode,'goal');
 assert.deepEqual(migrated.saved,legacy.saved);
 assert.deepEqual(migrated.activity,legacy.activity);
 for(const value of [false,true]) assert.equal(preferences.parseStored(JSON.stringify({...legacy,onboardingCompleted:value})).onboardingCompleted,value);
});

test('malformed onboarding state and invalid targets cannot masquerade as fresh preferences',()=>{
 const base={version:1,...preferences.freshPreferences()};
 for(const onboardingCompleted of [null,0,'false',{}]) assert.throws(()=>preferences.parseStored(JSON.stringify({...base,onboardingCompleted})));
 assert.throws(()=>preferences.parseStored(JSON.stringify({...base,targets:{...defaults,calories:null}})));
 assert.throws(()=>preferences.parseStored('broken json'));
});

function store(initial=null){
 let raw=initial,fail=false;
 const adapter={getItem:async()=>raw,setItem:async(_,value)=>{if(fail)throw Error('Disk unavailable');raw=value;}};
 const source=readFileSync(new URL('../src/storage.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};new Function('require','exports',code)(name=>name.includes('async-storage')?{__esModule:true,default:adapter}:preferences,exports);
 return {api:exports,raw:()=>raw,fail:value=>{fail=value;}};
}

test('completion and macros save atomically; failed writes preserve prior state and can retry',async()=>{
 const s=store();const fresh=await s.api.loadPreferences();
 const next={...fresh,onboardingCompleted:true,targets:{...fresh.targets,calories:725,protein:45}};
 s.fail(true);await assert.rejects(s.api.savePreferences(next));assert.equal(s.raw(),null);
 s.fail(false);await s.api.savePreferences(next);
 assert.deepEqual(await s.api.loadPreferences(),next);
 await s.api.savePreferences(preferences.freshPreferences());
 assert.equal((await s.api.loadPreferences()).onboardingCompleted,false);
});

test('corrupted storage rejects reads and writes without overwriting existing bytes',async()=>{
 const s=store('corrupted');
 await assert.rejects(s.api.loadPreferences());
 await assert.rejects(s.api.savePreferences(preferences.freshPreferences()));
 assert.equal(s.raw(),'corrupted');
});

test('personal profile is saved atomically, survives reload and can be erased',async()=>{
 const profile={goal:'Build muscle',age:30,sex:'Male',height:180,weight:80,trainingDays:3,activity:'Mostly sitting',daily:{calories:2700,protein:160,fat:90,carbs:313},mealShare:1/3,calculationVersion:1};
 const s=store();const state={...await s.api.loadPreferences(),profile,onboardingCompleted:true};await s.api.savePreferences(state);
 assert.deepEqual((await s.api.loadPreferences()).profile,profile);s.fail(true);
 await assert.rejects(s.api.savePreferences({...state,profile:{...profile,goal:'Lose weight'}}));assert.deepEqual((await s.api.loadPreferences()).profile,profile);s.fail(false);
 await s.api.savePreferences({...state,profile:null,onboardingCompleted:false});assert.equal((await s.api.loadPreferences()).profile,null);
 await assert.rejects(s.api.savePreferences({...state,profile:{...profile,mealShare:0}}));
});
