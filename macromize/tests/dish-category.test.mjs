import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dishCategory} from '../lib/dish-category.ts';
test('dish illustrations distinguish main dishes from place names and side dishes',()=>{
 assert.equal(dishCategory({name:'Hamburger Pannfisch',menu_category:'Hamburger Klassiker'}),'plate');
 assert.equal(dishCategory({name:'Rumpsteak',description:'Mit Salat und Pommes'}),'plate');
 assert.equal(dishCategory({name:'Currywurst',menu_category:'Hamburger Klassiker'}),'plate');
 assert.equal(dishCategory({name:'Klassik',menu_category:'Burger'}),'burger');
 assert.equal(dishCategory({name:'Butter Chicken'}),'curry');
 assert.equal(dishCategory({name:'Caesar',restaurant:'Erdapfel'}),'potato');
 assert.equal(dishCategory({name:'Tagesgericht'}),'plate');
});
