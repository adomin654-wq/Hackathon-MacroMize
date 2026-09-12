import { env } from "cloudflare:workers";
import { meals, curatedMeals } from "@/data/meals";
import { loadRestaurantCatalog } from "@/lib/catalog-service";
export async function GET(){
 const catalog=await loadRestaurantCatalog(env,meals,curatedMeals);
 return Response.json(catalog,{headers:{"Cache-Control":"no-store"}});
}
