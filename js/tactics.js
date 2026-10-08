/* DOM/audio independent rules. Unit stats are data for future mech loadouts. */
(function(root) {
'use strict';
const distance = (a,b) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const dirs = [[0,-1],[-1,0],[1,0],[0,1]];
class Battle {
  constructor() {
    this.map = ['..........','....##....','....#.....','..........','..#.......','..##......'];
    this.units = [
      {id:'hero',team:'player',name:'ゆうしゃ',sprite:'hero',x:1,y:3,hp:32,maxHp:32,atk:9,def:3,move:3,range:1},
      {id:'slime',team:'enemy',name:'スライム',sprite:'slime',x:7,y:2,hp:14,maxHp:14,atk:6,def:2,move:2,range:1},
      {id:'goblin',team:'enemy',name:'ゴブリン',sprite:'goblin',x:8,y:4,hp:20,maxHp:20,atk:7,def:3,move:2,range:1}
    ];
    this.phase='player'; this.turn=1; this.moved=false; this.result=null;
  }
  get hero(){ return this.units[0]; }
  get alive(){ return this.units.filter(u=>u.hp>0); }
  valid(x,y){ return y>=0 && y<this.map.length && x>=0 && x<this.map[0].length && this.map[y][x]!== '#'; }
  reachable(unit, limit=unit.move){
    const cells=[{x:unit.x,y:unit.y,cost:0}], seen=new Set([`${unit.x},${unit.y}`]);
    for(let i=0;i<cells.length;i++) {
      const p=cells[i]; if(p.cost>=limit) continue;
      for(const [dx,dy] of dirs){
        const x=p.x+dx,y=p.y+dy,k=`${x},${y}`;
        if(seen.has(k)||!this.valid(x,y)||this.alive.some(u=>u!==unit&&u.x===x&&u.y===y)) continue;
        seen.add(k);cells.push({x,y,cost:p.cost+1});
      }
    }
    return cells;
  }
  move(x,y){
    if(this.phase!=='player'||this.result||this.moved||!this.reachable(this.hero).some(p=>p.x===x&&p.y===y)) return false;
    this.hero.x=x;this.hero.y=y;this.moved=true;return true;
  }
  canAttack(a,b){return a.hp>0&&b.hp>0&&a.team!==b.team&&distance(a,b)<=a.range;}
  strike(a,b){ const damage=Math.max(1,a.atk-b.def);b.hp=Math.max(0,b.hp-damage);this.check();return damage; }
  attack(id){
    const enemy=this.units.find(u=>u.id===id);
    if(this.phase!=='player'||this.result||!enemy||!this.canAttack(this.hero,enemy)) return null;
    const damage=this.strike(this.hero,enemy);if(!this.result)this.phase='enemy';return damage;
  }
  wait(){if(this.phase!=='player'||this.result)return false;this.phase='enemy';return true;}
  enemyAct(id){
    const u=this.units.find(v=>v.id===id);if(this.phase!=='enemy'||this.result||!u||u.team!=='enemy'||u.hp<=0)return null;
    // BFS from hero provides obstacle-aware pursuit; occupied cells stay impassable.
    const paths=this.reachable(this.hero,100);
    const options=this.reachable(u).map(p=>({...p,score:Math.min(...paths.filter(q=>distance(p,q)<=1).map(q=>q.cost+distance(p,q)))}));
    options.sort((a,b)=>a.score-b.score||a.cost-b.cost);
    if(!this.canAttack(u,this.hero)&&Number.isFinite(options[0].score)){u.x=options[0].x;u.y=options[0].y;}
    const damage=this.canAttack(u,this.hero)?this.strike(u,this.hero):0;
    return {unit:u,damage};
  }
  nextTurn(){if(this.phase!=='enemy'||this.result)return false;this.phase='player';this.turn++;this.moved=false;return true;}
  check(){if(this.hero.hp<=0)this.result='defeat';else if(!this.alive.some(u=>u.team==='enemy'))this.result='victory';if(this.result)this.phase='finished';}
}
const api={Battle,distance};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DQTactics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
