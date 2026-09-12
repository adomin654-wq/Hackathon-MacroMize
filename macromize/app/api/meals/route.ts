import { meals, catalogConnected } from "@/data/meals";
export async function GET(){
  return Response.json({status:catalogConnected?"connected":"not_connected",meals},{headers:{"Cache-Control":"no-store"}});
}
