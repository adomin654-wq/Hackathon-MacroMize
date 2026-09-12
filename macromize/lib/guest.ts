export function guest(request:Request){return request.headers.get('cookie')?.match(/(?:^|;\s*)mm_guest=([a-f0-9-]{36})(?:;|$)/)?.[1]??crypto.randomUUID();}
export function guestHeaders(id:string,request:Request){return {'Cache-Control':'no-store','Set-Cookie':`mm_guest=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`};}
export function sameOrigin(request:Request){return !request.headers.get('origin')||request.headers.get('origin')===new URL(request.url).origin;}
