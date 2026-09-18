const {test} = require('node:test');
const assert = require('node:assert/strict');
const G = require('./engine.js');
test('initial state and malformed save validation',()=>{
  assert.ok(G.valid(G.fresh())); assert.ok(!G.valid({}));
  const s=G.fresh();s.water=99;assert.ok(!G.valid(s));
});
test('plant, water, grow, harvest and sell',()=>{
  const s=G.fresh();G.act(s,'plot',{index:0,crop:'carrot'});
  assert.equal(s.seeds.carrot,2);G.tick(s,100);assert.equal(s.plots[0].remaining,6);
  G.act(s,'plot',{index:0});assert.equal(s.water,5);G.tick(s,6);
  G.act(s,'plot',{index:0});assert.equal(s.coins,39);assert.equal(s.harvest.carrot,1);assert.equal(s.plots[0],null);
});
test('locked crops and insufficient money cannot be purchased',()=>{
  const s=G.fresh();G.act(s,'buy','corn');assert.equal(s.coins,30);
  s.coins=0;G.act(s,'buy','carrot');assert.equal(s.seeds.carrot,3);
  G.act(s,'next');assert.equal(s.level,1);
});
test('empty water blocks growth; refill is free',()=>{
  const s=G.fresh();s.water=0;G.act(s,'plot',{index:0,crop:'carrot'});G.act(s,'plot',{index:0});
  assert.equal(s.plots[0].watered,false);G.act(s,'refill');assert.equal(s.water,6);assert.equal(s.coins,30);
});
test('all three levels are achievable from starting resources',()=>{
  const s=G.fresh();
  for(let level=1;level<=3;level++){
    for(const [crop,n] of Object.entries(G.goals[level-1])){
      while(s.harvest[crop]<n){
        if(!s.seeds[crop]) G.act(s,'buy',crop);
        assert.ok(s.seeds[crop]>0,'economy remains solvent');
        G.act(s,'plot',{index:0,crop});if(!s.water)G.act(s,'refill');
        G.act(s,'plot',{index:0});G.tick(s,20);G.act(s,'plot',{index:0});
      }
    }
    assert.ok(G.ready(s));G.act(s,'next');assert.ok(G.valid(s));
  }
  assert.equal(s.won,true);
});
test('save round trip preserves crops and remaining growth time',()=>{
  const s=G.fresh();G.act(s,'plot',{index:1,crop:'carrot'});G.act(s,'plot',{index:1});G.tick(s,2);
  const restored=JSON.parse(JSON.stringify(s));assert.ok(G.valid(restored));assert.equal(restored.plots[1].remaining,4);
});
test('invalid time and plot indices do not mutate state',()=>{
  const s=G.fresh();const before=JSON.stringify(s);G.tick(s,-10);G.act(s,'plot',{index:99,crop:'carrot'});assert.equal(JSON.stringify(s),before);
});
