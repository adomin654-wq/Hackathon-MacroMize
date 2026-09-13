import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as web from '../lib/macromize.ts';
import * as native from '../../macromize-ios/src/domain.ts';
const origin={lat:53.55,lon:10};
const meal={id:'simple-test',name:'Fixture',restaurant:'Fixture',menuUrl:'https://example.com/menu',checkedAt:new Date().toISOString(),lat:53.6,lon:10,ingredients:null,ingredientsComplete:false,dietary:['vegan'],excludedIngredientChecks:null,mealTypes:['Breakfast'],calories:550,protein:42,carbs:50,fat:18,nutritionStatus:'verified',nutritionSource:'https://example.com/nutrition',confidence:null,assumptions:null,price:null,imageUrl:null,available:true};
for(const [name,app] of [['web',web],['native',native]]){
 test(`${name}: recommendations require all four nutrition values and retain labelled estimates`,()=>{
  for(const field of ['calories','protein','carbs','fat'])for(const value of [null,NaN,-1,Infinity])assert.equal(app.rankSimpleMeals([{...meal,[field]:value}],app.defaults,origin).length,0);
  assert.equal(app.rankSimpleMeals([{...meal,nutritionStatus:'unknown'}],app.defaults,origin).length,0);
  assert.equal(app.rankSimpleMeals([{...meal,nutritionStatus:'estimated',fat:0}],app.defaults,origin).length,1);
  assert.equal(app.rankSimpleMeals([{...meal,calories:0}],app.defaults,origin).length,0);
 });
 test(`${name}: removed legacy filters cannot hide meals; only macros and dietary preferences remain`,()=>{
  const old={...app.defaults,mealType:'Dinner',radius:.5,exclusions:['milk'],budget:1,budgetMax:1,cuisine:'Italian',openNow:true,remainingCalories:1,laterMeal:'Dinner'};
  assert.equal(app.rankSimpleMeals([meal],old,origin).length,1);
  assert.equal(app.rankSimpleMeals([{...meal,dietary:null}],{...old,diet:'Vegan'},origin).length,0);
  assert.equal(app.rankSimpleMeals([meal],{...old,diet:'Vegan'},origin).length,1);
  assert.equal(app.rankSimpleMeals([meal],{...old,fat:10,fatMax:10},origin).length,0);
  assert.equal(app.rankSimpleMeals([meal],{...old,carbs:20,carbsMax:20},origin).length,0);
  const cleaned=app.simplifyTargets(old);assert.equal(cleaned.calories,old.calories);assert.deepEqual(cleaned.exclusions,[]);assert.equal(cleaned.openNow,false);
 });
}

for(const [name,app] of [['web',web],['native',native]]){
 test(`${name}: vegetarian is preserved and includes vegan meals without admitting meat or unknown diets`,()=>{
  const targets=app.simplifyTargets({...app.defaults,diet:'Vegetarian'});
  assert.equal(targets.diet,'Vegetarian');
  const fixtures=[{...meal,id:'vegan'},{...meal,id:'vegetarian',dietary:['vegetarian']},{...meal,id:'meat',dietary:[]},{...meal,id:'unknown',dietary:null}];
  assert.deepEqual(app.rankSimpleMeals(fixtures,targets,origin).map(m=>m.id).sort(),['vegan','vegetarian']);
  assert.deepEqual(app.rankSimpleMeals(fixtures,{...targets,diet:'Vegan'},origin).map(m=>m.id),['vegan']);
  assert.equal(app.rankSimpleMeals(fixtures,{...targets,diet:'Any'},origin).length,4);
 });
}
