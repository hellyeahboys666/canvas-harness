'use strict';
// The companion as another animal: every animal is drawn on the pony's rig, the choice is saved and cleaned like the
// other companion settings, and the controller poses each one with its own numbers.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../extension/pet-art.js'),P=require('../extension/pets.js'),{fixture}=require('./pets-fixture.cjs');
const css=fs.readFileSync(path.join(__dirname,'../extension/pet.css'),'utf8');
const ANIMALS=Object.keys(A.ANIMALS);
const count=(svg,cls)=>(svg.match(new RegExp(`class="${cls}"`,'g'))||[]).length;

test('the pony is still the first animal and the default companion',()=>{
 assert.equal(ANIMALS[0],'pony');assert.deepEqual(ANIMALS,['pony','cat','bunny','fox','panda','hamster']);
 assert.equal(P.DEFAULTS.animal,'pony');assert.equal(P.clean(null).animal,'pony');assert.equal(P.clean({}).animal,'pony');
 assert.match(A.svg(),/data-animal="pony"/);assert.match(A.svg(),/aria-label="Your pony"/);
});

test('every animal has every part the controller and the stylesheet move or show',()=>{
 for(const animal of ANIMALS){
  const svg=A.svg({animal,title:'Biscuit'});
  assert.match(svg,new RegExp(`data-animal="${animal}"`));assert.match(svg,/viewBox="0 0 72 64"/);assert.match(svg,/aria-label="Biscuit"/);
  for(const cls of ['pet-shadow','pet-all','pet-up','pet-tuck','pet-tuck2','pet-tail','pet-body','pet-neck','pet-head','pet-eye','pet-lid','pet-flag','pet-book','pet-oats','pet-zz','pet-sparks','z1','z2','s1','s2','s3'])
   assert.equal(count(svg,cls),1,`${animal}: one .${cls}`);
  assert.equal(count(svg,'pet-legs'),2,`${animal}: legs behind and in front of the body`);
  for(const leg of ['lf','lh','lf2','lh2'])assert.equal(count(svg,`pet-leg ${leg}`),1,`${animal}: leg ${leg}`);
  assert.ok(count(svg,'pet-collar')>=2,`${animal}: a collar for the tack setting`);assert.ok(count(svg,'pet-blanket')>=1,`${animal}: a blanket for the tack setting`);
  // the parts that turn have their own pivots, and nothing reaches outside the drawing
  for(const cls of ['pet-tail','pet-neck','pet-head'])assert.match(svg,new RegExp(`class="${cls}" style="transform-origin:[\\d.]+px [\\d.]+px"`),`${animal}: ${cls} pivot`);
  assert.ok(!/<script|href=|url\(|<image|<foreignObject/i.test(svg),`${animal}: no script or outside reference`);
  // the same ink and paint variables as the pony, so coats, harness colors and dark pages dress every animal
  for(const paint of ['var(--pet-coat)','var(--pet-harness)','var(--pet-ink,#141413)'])assert.ok(svg.includes(paint),`${animal}: ${paint}`);
 }
});

test('the title is escaped and an unknown animal draws the pony',()=>{
 for(const animal of ANIMALS)assert.ok(!/<b>/.test(A.svg({animal,title:'A <b>"cat"</b>'})));
 for(const animal of ['dragon','__proto__','constructor','toString',undefined,null,7,['cat']])assert.match(A.svg({animal}),/data-animal="pony"/);
});

test('the animal is saved like the other companion choices and cleaned to a known one',()=>{
 for(const animal of ANIMALS)assert.equal(P.clean({animal}).animal,animal);
 for(const animal of ['dragon','Cat',' cat','__proto__','constructor','hasOwnProperty',7,null,{},['cat']])assert.equal(P.clean({animal}).animal,'pony',String(animal));
 const fox=P.clean({animal:'fox',coat:'ink',xp:200,treats:3});
 assert.deepEqual(P.clean(fox),fox,'cleaning is stable');assert.equal(fox.coat,'ink');assert.equal(fox.xp,200,'changing animal keeps level and treats');
});

test('coats paint every animal; a fox in Oat is red and a panda in Oat is black and white',()=>{
 for(const animal of ANIMALS)for(const coat of Object.keys(A.COATS)){
  const p=A.paint(animal,coat);for(const key of ['label','coat','shade','mane','muzzle'])assert.equal(typeof p[key],'string',`${animal} ${coat} ${key}`);
  for(const key of ['coat','shade','mane','muzzle'])assert.match(p[key],/^#[0-9A-F]{6}$/i);
 }
 assert.deepEqual(A.paint('pony','chestnut'),A.COATS.chestnut);assert.deepEqual(A.paint('cat','oat'),A.COATS.oat);
 assert.equal(A.paint('fox','oat').label,'Red');assert.equal(A.paint('panda','oat').mane,'#2B2826');
 assert.deepEqual(A.paint('dragon','nope'),A.COATS.oat);for(const coat of ['__proto__','constructor',['ink'],null])assert.deepEqual(A.paint('cat',coat),A.COATS.oat,String(coat));assert.deepEqual(A.paint('fox','__proto__'),A.paint('fox','oat'));
});

test('the stylesheet lowers and poses each animal the way the controller does',()=>{
 assert.match(css,/\.pet-up\{transform:translateY\(calc\(\(var\(--pet-down\) \* var\(--pet-sink,1\) \+ var\(--pet-bob\)\) \* 1px\)\)\}/);
 for(const animal of ANIMALS){
  const {sink,poses={}}=A.ANIMALS[animal],svg=A.svg({animal});
  assert.ok(sink>0&&sink<=1,`${animal}: sink`);
  if(sink===1)assert.doesNotMatch(svg,/--pet-sink/);else assert.match(svg,new RegExp(`style="--pet-sink:${sink}"`));
  const rules=[...css.matchAll(new RegExp(`\\.pet\\[data-pose=(\\w+)\\] \\.pet-svg\\[data-animal=${animal}\\]\\{([^}]*)\\}`,'g'))];
  assert.deepEqual(rules.map(r=>r[1]).sort(),Object.keys(poses).sort(),`${animal}: one rule per pose it holds its own way`);
  for(const [,pose,body] of rules){
   const vars=Object.fromEntries([...body.matchAll(/--pet-(\w+):([\d.-]+)/g)].map(m=>[m[1],+m[2]]));
   assert.deepEqual(vars,poses[pose],`${animal} ${pose}`);
  }
 }
});

const transform=(f,cls)=>f.node.children.find(n=>n.className===cls).style.transform;
const number=value=>parseFloat(String(value).replace(/^[a-zA-Z]+\(/,''));

test('the controller draws the chosen animal, and lowers it by its own amount to read',()=>{
 for(const animal of ANIMALS){
  const f=fixture({animal});
  try{
   assert.match(f.node.html,new RegExp(`data-animal="${animal}"`));
   assert.match(f.node.attrs['aria-label'],new RegExp(`your ${A.ANIMALS[animal].label.toLowerCase()}\\.`));
   assert.equal(f.node.style['--pet-coat'],A.paint(animal,'oat').coat);assert.equal(f.node.style['--pet-mane'],A.paint(animal,'oat').mane);
   f.controller.setFocus(true);f.advance(8000);
   assert.equal(f.node.dataset.pose,'read');
   assert.ok(Math.abs(number(transform(f,'pet-up'))-11.5*A.ANIMALS[animal].sink)<.05,`${animal} lies ${transform(f,'pet-up')}`);
   assert.equal(f.node.dataset.lying,'true','lying is the same state for every animal');
  }finally{f.controller.destroy();}
 }
});

test('an animal that eats its own way crouches instead of lowering a long neck',()=>{
 for(const animal of ['pony','cat']){
  const f=fixture({animal});
  try{
   f.advance(1500);assert.equal(f.controller.treat(),true);f.advance(2000);
   assert.equal(f.node.dataset.pose,'eat');
   const want={...{down:0,neck:60,head:22},...A.ANIMALS[animal].poses?.eat};
   assert.ok(Math.abs(number(transform(f,'pet-up'))-want.down*A.ANIMALS[animal].sink)<.3,`${animal} eats at ${transform(f,'pet-up')}`);
   assert.ok(Math.abs(number(transform(f,'pet-neck'))-want.neck)<=3,`${animal} neck ${transform(f,'pet-neck')}`);
   assert.ok(Math.abs(number(transform(f,'pet-head'))-want.head)<.5,`${animal} head ${transform(f,'pet-head')}`);
  }finally{f.controller.destroy();}
 }
});

test('choosing another animal redraws the companion in place; the same choice does not',()=>{
 const f=fixture();
 try{
  const node=f.node;assert.match(node.html,/data-animal="pony"/);
  f.setPet({enabled:true,roam:'page',animal:'panda',coat:'oat'});f.controller.sync();
  assert.equal(f.node,node,'the same companion on the page, not a new one');assert.match(node.html,/data-animal="panda"/);
  assert.equal(f.controller.pet.animal,'panda');assert.equal(node.style['--pet-mane'],'#2B2826');
  const drawn=node.html,parts=node.children;f.controller.sync();assert.equal(node.html,drawn);assert.equal(node.children,parts,'an unchanged choice keeps the drawing');
  f.setPet({enabled:true,roam:'page',animal:'dragon'});f.controller.sync();assert.match(node.html,/data-animal="pony"/);
 }finally{f.controller.destroy();}
});

test('the animal is a device appearance choice, like the companion switch, so the popup can draw it',()=>{
 const Prefs=require('../extension/page-preferences.js');
 assert.deepEqual(Prefs.ANIMALS,ANIMALS,'the device record knows the same animals as the drawing');
 assert.equal(Prefs.fromData({settings:{},pet:{animal:'fox'}}).petAnimal,'fox');
 for(const animal of [undefined,'dragon','__proto__',['cat']])assert.equal(Prefs.fromData({settings:{},pet:{animal}}).petAnimal,'pony');
 const data={settings:{theme:'dark'},pet:{name:'Biscuit',animal:'fox',enabled:true}};
 assert.equal(Prefs.apply(structuredClone(data),{...Prefs.fromData(data),petAnimal:'panda'}).pet.animal,'panda');
 assert.equal(Object.hasOwn(Prefs.personal(data).pet,'animal'),false,'it is kept on the device, not written into the account record');
 assert.deepEqual(Prefs.patch({petAnimal:'cat'}),{petAnimal:'cat'});assert.throws(()=>Prefs.patch({petAnimal:'dragon'}),/petAnimal/);
});

test('a settings pack can choose the animal along with coat and harness',async()=>{
 const Preset=require('../extension/preset-pack.js'),pack=data=>({format:'chpreset',version:1,name:'Preset',kind:'settings',data});
 const {pack:ok}=await Preset.validate(pack({pet:{animal:'cat',coat:'ink'}})),out=Preset.apply({settings:{},pet:{name:'Biscuit',xp:40}},ok);
 assert.equal(out.pet.animal,'cat');assert.equal(out.pet.coat,'ink');assert.equal(out.pet.xp,40);
 assert.match((await Preset.problems(pack({pet:{animal:'dragon'}}))).join('\n'),/pet\.animal/);
});

test('on a coat too dark for ink, the face is drawn in a light color so the eyes still show',()=>{
 assert.match(A.COATS.ink.face,/^#[0-9A-F]{6}$/i);for(const coat of Object.keys(A.COATS))if(coat!=='ink')assert.equal(A.COATS[coat].face,undefined,coat);
 for(const animal of ANIMALS){const svg=A.svg({animal});assert.match(svg,/class="pet-smile"[^>]*stroke="var\(--pet-face,var\(--pet-ink,#141413\)\)"/,animal);}
 assert.match(A.svg(),/<g class="pet-eye"><circle[^>]*fill="var\(--pet-face,/);
 const f=fixture({animal:'cat'});try{assert.equal(f.node.style['--pet-face'],'');f.setPet({enabled:true,roam:'page',animal:'cat',coat:'ink'});f.controller.sync();assert.equal(f.node.style['--pet-face'],A.COATS.ink.face);}finally{f.controller.destroy();}
});

test('each animal has its own habit, and every habit rests between moves and stops in sleep',()=>{
 const habits={cat:['pet-ear','pet-whisk'],bunny:['pet-ear','pet-ear2','pet-nose','pet-whisk'],fox:['pet-ear','pet-swish'],panda:['pet-sway'],hamster:['pet-whisk','pet-cheek']};
 for(const [animal,parts] of Object.entries(habits))for(const cls of parts)assert.match(A.svg({animal}),new RegExp(`class="${cls}" style="transform-origin:[\\d.]+px [\\d.]+px"`),`${animal} ${cls}`);
 for(const name of ['pet-twitch','pet-sniff','pet-whisk','pet-swish','pet-sway']){
  const frames=css.match(new RegExp(`@keyframes ${name}\\{(.*?)\\}\\}`))?.[1];assert.ok(frames,name);
  assert.match(frames,/^0%,\d+%(?:,100%)?\{/,`${name} holds still for most of its loop, so the film clock skips it`);
 }
 assert.match(css,/\.pet\[data-pose=stand\] \.pet-svg\[data-animal=panda\] \.pet-sway\{animation:pet-sway/,'only the panda wobbles, and only standing');
 const asleep=css.match(/([^}]*)\{animation:none\}/g).find(rule=>rule.includes('[data-pose=sleep] .pet-ear'));
 for(const cls of ['pet-ear','pet-ear2','pet-nose','pet-whisk','pet-swish'])assert.ok(asleep?.includes(`.pet[data-pose=sleep] .${cls}`),`${cls} stops in sleep`);
 assert.match(css,/\.pet\[data-pose=eat\] \.pet-cheek\{animation:pet-munch/);
});

test('stroking it shows hearts for a moment; a touch, a drag or a single pass does not',()=>{
 for(const animal of ANIMALS)assert.equal(count(A.svg({animal}),'pet-hearts'),1,animal);
 const f=fixture({animal:'bunny'});
 try{
  f.advance(2000);const node=f.node,pass=(xs,extra={})=>{for(const x of xs){f.advance(40);node.emit('pointermove',{clientX:x,clientY:300,pointerType:'mouse',buttons:0,...extra});}};
  pass([100,140,180,220]);assert.notEqual(node.dataset.petted,'true','one pass across is not a stroke');
  f.advance(1000);pass([100,160,220,160,100],{pointerType:'touch'});assert.notEqual(node.dataset.petted,'true','touch moves the page, not the pet');
  f.advance(1000);pass([100,160,220,160,100],{buttons:1});assert.notEqual(node.dataset.petted,'true','a held button is a drag');
  f.advance(1000);pass([100,160,220,160,100]);assert.equal(node.dataset.petted,'true');
  f.advance(1700);assert.equal(node.dataset.petted,'false','the hearts are gone after a moment');
  assert.equal(f.controller.pet.xp,0,'petting changes nothing that is saved');
 }finally{f.controller.destroy();}
});

test('resting, it tips its head toward a pointer nearby and back again once it is gone',()=>{
 const f=fixture({animal:'cat'});
 try{
  f.advance(9000);const node=f.node,s=58,head=()=>number(transform(f,'pet-head')),dir=node.dataset.face==='left'?-1:1;
  assert.ok(['stand','flag','lie'].includes(node.dataset.pose),node.dataset.pose);
  const before=head();
  f.doc.emit('pointermove',{clientX:node._x+dir*s*2,clientY:node._y-s*2.5,pointerType:'mouse'});f.advance(800);
  assert.ok(head()<before-3,`looks up toward a pointer above: ${before} → ${head()}`);
  f.advance(4000);assert.ok(Math.abs(head()-before)<.5,`and back once the pointer has gone quiet: ${head()}`);
  f.doc.emit('pointermove',{clientX:node._x-dir*s*3,clientY:node._y-s*2.5,pointerType:'mouse'});f.advance(800);
  assert.ok(Math.abs(head()-before)<.5,'a pointer behind it is not followed');
  f.doc.emit('keydown',{key:'a'});f.advance(800);assert.ok(Math.abs(head()-before)<.5,'a key press has no position to look at');
 }finally{f.controller.destroy();}
});
