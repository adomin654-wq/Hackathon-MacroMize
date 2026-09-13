import test from 'node:test';
import assert from 'node:assert/strict';
import { rankMeals, defaults, targetsSchema } from '../lib/macromize.ts';
// Synthetic fixtures for automated tests only. Never imported into the app catalog.
const origin={lat:53.55,lon:10};
const fixture={id:'test-only',name:'Synthetic test fixture',restaurant:'Test fixture',menuUrl:'https://example.com/test-menu',checkedAt:'2026-09-12',...origin,ingredients:null,ingredientsComplete:false,dietary:['vegan'],excludedIngredientChecks:null,mealTypes:['Lunch'],calories:550,protein:42,carbs:50,fat:18,nutritionStatus:'verified',nutritionSource:'https://example.com/test-nutrition',confidence:null,assumptions:null,price:null,imageUrl:null,available:null};
test('unknown excluded-ingredient information fails closed',()=>{
 assert.equal(rankMeals([fixture],{...defaults,exclusions:['peanuts']},origin).length,0);
 assert.equal(rankMeals([{...fixture,excludedIngredientChecks:{peanuts:false}}],{...defaults,exclusions:['peanuts']},origin).length,0);
 assert.equal(rankMeals([{...fixture,excludedIngredientChecks:{peanuts:true}}],{...defaults,exclusions:['peanuts']},origin).length,1);
});
test('diet eligibility is separate from scoring',()=>{
 assert.equal(rankMeals([{...fixture,dietary:null}],{...defaults,diet:'Vegan'},origin).length,0);
 assert.equal(rankMeals([fixture],{...defaults,diet:'Vegetarian'},origin).length,1);
});
test('unknown nutrition is not assigned a confident match score',()=>{
 const result=rankMeals([{...fixture,calories:null,protein:null,nutritionStatus:'unknown'}],defaults,origin)[0];
 assert.equal(result.score,null);assert.equal(result.exact,false);
});
test('trade-offs rank below a fitting meal and are explained',()=>{
 const results=rankMeals([{...fixture,id:'over',calories:800,protein:20},fixture],defaults,origin);
 assert.equal(results[0].id,'test-only');assert.equal(results[1].exact,false);
 assert.ok(results[1].reasons.includes('200 kcal above your target'));
});
test('unavailable, out-of-radius and unsourced records do not appear',()=>{
 assert.equal(rankMeals([{...fixture,lat:50},{...fixture,available:false},{...fixture,menuUrl:''}],defaults,origin).length,0);
});
test('targets reject invalid or unbounded input',()=>{
 for(const calories of [-1,0,10001,NaN])assert.equal(targetsSchema.safeParse({...defaults,calories}).success,false);
});
test('unknown status suppresses numeric values and exact match',()=>{
 const result=rankMeals([{...fixture,nutritionStatus:'unknown'}],defaults,origin)[0];
 assert.equal(result.calories,null);assert.equal(result.protein,null);assert.equal(result.score,null);assert.equal(result.exact,false);
});
test('contradictory excluded ingredient data is rejected',()=>{
 assert.equal(rankMeals([{...fixture,ingredients:['peanuts'],excludedIngredientChecks:{peanuts:true}}],{...defaults,exclusions:['peanuts']},origin).length,0);
});
test('estimated nutrition does not claim an exact verified match',()=>{
 assert.equal(rankMeals([{...fixture,nutritionStatus:'estimated'}],defaults,origin)[0].exact,false);
});
