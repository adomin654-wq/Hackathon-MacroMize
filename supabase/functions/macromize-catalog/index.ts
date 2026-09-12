// Server-to-server read only. Deploy separately after reviewing the integration branch.
import postgres from 'npm:postgres@3.4.3';
const slugs=['hamburg-hans-altes-rathaus','hamburg-dean-jungfernstieg','hamburg-peter-bleichenhof'];
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return reply({error:'POST required'},405);
 let keys:Record<string,unknown>={};try{keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');}catch{}
 const allowed=[Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),...Object.values(keys)].filter((k):k is string=>typeof k==='string'&&k.length>20);
 const bearer=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(!allowed.some(k=>k===bearer||k===req.headers.get('apikey')))return reply({error:'Administrator access required'},403);
 const dbUrl=Deno.env.get('SUPABASE_DB_URL');if(!dbUrl)return reply({error:'Backend not configured'},503);
 const sql=postgres(dbUrl,{prepare:false,max:1,connect_timeout:5,idle_timeout:5});
 try{
  const rows=await sql.begin(async tx=>{
   await tx`set transaction read only`;
   await tx`set local statement_timeout = '5000'`;
   return await tx`select d.id,r.slug,d.name,d.description,d.menu_category,d.price_eur,d.price_scope,
    d.is_vegan,d.is_vegetarian,d.ingredient_mentions,d.menu_options,d.observed_at,d.status,
    coalesce(d.source_item_url,s.url) as source_item_url,s.scope as source_scope,
    case when n.id is null then null else jsonb_build_object(
     'kcal',n.calories_kcal,'protein',n.protein_g,'carbs',n.carbs_g,'fat',n.fat_g,
     'source',n.evidence_url,'portion_label',n.portion_label,'method',n.method,
     'review_status',n.review_status,'is_current',n.is_current) end as nutrition
    from makromize.dishes d join makromize.restaurants r on r.id=d.restaurant_id
    join makromize.sources s on s.id=d.source_id
    left join lateral (select * from makromize.nutrition_versions nv where nv.dish_id=d.id order by nv.version desc limit 1) n on true
    where r.slug in ${tx(slugs)} and r.status<>'inactive'
    order by r.slug,d.name limit 2000`;
  });
  // postgres numeric values are strings by default. Convert explicitly for the API contract.
  const dishes=rows.map(r=>({...r,observed_at:new Date(r.observed_at).toISOString(),price_eur:r.price_eur===null?null:Number(r.price_eur)}));
  return reply({schemaVersion:1,mode:'pilot',dishes});
 }catch{return reply({error:'Catalog unavailable'},503);}
 finally{await sql.end({timeout:1});}
});
