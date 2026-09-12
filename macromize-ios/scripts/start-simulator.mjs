import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli=fileURLToPath(new URL('../node_modules/expo/bin/cli',import.meta.url));
const server=spawn(process.execPath,[cli,'start','--go','--localhost'],{
 stdio:'inherit',env:{...process.env,NODE_OPTIONS:`${process.env.NODE_OPTIONS??''} --dns-result-order=ipv4first`.trim()},
});
server.on('exit',code=>process.exit(code??1));
for(let attempt=0;attempt<30;attempt++){
 try{const response=await fetch('http://127.0.0.1:8081/status');if(response.ok){
  const open=spawn('xcrun',['simctl','openurl','booted','exp://127.0.0.1:8081'],{stdio:'inherit'});
  open.on('exit',code=>{if(code)console.log('Open an iPhone simulator first, then open exp://127.0.0.1:8081 in Expo Go.');});break;
 }}catch{}
 await new Promise(resolve=>setTimeout(resolve,1000));
}
