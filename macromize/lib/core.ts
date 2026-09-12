import {z} from 'zod';
import type {Meal} from './macromize';
const url=z.string().max(2000).refine(v=>v===''||/^https:\/\/[^\s]+$/.test(v),'Use an https menu link');
const photo=z.string().regex(/^\/api\/photos\/[a-f0-9-]{36}$/).nullable().optional();
const nutrient=z.number().min(0).max(10000).nullable();
export const mealSchema=z.object({
 id:z.string().min(1).max(100),name:z.string().trim().min(2).max(150),restaurant:z.string().trim().min(2).max(150),restaurantId:z.string().max(200).optional(),
 menuUrl:url,checkedAt:z.string().datetime(),lat:z.number().min(-90).max(90),lon:z.number().min(-180).max(180),
 ingredients:z.array(z.string().max(100)).max(100).nullable(),ingredientsComplete:z.boolean(),dietary:z.array(z.string().max(50)).nullable(),excludedIngredientChecks:z.record(z.string(),z.boolean()).nullable(),mealTypes:z.array(z.string()).min(1).max(4),
 calories:nutrient,protein:nutrient,carbs:nutrient,fat:nutrient,nutritionStatus:z.enum(['verified','estimated','unknown']),nutritionSource:url.nullable(),confidence:z.enum(['High','Medium','Low']).nullable(),assumptions:z.string().max(1500).nullable(),
 price:z.string().max(100).nullable(),imageUrl:photo.default(null),available:z.boolean().nullable(),priceAmount:z.number().min(0).max(1000).nullable().optional(),currency:z.literal('EUR').optional(),cuisine:z.string().max(80).optional(),
 sourceKind:z.literal('user-menu'),sourcePhoto:photo,sourceText:z.string().max(20000).optional(),estimationMethod:z.enum(['published','user','ai','unknown']).optional(),openingStatus:z.enum(['open','closed','unknown']).optional(),openingCheckedAt:z.string().datetime().nullable().optional()
}).refine(m=>!!m.menuUrl||!!m.sourcePhoto,'Add a menu link or photo');
const snapshot=z.custom<Meal>(v=>!!v&&typeof v==='object'&&typeof (v as Meal).id==='string'&&typeof (v as Meal).name==='string');
export const historySchema=z.object({kind:z.literal('history'),id:z.string().uuid(),meal:snapshot,chosenAt:z.string().datetime(),eatenAt:z.string().datetime().nullable(),rating:z.number().int().min(1).max(5).nullable(),photo:photo,note:z.string().max(1500).default('')});
export const reportSchema=z.object({kind:z.literal('report'),id:z.string().uuid(),mealId:z.string().max(100).nullable(),category:z.enum(['Nutrition','Ingredients','Price','Availability','Other']),detail:z.string().trim().min(5).max(2000),createdAt:z.string().datetime()});
export const librarySchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('meal'),id:z.string().min(1).max(100),meal:mealSchema}),historySchema,reportSchema,
 z.object({kind:z.literal('restaurant'),id:z.string().max(200),name:z.string().max(150),lat:z.number(),lon:z.number(),menuUrl:url})
]);
export type LibraryItem=z.infer<typeof librarySchema>;
export type HistoryItem=z.infer<typeof historySchema>;
export function profileStats(items:LibraryItem[]){const history=items.filter((i):i is HistoryItem=>i.kind==='history');return {chosen:history.length,eaten:history.filter(i=>i.eatenAt).length,photos:history.filter(i=>i.photo).length,rated:history.filter(i=>i.rating).length};}
export function menuCandidates(text:string){return text.split(/\r?\n/).map(line=>line.trim()).filter(line=>line.length>3&&line.length<180&&/[a-zA-ZÀ-ž]/.test(line)&&/(?:€|EUR|\d[,.]\d{2})/.test(line)).slice(0,30).map(line=>({name:line.replace(/\s*(?:€\s*)?\d{1,3}[,.]\d{2}\s*(?:€|EUR)?\s*$/,'').trim(),price:(line.match(/(\d{1,3}[,.]\d{2})/)?.[1]??'').replace(',','.'),raw:line}));}
