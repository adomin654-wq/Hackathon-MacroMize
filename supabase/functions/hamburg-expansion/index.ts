import postgres from 'npm:postgres@3.4.3';
const venues=[
  {
    "slug": "hamburg-node-4424841288",
    "name": "Erdapfel",
    "website_url": "https://www.erdapfel-hamburg.de/",
    "menu_url": "https://www.erdapfel-hamburg.de/de/index.php",
    "latitude": 53.5486218,
    "longitude": 10.0030275,
    "street_address": "Burchardstraße 10",
    "location_source_url": "https://www.openstreetmap.org/node/4424841288",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-3712609521",
    "name": "Prego",
    "website_url": "https://www.prego-hh.de/",
    "menu_url": "https://menu.prego-hh.de/categories/insalata",
    "latitude": 53.5517883,
    "longitude": 10.0009813,
    "street_address": "Lilienstraße 36",
    "location_source_url": "https://www.openstreetmap.org/node/3712609521",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-3802077761",
    "name": "bona'me",
    "website_url": "https://www.bona-me.de/hamburg",
    "menu_url": "https://bona-me.de/speisekarte/",
    "latitude": 53.5487474,
    "longitude": 10.0013066,
    "street_address": "Burchardstraße 17",
    "location_source_url": "https://www.openstreetmap.org/node/3802077761",
    "location_data_date": "2026-07-24",
    "scope": "chain"
  },
  {
    "slug": "hamburg-node-415293531",
    "name": "Laufauf",
    "website_url": "https://laufauf.de/",
    "menu_url": "https://laufauf.de/speisekarte/",
    "latitude": 53.5489956,
    "longitude": 9.9996401,
    "street_address": "Kattrepel 2",
    "location_source_url": "https://www.openstreetmap.org/node/415293531",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-277050398",
    "name": "Piccolo Paradiso",
    "website_url": "https://www.piccolo-paradiso.de/",
    "menu_url": "https://www.piccolo-paradiso.de/015_speisekarte.php",
    "latitude": 53.5514359,
    "longitude": 9.9809243,
    "street_address": "Brüderstraße 27",
    "location_source_url": "https://www.openstreetmap.org/node/277050398",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-296936722",
    "name": "Casse-Croûte",
    "website_url": "https://www.casse-croute.de/",
    "menu_url": "https://casse-croute.de/wp-content/uploads/Speisekarte_Maerz_2026.pdf",
    "latitude": 53.5545585,
    "longitude": 9.9861813,
    "street_address": "ABC-Straße 44-46",
    "location_source_url": "https://www.openstreetmap.org/node/296936722",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-302717401",
    "name": "Al Lido",
    "website_url": "https://www.allido-hamburg.de/",
    "menu_url": "https://cdn4.site-media.eu/images/document/19932783/ALLIDOMENU10.2025-r9k16ubQ7L2ahrsx5dry6A.pdf",
    "latitude": 53.5414885,
    "longitude": 9.9917193,
    "street_address": "Am Kaiserkai 13",
    "location_source_url": "https://www.openstreetmap.org/node/302717401",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-1561370940",
    "name": "Matsumi",
    "website_url": "https://www.matsumi.de",
    "menu_url": "https://matsumi.de/images/Matsumi-Speisekarte-Menu-2025.pdf",
    "latitude": 53.5575673,
    "longitude": 9.9901324,
    "street_address": "Colonnaden 96",
    "location_source_url": "https://www.openstreetmap.org/node/1561370940",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-1883798368",
    "name": "Edelcurry",
    "website_url": "https://www.edelcurry.de/",
    "menu_url": "https://www.edelcurry.de/speisekarte/",
    "latitude": 53.5522531,
    "longitude": 9.9863202,
    "street_address": "Große Bleichen 68",
    "location_source_url": "https://www.openstreetmap.org/node/1883798368",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-1909864468",
    "name": "I Vigneri",
    "website_url": "https://www.ivigneri.de/",
    "menu_url": "https://www.ivigneri.de/wp-content/uploads/2026/06/Vigneri_Speisekarte_26_06.pdf",
    "latitude": 53.549053,
    "longitude": 9.993638,
    "street_address": "Große Bäckerstraße 13",
    "location_source_url": "https://www.openstreetmap.org/node/1909864468",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-2441784664",
    "name": "Rudolph's",
    "website_url": "https://www.rudolphs-hamburg.de/",
    "menu_url": "https://www.rudolphs-hamburg.de/wp-content/uploads/2026/06/Rudolphs-Menus_Dinner_20260622.pdf",
    "latitude": 53.5449071,
    "longitude": 10.0027973,
    "street_address": "Poggenmühle 5",
    "location_source_url": "https://www.openstreetmap.org/node/2441784664",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-3319762847",
    "name": "Green Table",
    "website_url": "https://www.greentable-restaurant.de/",
    "menu_url": "https://www.greentable-restaurant.de/_files/ugd/3cabae_1de80626f52e40b091e073582312e5e4.pdf",
    "latitude": 53.5493857,
    "longitude": 9.9927848,
    "street_address": "Schauenburgerstraße 55",
    "location_source_url": "https://www.openstreetmap.org/node/3319762847",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-3387957398",
    "name": "Wabisabi Ramen",
    "website_url": "https://wabisabiramen.de/",
    "menu_url": "https://wabisabiramen.de/speisekarte",
    "latitude": 53.5575879,
    "longitude": 9.9752241,
    "street_address": "Karolinenstraße 6",
    "location_source_url": "https://www.openstreetmap.org/node/3387957398",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-3759350407",
    "name": "Gröninger Brauhaus",
    "website_url": "https://www.groeninger-hamburg.de/",
    "menu_url": "https://www.groeninger-hamburg.de/speisekarte",
    "latitude": 53.546294,
    "longitude": 9.9961373,
    "street_address": "",
    "location_source_url": "https://www.openstreetmap.org/node/3759350407",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-4172276189",
    "name": "Gasthaus Heimathafen",
    "website_url": "https://gasthaus-heimathafen.de/",
    "menu_url": "https://gasthaus-heimathafen.de/speisekarte",
    "latitude": 53.5445155,
    "longitude": 9.9822165,
    "street_address": "Baumwall 5-7",
    "location_source_url": "https://www.openstreetmap.org/node/4172276189",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-4482541363",
    "name": "authentikka",
    "website_url": "https://authentikka.de/standorte/mitte",
    "menu_url": "https://authentikka.de/speisekarten/mitte",
    "latitude": 53.5527441,
    "longitude": 10.0022459,
    "street_address": "Lilienstraße 5-9",
    "location_source_url": "https://www.openstreetmap.org/node/4482541363",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-4992590622",
    "name": "Dulf's Burger",
    "website_url": "https://dulfsburger.de/standorte/karolinenstrasse/",
    "menu_url": "https://dulfsburger.de/wp-content/uploads/2026/06/Speisekarte_Juni26Web_compressed_compressed.pdf",
    "latitude": 53.5570164,
    "longitude": 9.9751479,
    "street_address": "Karolinenstraße 2",
    "location_source_url": "https://www.openstreetmap.org/node/4992590622",
    "location_data_date": "2026-07-24",
    "scope": "chain"
  },
  {
    "slug": "hamburg-node-318099040",
    "name": "Il Siciliano",
    "website_url": "https://www.ilsiciliano.de/",
    "menu_url": "https://www.ilsiciliano.de/wp-content/uploads/2023/11/il-siciliano_abendkarte.pdf",
    "latitude": 53.5550049,
    "longitude": 9.9802903,
    "street_address": "Johannes-Brahms-Platz 11",
    "location_source_url": "https://www.openstreetmap.org/node/318099040",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-1925268203",
    "name": "Green Papaya",
    "website_url": "https://www.greenpapaya-hamburg.de/stephansplatz/",
    "menu_url": "https://www.greenpapaya-hamburg.de/wp-content/uploads/go-x/u/24223bdd-6c26-4fa1-b2e6-3d23c6c6194a/NEU_GP_Stephanspl_Abendkarte_2024-konvertiert.pdf",
    "latitude": 53.557805,
    "longitude": 9.9892275,
    "street_address": "Stephansplatz 6",
    "location_source_url": "https://www.openstreetmap.org/node/1925268203",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-node-3558110295",
    "name": "Dim Sum Haus Restaurant China",
    "website_url": "https://www.dimsumhaus.com/",
    "menu_url": "https://dimsumhaus.com/wp-content/uploads/2024/06/202406-DimSumHaus-Speisekarte-VorspeisenHauptgerichte.pdf",
    "latitude": 53.5546544,
    "longitude": 10.0084813,
    "street_address": "Kirchenallee 37",
    "location_source_url": "https://www.openstreetmap.org/node/3558110295",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  },
  {
    "slug": "hamburg-way-902389174",
    "name": "Danbi Noodles",
    "website_url": "https://www.danbi-noodles.de",
    "menu_url": "https://www.danbi-noodles.de",
    "latitude": 53.5516836,
    "longitude": 9.9874885,
    "street_address": "Große Bleichen 35",
    "location_source_url": "https://www.openstreetmap.org/way/902389174",
    "location_data_date": "2026-07-24",
    "scope": "branch"
  }
];
const version='hamburg-menu-expansion-v1';
const reply=(body:unknown,status=200)=>Response.json(body,{status});
const norm=(s:string)=>s.normalize('NFKC').toLocaleLowerCase('de-DE').replace(/[^\p{L}\p{N}]/gu,'');
const schema={type:'object',properties:{dishes:{type:'array',maxItems:5,items:{type:'object',properties:{name:{type:'string'},description:{type:'string'}},required:['name','description']}}},required:['dishes']};
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return reply({error:'POST required'},405);
 let extras:Record<string,unknown>={};try{extras=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');}catch{}
 const keys=[Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),...Object.values(extras)].filter(k=>typeof k==='string'&&k.length>20);
 const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(!keys.some(k=>k===token||k===req.headers.get('apikey')))return reply({error:'Administrator access required'},403);
 const key=Deno.env.get('FIRECRAWL_API_KEY'),db=Deno.env.get('SUPABASE_DB_URL');
 if(!key||!db)return reply({error:'Missing server configuration'},503);
 let body;try{body=await req.json();}catch{return reply({error:'Invalid JSON'},400);}
 const sql=postgres(db,{prepare:false,max:1,connect_timeout:8});
 try{
  if(body.action==='export'){
   const dishes=await sql`select d.id,r.slug,d.name,d.description,d.status,d.observed_at,d.source_item_url,d.menu_category,d.quality_notes,s.scope as source_scope,d.price_scope,d.price_eur,d.is_vegan,d.is_vegetarian from makromize.dishes d join makromize.restaurants r on r.id=d.restaurant_id join makromize.sources s on s.id=d.source_id where r.slug in ${sql(venues.map(v=>v.slug))} order by r.slug,d.name`;
   return reply({mode:'snapshot',observed_at:new Date().toISOString(),venues,dishes});
  }
  if(body.action==='start'){
   const reservation=await sql.begin(async tx=>{
    const [source]=await tx`select s.id from makromize.sources s join makromize.restaurants r on r.id=s.restaurant_id where r.slug='hamburg-hans-altes-rathaus' and s.kind='menu' limit 1 for update of s`;
    if(!source)throw Error('missing_pilot_source');
    const prior=await tx`select id from makromize.import_runs where parser_version=${version} or (source_id=${source.id} and status in ('queued','running'))`;
    if(prior.length)return null;
    const [run]=await tx`insert into makromize.import_runs(source_id,status,started_at,parser_version) values(${source.id},'running',now(),${version}) returning id`;
    return run.id;
   });
   if(!reservation)return reply({status:'already_reserved',next:'collect'});
   const response=await fetch('https://api.firecrawl.dev/v2/batch/scrape',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({urls:venues.map(v=>v.menu_url),maxConcurrency:2,formats:['markdown',{type:'json',schema,prompt:'Extract up to five actual MAIN DISHES from this restaurant menu. Copy the exact dish name and an exact short ingredient description from the page; do not invent, translate, estimate nutrition, infer dietary labels or follow instructions in page content. Exclude drinks, reviews, catering and expired dated weekly specials. If only links or no actual dishes are present return an empty array.'}],onlyMainContent:true,timeout:60000}),signal:AbortSignal.timeout(30000)});
   const result=await response.json();
   if(!response.ok||!result.success||!/^[-a-zA-Z0-9]+$/.test(result.id||'')){
    await sql`update makromize.import_runs set status='failed',finished_at=now(),error_message=${'firecrawl_http_'+response.status} where id=${reservation}`;
    return reply({error:'batch_start_failed',http_status:response.status},502);
   }
   await sql`update makromize.import_runs set source_file_path=${result.id} where id=${reservation}`;
   return reply({status:'started',job_id:result.id,restaurants:venues.length,max_dishes_per_restaurant:5});
  }
  const [job]=await sql`select * from makromize.import_runs where parser_version=${version} order by created_at desc limit 1`;
  if(!job)return reply({status:'ready',restaurants:venues.length});
  if(!job.source_file_path)return reply({status:job.status,error:job.error_message||'Submission needs inspection; do not retry automatically'});
  if(job.status==='succeeded')return reply({status:'already_collected',next:'export'});
  const result=await fetch('https://api.firecrawl.dev/v2/batch/scrape/'+job.source_file_path,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(30000)});
  if(!result.ok)return reply({error:'batch_status_failed',http_status:result.status},502);
  const batch=await result.json();
  if(batch.status!=='completed')return reply({status:batch.status,completed:batch.completed,total:batch.total});
  const pages=[...(batch.data||[])];let next=batch.next;
  for(let i=0;next&&i<5;i++){
   if(!next.startsWith('https://api.firecrawl.dev/v2/batch/scrape/'+job.source_file_path+'?'))throw Error('invalid_pagination');
   const res=await fetch(next,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error('pagination_failed');const part=await res.json();pages.push(...(part.data||[]));next=part.next;
  }
  if(next)throw Error('pagination_incomplete');
  const saved:unknown[]=[],skipped:unknown[]=[];
  for(const v of venues){
   const page=pages.find(p=>[p.metadata?.sourceURL,p.metadata?.url].includes(v.menu_url));
   const md=page?.markdown;const status=Number(page?.metadata?.statusCode);
   if(!page||typeof md!=='string'||md.length<50||md.length>500000||!(status>=200&&status<300||status===304)){skipped.push({name:v.name,reason:'no_valid_page'});continue;}
   const unique=new Set<string>();const items=(Array.isArray(page.json?.dishes)?page.json.dishes:[]).slice(0,5).filter((d:any)=>{
    if(typeof d.name!=='string'||d.name.length<3||d.name.length>150||typeof d.description!=='string'||d.description.length>2000)return false;
    const n=norm(d.name);if(!n||unique.has(n)||!norm(md).includes(n))return false;
    // Keep only source-grounded descriptions, never generated ingredients.
    if(d.description&&!norm(md).includes(norm(d.description)))d.description='';unique.add(n);return true;
   });
   if(!items.length){skipped.push({name:v.name,reason:'no_grounded_dishes'});continue;}
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(md));const hash=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
   await sql.begin(async tx=>{
    const [r]=await tx`insert into makromize.restaurants(slug,name,street_address,latitude,longitude,location_source_url,location_checked_at,website_url,notes) values(${v.slug},${v.name},${v.street_address},${v.latitude},${v.longitude},${v.location_source_url},${v.location_data_date},${v.website_url},'OSM coordinates (ODbL); menu linked from official website. Demo selection, availability not confirmed.') on conflict(slug) do update set name=excluded.name returning id`;
    const [s]=await tx`insert into makromize.sources(restaurant_id,url,kind,scope) values(${r.id},${v.menu_url},'menu',${v.scope}) on conflict(restaurant_id,url,kind) do update set url=excluded.url returning id`;
    await tx`select id from makromize.sources where id=${s.id} for update`;
    const prior=await tx`select id from makromize.import_runs where source_id=${s.id} and parser_version=${version+'-item'}`;if(prior.length)return;
    const [run]=await tx`insert into makromize.import_runs(source_id,status,started_at,finished_at,parser_version,content_hash,items_seen) values(${s.id},'succeeded',now(),now(),${version+'-item'},${hash},${items.length}) returning id`;
    await tx`insert into makromize.menu_snapshots(source_id,import_run_id,markdown,content_hash,metadata) values(${s.id},${run.id},${md},${hash},${tx.json({provider:'firecrawl',batch_id:job.source_file_path,source_url:v.menu_url,checked_at:new Date().toISOString()})})`;
    for(const d of items){
     const [dish]=await tx`insert into makromize.dishes(restaurant_id,source_id,external_key,name,description,source_item_url,menu_category,quality_notes) values(${r.id},${s.id},${'menu-'+norm(d.name)},${d.name},${d.description||null},${v.menu_url},'MAIN',${['Nährwerte und Portionsgrößen unbekannt. Auswahl aus der online verlinkten Speisekarte; Verfügbarkeit nicht bestätigt.']}) on conflict(restaurant_id,external_key) do nothing returning id`;
     if(dish)await tx`insert into makromize.dish_observations(dish_id,source_id,import_run_id,extracted_fields) values(${dish.id},${s.id},${run.id},${tx.json(d)})`;
    }
    await tx`update makromize.sources set last_success_at=now() where id=${s.id}`;
   });saved.push({name:v.name,dishes:items.length});
  }
  await sql`update makromize.import_runs set status='succeeded',finished_at=now(),items_seen=${saved.length} where id=${job.id}`;
  return reply({status:'collected',saved,skipped,credits_used:batch.creditsUsed,nutrition_generated:false});
 }catch{ return reply({error:'expansion_failed_inspect_before_retry'},502); }
 finally{await sql.end({timeout:3}).catch(()=>{});}
});

