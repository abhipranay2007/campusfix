const {spawn}=require('node:child_process');
const npm=process.platform==='win32'?'npm.cmd':'npm';
const children=[['npm',['run','dev','--prefix','server']],['npm',['run','dev','--prefix','client']]].map(([,args])=>spawn(npm,args,{stdio:'inherit',shell:process.platform==='win32'}));
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)if(!child.killed)child.kill('SIGTERM');process.exitCode=code;}
for(const child of children){child.on('exit',code=>{if(!stopping&&code!==0)stop(code||1)});child.on('error',error=>{console.error(error.message);stop(1)})}
process.on('SIGINT',()=>stop(0));process.on('SIGTERM',()=>stop(0));
