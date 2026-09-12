import {database} from '@/lib/guest-db';
import {photos} from '@/lib/photos';
import {guest,guestHeaders,sameOrigin} from '@/lib/guest';
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid origin'},{status:403});
 try{const bytes=new Uint8Array(await request.arrayBuffer());if(bytes.length>5000000||bytes.length<12)return Response.json({error:'Choose a photo smaller than 5 MB.'},{status:400});
 const type=bytes[0]===255&&bytes[1]===216?'image/jpeg':bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71?'image/png':null;
 if(!type)return Response.json({error:'Choose a JPEG or PNG photo.'},{status:400});
 const owner=guest(request);const count=await database().prepare('SELECT COUNT(*) AS count FROM guest_files WHERE guest_id = ?').bind(owner).first<{count:number}>();if((count?.count??0)>=100)return Response.json({error:'Your photo limit is reached. Export and clear your data in Privacy.'},{status:400});
 const id=crypto.randomUUID(),key=`${owner}/${id}`;await photos().put(key,bytes,{httpMetadata:{contentType:type}});
 try{await database().prepare('INSERT INTO guest_files (id,guest_id,object_key,content_type) VALUES (?,?,?,?)').bind(id,owner,key,type).run();}catch(e){await photos().delete(key);throw e;}
 return Response.json({url:`/api/photos/${id}`},{headers:guestHeaders(owner,request)});
 }catch(e){console.error('Photo upload failed',e);return Response.json({error:'The photo could not be saved. Keep it and try again.'},{status:503});}
}
