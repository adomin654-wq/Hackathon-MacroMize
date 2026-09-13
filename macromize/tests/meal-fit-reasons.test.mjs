import test from 'node:test';
import assert from 'node:assert/strict';
import { mealFitReasons as web } from '../lib/meal-fit-reasons.ts';
import { mealFitReasons as ios } from '../../macromize-ios/src/meal-fit-reasons.ts';
const target={calories:600,protein:40,fat:20,carbs:60};
for(const [platform,reasons] of [['web',web],['ios',ios]]) {
 test(`${platform}: exact and estimated matches are distinguished`,()=>{
  assert.deepEqual(reasons(target,target),['Matches all your meal targets exactly.']);
  assert.deepEqual(reasons(target,target,true),['Estimated nutrition matches all your meal targets.']);
 });
 test(`${platform}: calorie and protein closeness is symmetric and honest`,()=>{
  for(const direction of [-1,1]) {
   const result=reasons({...target,calories:600+direction*60,protein:40+direction*8},target);
   assert.match(result[0],/A close match/);
   assert.match(result[1],/A good match/);
   const far=reasons({...target,calories:600+direction*180,protein:40+direction*12},target);
   assert.match(far[0],direction===1?/180 kcal above/:/180 kcal below/);
   assert.doesNotMatch(far.join(' '),/good|close|exactly/);
  }
 });
 test(`${platform}: missing nutrition and zero targets do not earn praise`,()=>{
  assert.match(reasons({...target,protein:null},target)[1],/unknown/);
  assert.match(reasons(target,{...target,protein:0})[1],/40 g above/);
  assert.match(reasons({...target,fat:21},target)[0],/Matches your calorie target exactly/);
 });
}
