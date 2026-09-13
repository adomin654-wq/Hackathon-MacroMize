import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as p from '../lib/personal-profile.ts';
import * as nativeProfile from '../../macromize-ios/src/personal-profile.ts';
import * as web from '../lib/macromize.ts';
import * as native from '../../macromize-ios/src/domain.ts';
const answers={goal:'Build muscle',age:30,sex:'Male',height:180,weight:80,trainingDays:3,activity:'Mostly sitting'};
test('calculator is identical across platforms, with energy balance for every goal/activity/training combination',()=>{
 assert.equal(readFileSync(new URL('../lib/personal-profile.ts',import.meta.url),'utf8'),readFileSync(new URL('../../macromize-ios/src/personal-profile.ts',import.meta.url),'utf8'));
 for(const goal of p.goals)for(const activity of p.activities)for(let trainingDays=0;trainingDays<=7;trainingDays++)for(const sex of p.genders){
 const a={...answers,goal,activity,trainingDays,sex},m=p.estimate(a);assert.deepEqual(m,nativeProfile.estimate(a));assert.ok(Math.abs(m.calories-4*m.protein-9*m.fat-4*m.carbs)<1e-8);
 }
 const m=p.estimate(answers);assert.ok(Math.abs(m.calories-2741.2)<1e-8);assert.equal(m.protein,160);
 const calories=p.goals.map(goal=>p.estimate({...answers,goal}).calories);assert.ok(calories[1]<calories[3]&&calories[3]<calories[0]&&calories[0]<calories[2]);
});
test('invalid or implausible inputs reject; exact third and full day are retained',()=>{
 for(const patch of [{age:17},{age:NaN},{height:0},{weight:Infinity},{trainingDays:8},{trainingDays:1.5},{sex:'Other'},{activity:'unknown'}])assert.throws(()=>p.estimate({...answers,...patch}));
 const profile={...answers,daily:p.estimate(answers),mealShare:1/3,calculationVersion:1};assert.equal(p.validateProfile(profile).mealShare,1/3);assert.equal(p.mealMacros(profile).calories,914);
 assert.equal(p.mealMacros({...profile,mealShare:1}).calories,2741);assert.throws(()=>p.validateProfile({...profile,mealShare:0}));assert.equal(p.validateProfile(undefined),null);
 assert.throws(()=>p.estimate({...answers,sex:'Female',height:100,weight:30,age:100,trainingDays:0}));
});
const location={lat:53.55,lon:10};
const meal={id:'fixture',name:'Fixture',restaurant:'Fixture',menuUrl:'https://example.com/menu',checkedAt:new Date().toISOString(),...location,dietary:['vegan'],mealTypes:['Lunch'],ingredients:null,ingredientsComplete:false,excludedIngredientChecks:null,calories:600,protein:40,fat:20,carbs:65,nutritionStatus:'verified',available:true};
for(const [name,app] of [['web',web],['native',native]])test(`${name}: flexible targets rank all macros and retain excess and require complete nutrition; legacy limits remain`,()=>{
 const t={...app.defaults,comparison:'flexible',calories:600,protein:40,fat:20,carbs:65,fatMax:20,carbsMax:65};
 assert.equal(app.rankSimpleMeals([meal],t,location)[0].score,100);
 for(const key of ['calories','protein','fat','carbs']){
 const result=app.rankSimpleMeals([{...meal,[key]:meal[key]*1.2}],t,location);assert.equal(result.length,1);assert.ok(result[0].score<100);
 const missing=app.rankSimpleMeals([{...meal,[key]:null}],t,location);assert.equal(missing.length,0);
 }
 assert.equal(app.rankSimpleMeals([{...meal,fat:21}],{...t,comparison:'limits'},location).length,0);
 assert.equal(app.rankSimpleMeals([{...meal,nutritionStatus:'unknown'}],t,location).length,0);
});


test('non-binary profile retains its selection and uses a documented midpoint estimate',()=>{
 const male=p.estimate({...answers,sex:'Male'}),female=p.estimate({...answers,sex:'Female'}),daily=p.estimate({...answers,sex:'Non-binary'});
 assert.ok(Math.abs(daily.calories-(male.calories+female.calories)/2)<1e-8);
 const profile={...answers,sex:'Non-binary',daily,mealShare:1/3,calculationVersion:1};
 assert.equal(p.validateProfile(profile).sex,'Non-binary');assert.deepEqual(p.validateProfile(profile),nativeProfile.validateProfile(profile));
});
