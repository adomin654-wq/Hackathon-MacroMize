import {env} from 'cloudflare:workers';
export function photos(){const bucket=(env as unknown as {PHOTOS?:R2Bucket}).PHOTOS;if(!bucket)throw new Error('Photo storage unavailable');return bucket;}
