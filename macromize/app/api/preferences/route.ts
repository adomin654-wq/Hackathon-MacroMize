import { database } from "@/lib/guest-db";
import { defaults, targetsSchema } from "@/lib/macromize";
import { meals } from "@/data/meals";
import { z } from "zod";
function guest(request:Request){const raw=request.headers.get("cookie")?.match(/(?:^|;\s*)mm_guest=([a-f0-9-]{36})(?:;|$)/)?.[1];return raw??crypto.randomUUID();}
function headers(id:string,request:Request){return {"Cache-Control":"no-store","Set-Cookie":`mm_guest=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${new URL(request.url).protocol==="https:"?"; Secure":""}`};}
export async function GET(request:Request){
 try{const id=guest(request);const row=await database().prepare("SELECT targets, saved FROM guest_state WHERE id = ?").bind(id).first<{targets:string;saved:string}>();
 return Response.json(row?{targets:JSON.parse(row.targets),saved:JSON.parse(row.saved)}:{targets:defaults,saved:[]},{headers:headers(id,request)});
 }catch(error){console.error("Preferences load failed",error);return Response.json({error:"Your preferences could not be loaded. Please try again."},{status:503});}
}
export async function PUT(request:Request){
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Invalid origin"},{status:403});
 try{const body=await request.json();const input=z.object({targets:targetsSchema,saved:z.array(z.string().max(100)).max(200)}).parse(body);
 const id=guest(request);const own=await database().prepare("SELECT item_id FROM guest_items WHERE guest_id=? AND kind= ?").bind(id,"meal").all<{item_id:string}>();
 if(input.saved.some(mealId=>!meals.some(m=>m.id===mealId)&&!own.results.some(m=>m.item_id===mealId)))return Response.json({error:"A saved meal is no longer available."},{status:400});
 await database().prepare("INSERT INTO guest_state (id, targets, saved) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET targets=excluded.targets, saved=excluded.saved").bind(id,JSON.stringify(input.targets),JSON.stringify([...new Set(input.saved)])).run();
 return Response.json({ok:true},{headers:headers(id,request)});
 }catch(error){if(error instanceof z.ZodError||error instanceof SyntaxError)return Response.json({error:"Please check your inputs."},{status:400});console.error("Preferences save failed",error);return Response.json({error:"We couldn’t save your changes. Your inputs are still here; please try again."},{status:503});}
}
