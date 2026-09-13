type Nutrients={calories:number|null;protein:number|null;fat:number|null;carbs:number|null};
/** Relative closeness: high within 10%, good within 20%; never praise a larger deviation. */
export function mealFitReasons(meal:Nutrients,target:Nutrients,estimated=false):string[]{
 const keys=['calories','protein','fat','carbs'] as const;
 if(keys.every(k=>meal[k]!==null&&target[k]!==null&&meal[k]===target[k]))return [estimated?'Estimated nutrition matches all your meal targets.':'Matches all your meal targets exactly.'];
 return (['calories','protein'] as const).map(k=>{
  const actual=meal[k],goal=target[k],label=k==='calories'?'calorie':'protein',unit=k==='calories'?'kcal':'g';
  if(actual===null||goal===null)return `${k==='calories'?'Calorie':'Protein'} fit is unknown.`;
  const prefix=estimated?'Estimated: ':'';
  const values=`${Math.round(actual)} ${unit} for your ${Math.round(goal)} ${unit} target`;
  if(actual===goal)return `${prefix}Matches your ${label} target exactly (${values}).`;
  const deviation=goal===0?Infinity:Math.abs(actual-goal)/goal;
  if(deviation<=.1)return `${prefix}A close match for your ${label} target (${values}).`;
  if(deviation<=.2)return `${prefix}A good match for your ${label} target (${values}).`;
  return `${prefix}${Math.round(Math.abs(actual-goal))} ${unit} ${actual>goal?'above':'below'} your ${label} target (${values}).`;
 });
}
