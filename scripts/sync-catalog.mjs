import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const pairs=[['reference-data/supabase-pilot-catalog.json','macromize/data/supabase-pilot-catalog.json'],['reference-data/supabase-pilot-catalog.json','macromize-ios/src/supabase-pilot-catalog.json'],['macromize/lib/pilot-catalog.ts','macromize-ios/src/pilot-catalog.ts']];
for(const [source,target] of pairs){const expected=readFileSync(path.join(root,source));const output=path.join(root,target);if(process.argv.includes('--check')){if(!readFileSync(output).equals(expected))throw Error(`Catalog out of sync: ${target}`);}else{mkdirSync(path.dirname(output),{recursive:true});writeFileSync(output,expected);}}
console.log('Web and iOS catalog assets are in sync.');
