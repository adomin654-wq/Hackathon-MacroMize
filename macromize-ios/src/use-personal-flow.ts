import { useState, useRef } from 'react';
import { defaultHeight, estimate, validateAnswers, validateDaily, validateProfile, type Answers, type PersonalProfile, type Macros } from './personal-profile';
export const titles = ["What’s your goal?",'How old are you?','What’s your gender?','How tall are you?',"What’s your current weight?",'How often do you work out?','How active is your everyday life?',"Here’s your daily starting point",'How much of your day is this meal?'];
export const tips = [
  "We use your goal to set calorie and macro targets that help your meals support it.",
  "We use your age to estimate how much energy your body needs each day.",
  "We ask because the calories your body needs at rest can differ by sex, helping us estimate your daily needs.",
  "Your height helps us estimate how much energy your body uses at rest.",
  "We use your weight to estimate your daily calories and protein target.",
  "We use your workout days to account for exercise in your daily calorie estimate.",
  "We use your everyday movement to estimate the energy you burn outside workouts.",
  "These estimates give you a starting point for the day, and you can adjust every value.",
  "We use this share to turn your daily targets into targets for one meal, with a third as a starting point."
];
export function usePersonalFlow(initial:PersonalProfile|null,start:number,onSave:(p:PersonalProfile)=>Promise<boolean>,onExit:()=>void) {
 const [step,setStep]=useState(start),[answers,setAnswers]=useState<Partial<Answers>>(initial?{...initial,trainingDays:Math.max(1,initial.trainingDays)}:{trainingDays:1});
 const [daily,setDaily]=useState<Macros|null>(initial?.daily??null),[share,setShare]=useState(initial?.mealShare??1/3);
 const [error,setError]=useState(''),[saving,setSaving]=useState(false),[done,setDone]=useState(false);
 const heightEdited=useRef(initial?.height!==undefined);
 function answer(key:keyof Answers,value:unknown){if(key==='height')heightEdited.current=true;setAnswers(a=>({...a,[key]:value,...(key==='sex'&&!heightEdited.current?{height:defaultHeight(value as Answers['sex'])}:{})}));setError('');}
 function back(){if(saving)return;setError('');if(step===start&&start===7||step===0)onExit();else setStep(s=>s-1);}
 async function next(){if(saving)return;setError('');try{
  if(step===0&&!answers.goal)throw Error('Choose your goal to continue.');
  if(step===1&&(!Number.isInteger(answers.age)||answers.age!<18||answers.age!>120))throw Error(answers.age!<18?'Automatic estimates are available for adults aged 18 and over.':'Enter your age in whole years.');
  if(step===2&&!answers.sex)throw Error('Choose your gender to continue.');
  if(step===3&&(!Number.isFinite(answers.height)||answers.height!<100||answers.height!>250))throw Error('Enter a height between 100 and 250 cm.');
  if(step===4&&(!Number.isFinite(answers.weight)||answers.weight!<30||answers.weight!>350))throw Error('Enter a weight between 30 and 350 kg.');
  if(step===5&&(!Number.isInteger(answers.trainingDays)||answers.trainingDays!<1||answers.trainingDays!>7))throw Error('Choose your training days.');
  if(step===6)setDaily(estimate(answers));
  if(step===7)validateDaily(daily);
  if(step===8){const p=validateProfile({...validateAnswers(answers),daily,mealShare:share,calculationVersion:1})!;setSaving(true);if(await onSave(p))setDone(true);else setError('We couldn’t save your changes. Your answers are still here. Please try again.');}
  else setStep(s=>s+1);
 }catch(e){setError(e instanceof Error?e.message:'Please check your answers.');}finally{setSaving(false);}}
 return {step,answers,answer,daily,setDaily,share,setShare,error,saving,done,back,next};
}
