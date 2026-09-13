import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as React from 'react';
import * as jsx from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import * as domain from '../lib/macromize.ts';
import * as macroEditor from '../lib/use-macro-editor.ts';
import * as dishCategories from '../lib/dish-category.ts';
import * as icons from 'lucide-react';
import * as scoreCopy from '../lib/match-score-info.ts';

const badgeExports={};
const badgeCode=ts.transpileModule(readFileSync(new URL('../components/avocado-score.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
new Function('require','exports',badgeCode)(()=>jsx,badgeExports);
const illustrationExports={};
const illustrationCode=ts.transpileModule(readFileSync(new URL('../components/dish-illustration.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
new Function('require','exports',illustrationCode)(name=>name==='react/jsx-runtime'?jsx:dishCategories,illustrationExports);
const infoExports={};
const infoCode=ts.transpileModule(readFileSync(new URL('../components/match-score-info.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
new Function('require','exports',infoCode)(name=>({'react':React,'react/jsx-runtime':jsx,'../lib/match-score-info':scoreCopy,'./match-score-info.css':{}}[name]),infoExports);
const exports={};
const source=readFileSync(new URL('../components/find-meals.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
new Function('require','exports',code)(name=>({'react':React,'react/jsx-runtime':jsx,'./match-score-info':infoExports,'./avocado-score':badgeExports,'./dish-illustration':illustrationExports,'./meal-map':{__esModule:true,default:()=>null},'../lib/macromize':domain,'../lib/use-macro-editor':macroEditor,'lucide-react':icons}[name]),exports);
const meal={id:'fixture',name:'Fixture meal',restaurant:'Fixture restaurant',menuUrl:'',lat:53.55,lon:9.99,calories:null,protein:null,fat:null,carbs:null,score:null,distanceKm:.2,nutritionStatus:'unknown',price:null,exact:false};
const noop=()=>{};
function render(matches,layout="map",targets=domain.defaults){return renderToStaticMarkup(React.createElement(exports.default,{layout,targets,matches,location:meal,selectedId:null,onSelect:noop,onOpen:noop,onEdit:noop,saved:[],onSave:noop,library:{items:[],loaded:true,busy:false,save:noop,remove:noop},saving:false,catalogStatus:'snapshot',catalogCount:159,onRetry:noop,search:React.createElement('span',null,'Search this area')}));}

test('recommendations render all actual results without fabricated cards',()=>{
 for(const count of [0,1,2,3,12]){const html=render(Array.from({length:count},(_,i)=>({...meal,id:`fixture-${i}`})));assert.equal((html.match(/<article /g)??[]).length,Math.min(count,3));assert.equal(html.includes('No suitable meals nearby.'),count===0);assert.equal(html.includes('Next recommendation'),count>1);}
});
test('compact recommendations open details and keep save and website actions out of the overview',()=>{
 const html=render([meal]);assert.match(html,/Nutrition unknown/);assert.doesNotMatch(html,/Website unavailable/);assert.doesNotMatch(html,/Get directions/);assert.doesNotMatch(html,/Save options/);assert.match(html,/View details for Fixture meal/);assert.doesNotMatch(html,/No photo/);assert.match(html,/Dish · Illustration/);assert.match(html,/Recommendations/);assert.match(html,/No limit/);assert.doesNotMatch(html,/null kcal/);assert.match(html,/Match score unavailable/);assert.doesNotMatch(html,/Edit macros/);
});
test('header exposes four directly editable numeric fields and scored meals have an accessible compact score',()=>{
 const html=render([{...meal,score:97}]);assert.equal((html.match(/<input /g)??[]).length,4);assert.match(html,/Match score 97 out of 100/);assert.match(html,/class="small-avocado"/);
});
test('AI nutrition is visibly labelled on both recommendation layouts',()=>{
 for(const layout of ['map','list']){
  const html=render([{...meal,nutritionStatus:'estimated',estimationMethod:'ai',calories:600,protein:30,carbs:60,fat:27,score:85}],layout);
  assert.match(html,/AI estimate/);assert.match(html,/600/);assert.match(html,/Match score 85 out of 100/);assert.doesNotMatch(html,/Published nutrition/);
 }
});

test('list view renders every compact meal vertically without map-slider controls',()=>{const html=render(Array.from({length:12},(_,i)=>({...meal,id:`meal-${i}`})),'list');assert.equal((html.match(/<article /g)??[]).length,12);assert.match(html,/class="recommendation-list"/);assert.doesNotMatch(html,/Next recommendation|class="finder-map"/);assert.match(html,/12 meals/);assert.doesNotMatch(html,/Search this area/);});

test('score info replaces the old notice for exact and near matches and uses the saved comparison mode',()=>{
 for(const exact of [true,false])for(const layout of ['map','list'])for(const comparison of ['limits','flexible']){
  const html=render([{...meal,exact,score:90}],layout,{...domain.defaults,comparison});
  assert.match(html,/About the match score/);assert.match(html,/How your match score works/);
  assert.doesNotMatch(html,/No exact match nearby/);
  assert.equal(html.includes('35% each'),comparison==='flexible');
  assert.equal(html.includes('45% each'),comparison==='limits');
 }
 assert.doesNotMatch(render([]),/About the match score/);
 assert.equal(readFileSync(new URL('../lib/match-score-info.ts',import.meta.url),'utf8'),readFileSync(new URL('../../macromize-ios/src/match-score-info.ts',import.meta.url),'utf8'));
});
