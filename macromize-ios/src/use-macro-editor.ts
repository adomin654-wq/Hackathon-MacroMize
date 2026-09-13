import {useEffect, useRef, useState} from 'react';
export type Macros={calories:number;protein:number;fat:number|null;carbs:number|null};
export const macroFields=[{key:'calories',label:'Kcal',hint:'Calories for this meal',max:3000,min:100},{key:'protein',label:'Protein',hint:'Minimum protein in grams',max:250,min:0},{key:'fat',label:'Fat',hint:'Maximum fat in grams',max:250,min:0},{key:'carbs',label:'Carbs',hint:'Maximum carbohydrates in grams',max:500,min:0}] as const;
const strings=(values:Macros)=>Object.fromEntries(macroFields.map(({key})=>[key,values[key]===null?'':String(values[key])])) as Record<keyof Macros,string>;
export function useMacroEditor(values:Macros,onCommit:(next:Macros)=>Promise<boolean>){
 const [draft,setDraft]=useState(()=>strings(values)),[pending,setPending]=useState(false),[error,setError]=useState('');
 const dirty=useRef(false),lock=useRef(false);
 useEffect(()=>{if(!dirty.current)setDraft(strings(values));},[values.calories,values.protein,values.fat,values.carbs]);
 function edit(key:keyof Macros,value:string){dirty.current=true;setDraft(d=>({...d,[key]:value}));setError('');}
 async function save(){
  if(lock.current||!dirty.current)return;
  const next={} as Macros;
  for(const field of macroFields){const value=draft[field.key].trim().replace(',','.');if(!value&&(field.key==='fat'||field.key==='carbs')){next[field.key]=null;continue;}const number=Number(value);if(!value||!Number.isFinite(number)||number<field.min||number>field.max){setError(`${field.label}: enter ${field.min}–${field.max}${field.key==='calories'?' kcal':' g'}.`);return;}next[field.key]=number;}
  if(macroFields.every(({key})=>next[key]===values[key])){dirty.current=false;setError('');return;}
  lock.current=true;setPending(true);
  try{if(await onCommit(next)){dirty.current=false;setDraft(strings(next));setError('');}else setError('Changes could not be saved. Please retry.');}catch{setError('Changes could not be saved. Please retry.');}finally{lock.current=false;setPending(false);}
 }
 return {draft,pending,error,edit,save};
}
