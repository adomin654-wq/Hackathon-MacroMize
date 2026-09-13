"use client";
import MizeMascot from './mize-mascot';
import { useEffect,useRef } from 'react';
import { goals,genders,activities,macroKeys,type PersonalProfile } from '../lib/personal-profile';
import { usePersonalFlow,titles,tips } from '../lib/use-personal-flow';
export default function PersonalOnboarding({initial,start=0,onSave,onExit,onFinish}:{initial:PersonalProfile|null;start?:number;onSave:(p:PersonalProfile)=>Promise<boolean>;onExit:()=>void;onFinish:()=>void}) {
 const f=usePersonalFlow(initial,start,onSave,onExit),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus();window.scrollTo(0,0);},[f.step,f.done]);
 const options=f.step===6?activities:[];
 const key='activity';
 const numeric=f.step===1?'age':'weight';
 return <section className="personal-flow">
 {f.done?<div className="personal-celebration"><div className="celebration-confetti" aria-hidden="true">✦ · ✧ · ✦</div><div className="mize-celebration-loop"><img src="/mize-celebrate.png" alt="Mize celebrates with both arms raised"/></div><h1 ref={heading} tabIndex={-1}>You’re all set!</h1><p>Let’s find a meal near you that fits.</p><p className="subline">You can change your goal and macros anytime in your profile.</p><button className="main-button" onClick={onFinish}>Find my meals →</button></div>:<>
 <div className="personal-progress"><button className="back" disabled={f.saving} onClick={f.back}>← Back</button><span>Step {f.step+1} of 9</span></div><progress max={9} value={f.step+1} aria-label="Onboarding progress"/>
 <div key={f.step} className="personal-question"><p className="eyebrow">A LITTLE ABOUT YOU</p><h1 ref={heading} tabIndex={-1}>{titles[f.step]}</h1><div className="personal-guide"><MizeMascot/><p>{tips[f.step]}</p></div>
 <form id="personal-step" onSubmit={e=>{e.preventDefault();void f.next();}}><fieldset disabled={f.saving} style={{border:0,padding:0,margin:0,minWidth:0}}> 
 {options.length>0&&<div className={`personal-options `}>{options.map(v=><button type="button" key={v} aria-pressed={f.answers[key]===v} onClick={()=>f.answer(key,v)}><span>{v}</span><span aria-hidden="true">{f.answers[key]===v?'✓':'↗'}</span></button>)}</div>}
 {[0,2].includes(f.step)&&<label className="personal-select">{f.step===0?'Goal':'Gender'}<select value={(f.step===0?f.answers.goal:f.answers.sex)??''} onChange={e=>f.answer(f.step===0?'goal':'sex',e.target.value)}><option value="" disabled>{f.step===0?'Choose your goal':'Choose your gender'}</option>{(f.step===0?goals:genders).map(v=><option key={v} value={v}>{v}</option>)}</select></label>}
 {[3,5].includes(f.step)&&<label className="personal-range">{f.step===3?'Height in cm':'days per week'}<output>{f.step===3?f.answers.height:f.answers.trainingDays}{f.step===3?' cm':f.answers.trainingDays===1?' day':' days'}</output><input aria-label={f.step===3?'Height in cm':'days per week'} type="range" min={f.step===3?100:1} max={f.step===3?250:7} step={1} value={f.step===3?f.answers.height:f.answers.trainingDays} onChange={e=>f.answer(f.step===3?'height':'trainingDays',e.target.valueAsNumber)}/><span className="range-ends"><span>{f.step===3?'100 cm':'1 day'}</span><span>{f.step===3?'250 cm':'7 days'}</span></span></label>}
 {[1,4].includes(f.step)&&<label className="personal-number">{numeric==='age'?'your age in years':'Weight in kg'}<div><input autoFocus inputMode={numeric==='age'?'numeric':'decimal'} type="number" step={numeric==='age'?1:.1} value={f.answers[numeric]??''} onChange={e=>f.answer(numeric,e.target.value===''?undefined:e.target.valueAsNumber)}/><span>{numeric==='age'?'years':'kg'}</span></div></label>}
 {f.step===7&&f.daily&&<div className="personal-macros">{macroKeys.map(k=><label key={k}>{k==='calories'?'Calories':k[0].toUpperCase()+k.slice(1)}<div><input type="number" step="any" value={Number.isNaN(f.daily![k])?'':Math.round(f.daily![k])} onChange={e=>f.setDaily({...f.daily!,[k]:e.target.valueAsNumber})}/><span>{k==='calories'?'kcal':'g'}</span></div></label>)}</div>}
 {f.step===8&&f.daily&&<><div className="share-presets">{[{label:'Small meal',hint:'A light bite',value:.2},{label:'Regular meal',hint:'A typical lunch',value:1/3},{label:'Large meal',hint:'Your biggest meal',value:.5}].map(p=><button type="button" key={p.label} aria-pressed={Math.abs(f.share-p.value)<.001} onClick={()=>f.setShare(p.value)}><b>{p.label}</b><span>{p.hint} · {Math.round(p.value*100)}%</span></button>)}</div><div className="personal-share"><strong>{Math.round(f.share*100)}<small>% of your day</small></strong><input aria-label="Share of daily macros for this meal" type="range" min={.1} max={1} step="any" value={f.share} onChange={e=>f.setShare(e.target.valueAsNumber)}/><div><span>Small meal</span><span>Main meal</span></div><button type="button" className="text-button" onClick={()=>f.setShare(1/3)}>Use a third</button></div><div className="personal-macros">{macroKeys.map(k=><div key={k}><strong>{Math.round(f.daily![k]*f.share)}</strong><span>{k==='calories'?'kcal':`${k} · g`}</span></div>)}</div></>}
 </fieldset></form>
 {f.error&&<p className="notice" role="alert">{f.error}</p>}</div><div className="personal-footer"><button className="main-button" form="personal-step" disabled={f.saving}>{f.saving?'Saving…':f.step===8?'Use these macros':'Continue'} →</button><small>{f.step===8?'You can change this anytime.':'Your next good meal starts here.'}</small></div>
 </>}
 </section>;
}
