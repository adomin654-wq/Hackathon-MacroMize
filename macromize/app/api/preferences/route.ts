import { validateProfile } from "@/lib/personal-profile";
import { env } from "cloudflare:workers";
import { loadRestaurantCatalog } from "@/lib/catalog-service";
import { database } from "@/lib/guest-db";
import { defaults, targetsSchema } from "@/lib/macromize";
import { meals, curatedMeals } from "@/data/meals";
import { z } from "zod";
function guest(request:Request){const raw=request.headers.get("cookie")?.match(/(?:^|;\s*)mm_guest=([a-f0-9-]{36})(?:;|$)/)?.[1];return raw??crypto.randomUUID();}
function headers(id:string,request:Request){return {"Cache-Control":"no-store","Set-Cookie":`mm_guest=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${new URL(request.url).protocol==="https:"?"; Secure":""}`};}
export async function GET(request:Request){
 try{const id=guest(request);const row=await database().prepare("SELECT targets, saved, onboarding_completed, profile FROM guest_state WHERE id = ?").bind(id).first<{targets:string;saved:string;onboarding_completed:number;profile:string|null}>();
 return Response.json(row?{profile:validateProfile(row.profile?JSON.parse(row.profile):null),targets:targetsSchema.parse(JSON.parse(row.targets)),saved:JSON.parse(row.saved),onboardingCompleted:row.onboarding_completed===1}:{profile:null,targets:defaults,saved:[],onboardingCompleted:false},{headers:headers(id,request)});
 }catch(error){console.error("Preferences load failed",error);return Response.json({error:"Your preferences could not be loaded. Please try again."},{status:503});}
}
export async function PUT(request:Request){
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Invalid origin"},{status:403});
 try{const body=await request.json();const input=z.object({profile:z.unknown().optional(),onboardingCompleted:z.boolean().optional(),targets:targetsSchema,saved:z.array(z.string().max(100)).max(200)}).parse(body);
 let profile;try{profile=validateProfile(input.profile);}catch{return Response.json({error:"Please check your profile."},{status:400});}
 const id=guest(request);const own=await database().prepare("SELECT item_id FROM guest_items WHERE guest_id=? AND kind= ?").bind(id,"meal").all<{item_id:string}>();
 const previous=await database().prepare("SELECT saved FROM guest_state WHERE id=?").bind(id).first<{saved:string}>();
 const retained:string[]=previous?JSON.parse(previous.saved):[];
 let accepted=meals;
 if(input.saved.some(mealId=>!retained.includes(mealId)&&!meals.some(m=>m.id===mealId)&&!own.results.some(m=>m.item_id===mealId))) accepted=(await loadRestaurantCatalog(env,meals,curatedMeals)).meals;
 if(input.saved.some(mealId=>!retained.includes(mealId)&&!accepted.some(m=>m.id===mealId)&&!own.results.some(m=>m.item_id===mealId)))return Response.json({error:"A saved meal is no longer available."},{status:400});
 await database().prepare("INSERT INTO guest_state (id, targets, saved, onboarding_completed, profile) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET targets=excluded.targets, saved=excluded.saved, profile=CASE WHEN ? THEN excluded.profile ELSE guest_state.profile END, onboarding_completed=COALESCE(?, guest_state.onboarding_completed)").bind(id,JSON.stringify(input.targets),JSON.stringify([...new Set(input.saved)]),input.onboardingCompleted===undefined?1:Number(input.onboardingCompleted),profile===null?null:JSON.stringify(profile),input.profile===undefined?0:1,input.onboardingCompleted===undefined?null:Number(input.onboardingCompleted)).run();
 return Response.json({ok:true},{headers:headers(id,request)});
 }catch(error){if(error instanceof z.ZodError||error instanceof SyntaxError)return Response.json({error:"Please check your inputs."},{status:400});console.error("Preferences save failed",error);return Response.json({error:"We couldn’t save your changes. Your inputs are still here; please try again."},{status:503});}
}
