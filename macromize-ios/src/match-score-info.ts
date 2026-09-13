export function matchScoreExplanation(comparison?:string):string[]{
 return comparison==='flexible'?[
 'Your score compares each meal with the meal targets you set above.',
 'Calories and protein count for 35% each, fat and carbs for 10% each, and distance for 10%.',
 'Closer to your targets means a higher score—being above or below counts equally. Nearby meals earn more distance points, up to 2 km away.',
 'Scores use available nutrition values, which may be estimates.',
 ]:[
 'Your score compares each meal with your calorie limit and protein minimum.',
 'Calories and protein count for 45% each, and distance for 10%. Meals must also stay within any fat and carb limits you set.',
 'Scores use available nutrition values, which may be estimates.',
 ];
}
