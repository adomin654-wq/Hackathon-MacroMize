"use client";
import AvocadoScore from './avocado-score';
import { useEffect, useRef, type ReactNode } from 'react';
import {Utensils, Leaf, Map as MapIcon, List as ListIcon} from 'lucide-react';
import {useMacroEditor,macroFields,type Macros} from '../lib/use-macro-editor';
import MealMap from './meal-map';
import { useLibrary } from './core-features';
import { restaurantKey, type Match, type Meal, type Targets } from '../lib/macromize';

type Props = {
 onVegan?:(vegan:boolean)=>void; layout?:'map'|'list'; onLayout?:(layout:'map'|'list')=>void; targets: Targets; matches: Match[]; location: {lat:number;lon:number;current?:boolean}|null;
 selectedId: string|null; onSelect: (meal:Match)=>void; onOpen: (meal:Meal)=>void;
 onMacros: (next:Macros)=>Promise<boolean>; onEdit: ()=>void; saved: string[]; onSave: (meal:Meal)=>void; library: ReturnType<typeof useLibrary>;
 saving: boolean; catalogStatus: string; catalogCount: number; onRetry: ()=>void; search: ReactNode;
};
export default function FindMeals(p:Props) {
 const isList=p.layout==='list';
 const visibleMatches=isList?p.matches:p.matches.slice(0,3);
 const editor=useMacroEditor(p.targets,p.onMacros);
 const slider=useRef<HTMLDivElement>(null);
 const active=visibleMatches.find(m=>m.id===p.selectedId)??visibleMatches[0];
 const index=active?visibleMatches.findIndex(m=>m.id===active.id):0;
 const select=(meal:Match)=>{p.onSelect(meal);const i=visibleMatches.findIndex(m=>m.id===meal.id);if(i<0){p.onOpen(meal);return;}const card=slider.current?.children[i] as HTMLElement|undefined;if(card)slider.current?.scrollTo({left:card.offsetLeft-slider.current.offsetLeft,behavior:'smooth'});};
 const ids=p.matches.map(m=>m.id).join('|');
 useEffect(()=>{if(!isList&&active){const card=slider.current?.children[index] as HTMLElement|undefined;if(card)slider.current?.scrollTo({left:card.offsetLeft-slider.current.offsetLeft,behavior:'instant'});}},[ids,isList]);
 return <section className="find-meals">
  <header className="meal-header"><div className="finder-title-row"><h1>Find my meals</h1><button type="button" className="vegan-chip" role="switch" aria-label="Vegan" aria-checked={p.targets.diet==='Vegan'} disabled={p.saving||editor.pending} onClick={()=>p.onVegan?.(p.targets.diet!=='Vegan')}><Leaf size={15}/><span>Vegan</span><span className="chip-indicator" aria-hidden="true"/></button></div>
   <form className="inline-macros" onSubmit={e=>{e.preventDefault();void editor.save();}}><div className="target-summary">{macroFields.map(field=><label className="editable-macro" key={field.key}><span>{field.label}{field.key==='protein'?' · min g':field.key==='calories'?'':' · max g'}</span><input aria-label={field.hint} inputMode="decimal" type="text" value={editor.draft[field.key]} placeholder={field.key==='calories'||field.key==='protein'?'Required':'No limit'} readOnly={editor.pending||p.saving} onChange={e=>editor.edit(field.key,e.target.value)} onBlur={()=>void editor.save()} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void editor.save();e.currentTarget.blur();}}}/></label>)}</div><div className="macro-save-status" aria-live="polite">{editor.pending?'Saving…':editor.error?<><span role="alert">{editor.error}</span><button type="submit">Retry</button></>:null}</div></form>
   {p.targets.mode==='goal'&&<p className="pilot-note">Goal matching: {p.targets.goal}</p>}
  </header>
  {!isList&&<section className="finder-location" aria-label="Search location">{p.search}</section>}
  <div className="finder-switch" role="tablist" aria-label="Meal view">{(['map','list'] as const).map(mode=><button key={mode} id={`tab-${mode}`} role="tab" aria-selected={(isList?'list':'map')===mode} aria-controls="finder-results" tabIndex={(isList?'list':'map')===mode?0:-1} onClick={()=>p.onLayout?.(mode)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'map':e.key==='End'?'list':mode==='map'?'list':'map';p.onLayout?.(next);document.getElementById(`tab-${next}`)?.focus();}}}>{mode==='map'?<MapIcon size={16}/>:<ListIcon size={16}/>}<span>{mode==='map'?'Map':'List'}</span></button>)}</div>
  <div id="finder-results" role="tabpanel" aria-labelledby={`tab-${isList?'list':'map'}`}>
  {!isList&&<section className="finder-location" aria-label="Meal map"><div className="finder-map"><MealMap location={p.location} matches={p.matches} selectedId={active?.id??null} onSelect={select}/></div></section>}
  <section className="recommendations" aria-label="Meal recommendations"><div className="section-heading"><h2>Recommendations</h2>{p.matches.length>0&&<span aria-live="polite">{isList?`${p.matches.length} meals`:`${index+1} / ${visibleMatches.length}`}</span>}</div><p className="pilot-note">{p.catalogCount} menu entries · {p.catalogStatus==='connected'?'Connected catalog':p.catalogStatus==='stale'?'Saved menus · live refresh unavailable':'Saved menu snapshot'}</p>
   {p.catalogStatus==='loading'&&<p role="status">Loading menus…</p>}
   {p.catalogStatus==='error'&&<div className="empty-state"><h3>Menus couldn’t be loaded</h3><button className="secondary-button" onClick={p.onRetry}>Try again</button></div>}
   {p.catalogStatus!=='loading'&&p.catalogStatus!=='error'&&!p.matches.length&&<div className="empty-state"><h3>No suitable meals nearby.</h3><p>Adjust your macros above or try another area in Map view.</p></div>}
   {p.targets.mode==='numeric'&&p.matches.length>0&&!p.matches.some(m=>m.exact)&&<p className="pilot-note">No exact match nearby. Here are the closest options.</p>}
   <div ref={slider} className={isList?"recommendation-list":"recommendation-slider"} role="region" aria-label="Recommended meals" tabIndex={0} onKeyDown={e=>{if(isList||e.target!==e.currentTarget||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const next=visibleMatches[index+(e.key==='ArrowRight'?1:-1)];if(next)select(next);}} onScroll={()=>{if(isList)return;const el=slider.current;if(!el||!el.children.length)return;const children=Array.from(el.children) as HTMLElement[];const closest=children.reduce((best,c,i)=>Math.abs(c.offsetLeft-el.offsetLeft-el.scrollLeft)<Math.abs(children[best].offsetLeft-el.offsetLeft-el.scrollLeft)?i:best,0);if(visibleMatches[closest]?.id!==active?.id)p.onSelect(visibleMatches[closest]);}}>
    {visibleMatches.map((meal,i)=><article className="recommendation-card" key={meal.id} aria-label={`Recommendation ${i+1} of ${visibleMatches.length}`}>
     <button className="compact-meal" onClick={()=>{p.onSelect(meal);p.onOpen(meal);}} aria-label={`View details for ${meal.name}`}>
      {meal.imageUrl?<img className="compact-photo" src={meal.imageUrl} alt=""/>:<span className="compact-photo photo-unavailable"><Utensils size={24}/><small>No photo</small></span>}
      <span className="compact-info"><span className="compact-title">{meal.name}</span><span className="compact-restaurant">{meal.restaurant}</span><span className="compact-macros">{meal.calories??'—'} kcal · {meal.protein??'—'} g protein · {meal.distanceKm.toFixed(1)} km</span>{meal.nutritionStatus!=='verified'&&<small>{meal.nutritionStatus==='unknown'?'Nutrition unknown':meal.estimationMethod==='ai'?'KI-geschätzt':'Estimated nutrition'}</small>}</span>
      <span className="compact-score"><AvocadoScore score={meal.score}/></span>
     </button>
    </article>)}
   </div>
   {!isList&&visibleMatches.length>1&&<div className="slider-controls"><button aria-label="Previous recommendation" disabled={index===0} onClick={()=>select(visibleMatches[index-1])}>← Previous</button><button aria-label="Next recommendation" disabled={index===visibleMatches.length-1} onClick={()=>select(visibleMatches[index+1])}>Next →</button></div>}
  </section>
  </div>
 </section>;
}
