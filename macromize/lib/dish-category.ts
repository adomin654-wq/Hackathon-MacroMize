export const dishCategories=['burger','bowl','pasta','soup','curry','potato','pizza','wrap','dessert','plate'] as const;
export type DishCategory=typeof dishCategories[number];
export function dishCategory(meal:{name:string;restaurant?:string;assumptions?:string|null;illustrationCategory?:string;menu_category?:string;description?:string|null}):DishCategory{
 if(dishCategories.includes(meal.illustrationCategory as DishCategory))return meal.illustrationCategory as DishCategory;
 if(/erdapfel/i.test(meal.restaurant||''))return 'potato';
 const classify=(text:string):DishCategory|null=>{
  if(/kuchen|cake|brownie|muffin|dessert|sweets|müsli|porridge|granola|yoghurt|croissant|cinnamon|chocolate|smoothie/i.test(text))return 'dessert';
  if(/pizza|pinsa/i.test(text))return 'pizza';
  if(/wrap|sandwich|flatbread|pide|beyti/i.test(text))return 'wrap';
  if(/ramen|suppe|soup|pho\b|tantanmen/i.test(text))return 'soup';
  if(/curry|butter chicken|korma|saag chicken|rogan josh/i.test(text)&&!/wurst/i.test(text))return 'curry';
  if(/ofenkartoffel|kumpir|baked potato/i.test(text))return 'potato';
  if(/pasta|spaghetti|tagliatelle|tortell|ravioli|lasagn|gnocchi|udon|manti|mantı/i.test(text))return 'pasta';
  if(/\bburgers?\b|cheeseburger|^hamburger$/i.test(text))return 'burger';
  if(/bowl|salat|salad|insalata|donburi|unaju|bun nem|bun sa ot/i.test(text))return 'bowl';
  return null;
 };
 const named=classify(meal.name);
 if(named)return named;
 if(/steak|filetto|pannfisch|labskaus|schnitzel|ribs|haxe|wurst|würst|roulade|klopse|carpaccio|vitello|pulpo|gamberoni|cordon bleu|brauerschmaus/i.test(meal.name))return 'plate';
 return classify(meal.menu_category||'')||'plate';
}
export const dishLabels:Record<DishCategory,string>={burger:'Burger',bowl:'Bowl / Salad',pasta:'Pasta',soup:'Soup / Ramen',curry:'Curry',potato:'Baked potato',pizza:'Pizza',wrap:'Wrap / Sandwich',dessert:'Dessert',plate:'Dish'};
