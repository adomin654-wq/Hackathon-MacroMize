// Keep in sync with the native copy; cross-platform tests enforce parity.
export const goals = ['Build muscle', 'Lose weight', 'Gain weight', 'Maintain weight'] as const;
export const genders = ['Female','Male','Non-binary'] as const;
export const defaultHeight = (gender:Answers['sex']) => gender==='Male'?180:170;
export const activities = ['Mostly sitting', 'Moderately active', 'Very active'] as const;
export type Macros = { calories:number; protein:number; fat:number; carbs:number };
export type Answers = { goal:typeof goals[number]; age:number; sex:typeof genders[number]; height:number; weight:number; trainingDays:number; activity:typeof activities[number] };
export type PersonalProfile = Answers & { daily:Macros; mealShare:number; calculationVersion:1 };
export const macroKeys = ['calories','protein','fat','carbs'] as const;
function number(value:unknown,min:number,max:number,label:string):number {
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max) throw Error(`Please check your ${label}.`);
  return value;
}
export function validateAnswers(raw:unknown):Answers {
  if(!raw||typeof raw!=='object')throw Error('Please complete your details.');
  const a=raw as Answers;
  if(!goals.includes(a.goal)||!activities.includes(a.activity)||!genders.includes(a.sex))throw Error('Please complete your choices.');
  const age=number(a.age,18,120,'age'), trainingDays=number(a.trainingDays,0,7,'training days');
  if(!Number.isInteger(age)||!Number.isInteger(trainingDays))throw Error('Use whole years and training days.');
  return {goal:a.goal,sex:a.sex,activity:a.activity,age,trainingDays,height:number(a.height,100,250,'height'),weight:number(a.weight,30,350,'weight')};
}
export function validateDaily(raw:unknown):Macros {
  if(!raw||typeof raw!=='object')throw Error('Please check your daily macros.');
  const m=raw as Macros;
  return {calories:number(m.calories,1000,10000,'daily calories'),protein:number(m.protein,0,700,'protein'),fat:number(m.fat,0,500,'fat'),carbs:number(m.carbs,0,2000,'carbs')};
}
export function estimate(raw:unknown):Macros {
  const a=validateAnswers(raw);
  const resting=10*a.weight+6.25*a.height-5*a.age+(a.sex==='Male'?5:a.sex==='Female'?-161:-78);
  const training=a.trainingDays===0?0:a.trainingDays<=2?.1:a.trainingDays<=4?.2:.3;
  const factor=[1.2,1.4,1.6][activities.indexOf(a.activity)]+training;
  const calories=resting*factor*[1.1,.85,1.15,1][goals.indexOf(a.goal)];
  const protein=a.weight*(a.goal==='Build muscle'||a.goal==='Lose weight'?2:1.6);
  const fat=calories*.3/9, carbs=(calories-protein*4-fat*9)/4;
  return validateDaily({calories,protein,fat,carbs});
}
export function validateProfile(raw:unknown):PersonalProfile|null {
  if(raw===null||raw===undefined)return null;
  const p=raw as PersonalProfile;
  if(p.calculationVersion!==1)throw Error('Your saved profile could not be read.');
  return {...validateAnswers(p),daily:validateDaily(p.daily),mealShare:number(p.mealShare,.1,1,'meal share'),calculationVersion:1};
}
export function mealMacros(profile:PersonalProfile):Macros {
  const p=validateProfile(profile)!;
  return Object.fromEntries(macroKeys.map(k=>[k,Math.round(p.daily[k]*p.mealShare)])) as Macros;
}
export function flexibleScore(m:Record<keyof Macros,number|null>,t:Record<keyof Macros,number|null>,distance:number,radius:number):number|null {
  if(macroKeys.some(k=>m[k]===null||t[k]===null))return null;
  const fit=(k:keyof Macros)=>t[k]===0?(m[k]===0?1:0):Math.max(0,1-Math.abs(m[k]!-t[k]!)/t[k]!);
  return Math.round(100*(.35*fit('calories')+.35*fit('protein')+.1*fit('fat')+.1*fit('carbs')+.1*Math.max(0,1-distance/radius)));
}
