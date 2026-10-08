// Execute the real game loop and input handlers with a minimal canvas/DOM adapter.
// This verifies wiring, not browser rendering or audio quality.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
for(const touch of [false,true])test(touch?'touch input integration':'mouse/keyboard integration',()=>{
 const callbacks={};let raf,now=0;const noop=()=>{};
 const ctx=new Proxy({measureText:s=>({width:s.length*6}),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>k in o?o[k]:noop});
 const els={};function el(id){return els[id]||=( {style:{},width:240,height:176,classList:{add:noop,remove:noop},getContext:()=>ctx,querySelector:s=>el(id+s),querySelectorAll:()=>[],addEventListener:(t,f)=>{(callbacks[id+':'+t]||=[]).push(f)},getBoundingClientRect:()=>id==='sa'?{left:0,top:0,right:390,bottom:844}:{left:0,top:0,width:240,height:176}} );}
 const sandbox={console,URLSearchParams,location:{search:touch?'?touch':''},navigator:{maxTouchPoints:touch?1:0},performance:{now:()=>now},setTimeout:noop,setInterval:noop,requestAnimationFrame:f=>raf=f,localStorage:{getItem:()=>null,setItem:()=>assert.fail('training must not save')},document:{getElementById:el,createElement:()=>el(Math.random()),addEventListener:noop},innerWidth:390,innerHeight:844,devicePixelRatio:1,matchMedia:()=>({matches:false}),addEventListener:(t,f)=>{(callbacks['window:'+t]||=[]).push(f)}};sandbox.window=sandbox;
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/tactics.js'),'utf8'),sandbox);vm.runInContext(html.match(/<script>\s*([\s\S]*?)<\/script>/)[1],sandbox);
 const step=(n=1)=>{for(let i=0;i<n;i++){now+=17;raf(now);}};
 const key=code=>{callbacks['window:keydown'].forEach(f=>f({code,preventDefault:noop}));step();callbacks['window:keyup'].forEach(f=>f({code,preventDefault:noop}));step();};
 const tap=(x,y)=>{if(touch)callbacks['game:touchstart'].forEach(f=>f({changedTouches:[{clientX:x,clientY:y}]}));else callbacks['game:mousedown'].forEach(f=>f({clientX:x,clientY:y}));step();};
 step();key('Enter');key('ArrowDown');key('ArrowDown');key('Enter');assert.equal(sandbox.__dq.scene,'tactics');step();tap(90,94);assert.equal(sandbox.__dq.tactics.hero.x,3);tap(206,165);step(130);assert.equal(sandbox.__dq.tactics.turn,2);
 key('Escape');assert.equal(sandbox.__dq.scene,'title');key('Enter');step(45);assert.equal(sandbox.__dq.scene,'field');assert.equal(sandbox.__dq.hero.hp,30);sandbox.__dq.startBattle('slime');step(90);assert.equal(sandbox.__dq.scene,'battle');assert.equal(sandbox.__dq.battle.e.name,'スライム');
});
