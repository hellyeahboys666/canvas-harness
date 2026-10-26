'use strict';
// How much shows: Simple (new students), Advanced and Developer, and the switches that keep one item on or off.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {fixture}=require('./dashboard-heading-fixture.cjs');
const storage=require('../extension/storage.js'),M=require('../extension/customization-model.js');
const source=file=>fs.readFileSync(path.join(__dirname,'../extension',file),'utf8');
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const ids=M.VIEW_ITEMS.map(entry=>entry.id),at=level=>M.VIEW_ITEMS.filter(entry=>entry.levels.includes(level)).map(entry=>entry.id);
function make(data={}){return storage.createStore({accountId:'42',origin:'https://school.instructure.com',adapter:{read:async k=>structuredClone(data[k]),write:async(k,v)=>{data[k]=structuredClone(v);}}});}

test('each level adds to the one before it; Developer shows every item but Simple’s card',()=>{
 assert.deepEqual(M.VIEW_LEVELS.map(([id])=>id),['simple','advanced','developer']);
 assert.deepEqual(at('simple'),['nextUp']);
 const advanced=at('advanced'),developer=at('developer');
 for(const id of advanced)assert.ok(developer.includes(id),id);
 assert.deepEqual(ids.filter(id=>!at('simple').includes(id)&&!advanced.includes(id)),['cacheNotes','diagnostics','ids']);
 assert.deepEqual(M.viewHidden({viewLevel:'developer'}),['nextUp']);
 assert.deepEqual(M.viewHidden({viewLevel:'advanced'}),['nextUp','cacheNotes','diagnostics','ids']);
 assert.deepEqual(M.viewHidden({viewLevel:'simple'}),ids.filter(id=>id!=='nextUp'));
 // Simple keeps the essentials: due work, its counts and the reader; course news and filters wait for Advanced.
 for(const id of ['courseInformation','bookmarks','weekStrip','moreViews','excerpts','deadlinePreview','googleDoc'])assert.ok(advanced.includes(id)&&!at('simple').includes(id),id);
});

test('new students start on Simple; records saved before levels open on Advanced; the level persists',async()=>{
 const fresh=make();assert.equal((await fresh.load()).settings.viewLevel,'simple');
 await fresh.update(d=>{d.settings.accent='forest';});assert.equal((await fresh.load()).settings.viewLevel,'simple');
 const data={};const before=make(data);await before.load();await before.update(d=>{d.settings.accent='forest';});
 const key=Object.keys(data).find(name=>name.startsWith('reserve:v1:'));delete data[key].settings.viewLevel;delete data[key].settings.viewItems;
 assert.equal((await make(data).load()).settings.viewLevel,'advanced');
 const store=make();await store.load();
 await store.update(d=>{M.setViewLevel(d.settings,'developer');M.setViewItem(d.settings,'diagnostics',false);});
 const saved=await store.load();assert.equal(saved.settings.viewLevel,'developer');assert.deepEqual(saved.settings.viewItems,{diagnostics:false});
 assert.deepEqual(storage.validateBackup(store.exportBackup(),store.owner).settings.viewItems,{diagnostics:false});
});

test('damaged levels and switches reject a backup',async()=>{
 const store=make();await store.load();
 for(const [key,value] of [['viewLevel','expert'],['viewItems',{weekStrip:'yes'}],['viewItems',{unknownThing:true}],['viewItems',['weekStrip']]]){
  const backup=store.exportBackup();backup.data.settings[key]=value;
  assert.throws(()=>storage.validateBackup(backup,store.owner),/Invalid view/,key);
 }
 assert.throws(()=>M.setViewLevel({},'everything'),/Simple, Advanced or Developer/);
});

test('a switch keeps one item on or off whatever the level; picking a level starts fresh',()=>{
 const s={viewLevel:'simple',showBookmarks:true};
 M.setViewItem(s,'weekStrip',true);assert.equal(M.viewShows(s,'weekStrip'),true);assert.deepEqual(s.viewItems,{weekStrip:true});
 M.setViewItem(s,'nextUp',false);assert.equal(M.viewShows(s,'nextUp'),false);
 // An item with an older switch: off is that switch, so Restore course information and Biscuit still bring it back.
 M.setViewItem(s,'bookmarks',true);assert.equal(M.viewShows(s,'bookmarks'),true);
 M.setViewItem(s,'bookmarks',false);assert.equal(s.showBookmarks,false);assert.equal(s.viewItems.bookmarks,undefined);
 M.setViewLevel(s,'advanced');assert.deepEqual(s.viewItems,{});assert.equal(s.showBookmarks,true);assert.equal(M.viewShows(s,'bookmarks'),true);
 // Turning off what the level already hides, or on what it shows, leaves no choice behind.
 M.setViewItem(s,'weekStrip',true);assert.deepEqual(s.viewItems,{});
 // Hidden before levels existed stays hidden at every level.
 assert.equal(M.viewShows({viewLevel:'developer',showCourseInformation:false},'courseInformation'),false);
});

test('every item hidden by the page itself has a rule in customize.css',()=>{
 const css=source('customize.css'),rendered=new Set(['nextUp','diagnostics','ids','courseInformation','deadlinePreview']);
 for(const entry of M.VIEW_ITEMS)if(!rendered.has(entry.id))assert.match(css,new RegExp(`\\[data-hide~=${entry.id}\\]`),entry.id);
});

// The real dashboard, one level at a time, with made-up work (the fixture's clock is Oct 17, 10:00 UTC).
const assignments=[{id:'1',course_id:'10',name:'Synthetic lab write-up',description:'<p>Synthetic instructions.</p>',points_possible:10,due_at:'2026-10-17T20:00:00Z',submission_types:['online_upload'],submission:{workflow_state:'unsubmitted'}},{id:'2',course_id:'20',name:'Synthetic map reading',description:'',points_possible:5,due_at:'2026-10-19T15:00:00Z',submission_types:['online_upload'],submission:{workflow_state:'unsubmitted'}}];
function dashboard(level,own){
 return fixture({assignments,setup:({env,store})=>{
  vm.runInContext(source('workspace-arrange.js'),env);vm.runInContext(source('customization-model.js'),env);
  Object.assign(store.get().settings,{viewLevel:level,...(own?{viewItems:own}:{})});
 }});
}
const has=(f,selector)=>!!f.container.querySelector(selector);

test('Simple leads with the next assignment and leaves out course news, bookmarks and diagnostics',async t=>{
 const f=dashboard('simple');t.after(()=>f.dashboard.destroy());await flush();
 assert.equal(f.container.dataset.viewLevel,'simple');
 assert.match(f.container.querySelector('.rd-next-up h2').textContent,/Synthetic lab write-up/);
 const hide=f.container.dataset.hide.split(' ');for(const id of ['weekStrip','moreViews','excerpts','courseInformation','diagnostics'])assert.ok(hide.includes(id),id);
 const card=f.container.querySelector('.rd-next-up');assert.ok(card);
 assert.ok(card.querySelector('.rd-button--primary'),'Open in Canvas is the primary action');
 assert.ok(card.querySelector('[data-rd-action="preview"]'));
 assert.equal(f.container.dataset.showCourseInformation,'false');assert.equal(f.container.dataset.showDeadlinePreview,'false');
 for(const selector of ['.rd-course-information','.rd-bookmarks','.rd-diagnostics','.rd-dev-id','[data-rd-action="arrange-restore"]'])assert.ok(!has(f,selector),selector);
 assert.ok(has(f,'.rd-work'));assert.ok(has(f,'.rd-reader'));
});

test('Advanced is the full page without Simple’s card or Developer’s diagnostics',async t=>{
 const f=dashboard('advanced');t.after(()=>f.dashboard.destroy());await flush();
 assert.deepEqual(f.container.dataset.hide.split(' '),['nextUp','cacheNotes','diagnostics','ids']);
 for(const selector of ['.rd-course-information','.rd-bookmarks','.rd-week','.rd-work','.rd-reader'])assert.ok(has(f,selector),selector);
 for(const selector of ['.rd-next-up','.rd-diagnostics','.rd-dev-id'])assert.ok(!has(f,selector),selector);
});

test('Developer adds diagnostics with the sync time and Canvas ids, with no coursework text',async t=>{
 const f=dashboard('developer');t.after(()=>f.dashboard.destroy());await flush();
 assert.deepEqual(f.container.dataset.hide.split(' '),['nextUp']);
 const diagnostics=f.container.querySelector('.rd-diagnostics');assert.ok(diagnostics);
 const text=diagnostics.textContent;assert.match(text,/Level\s*developer/);assert.match(text,/Courses\s*2 shown of 2/);
 for(const assignment of f.snapshot.assignments)assert.ok(!text.includes(assignment.name),'no assignment names');
 assert.match(text,/Canvas\s*\S/);assert.ok(has(f,'.rd-dev-id'));assert.ok(has(f,'.rd-course-information'));
});

test('a switch on Simple brings one item back, and choosing a level saves and redraws',async t=>{
 const f=dashboard('simple',{courseInformation:true,nextUp:false});t.after(()=>f.dashboard.destroy());await flush();
 assert.ok(has(f,'.rd-course-information'));assert.ok(!has(f,'.rd-next-up'));
 const radio=f.document.createElement('input');radio.dataset.rdField='view-level';radio.value='developer';
 f.container.events.get('change')({target:radio});await flush();
 assert.equal(f.store.get().settings.viewLevel,'developer');assert.equal(JSON.stringify(f.store.get().settings.viewItems),'{}');
 assert.ok(has(f,'.rd-diagnostics'));
 const item=f.document.createElement('input');item.dataset.rdField='view-item';item.dataset.item='diagnostics';item.checked=false;
 f.container.events.get('change')({target:item});await flush();
 assert.ok(!has(f,'.rd-diagnostics'));assert.equal(JSON.stringify(f.store.get().settings.viewItems),'{"diagnostics":false}');
});

// Make it yours: the level on every tab, and each item's switch under Home → What shows.
function editor(settings){
 const env=vm.createContext({console,TextEncoder});
 env.ReservePonyAsk={cleanRoutines:routines=>routines||[],cleanReminders:reminders=>reminders||[]};
 for(const file of ['workspace-arrange.js','customization-model.js','custom-art.js','course-art.js','pet-art.js','pets.js','quick-upload-ui.js','make-your-own.js','settings-dock.js','customize-ui.js'])vm.runInContext(source(file),env,{filename:file});
 const allCourses=[{id:'10',name:'Biology',color:'#123456'}];
 const c={s:{...env.ReserveCustomization.defaults,theme:'light',accent:'clay',makeYourOwn:{theme:null,pet:null,installed:{}},coursePrefs:{},...settings},allCourses,courses:allCourses,customizeOpen:true,personal:{pet:{}},makeOwn:{busy:false,status:'',draft:null,week:'',presetKinds:{}},customKits:[]};
 return tab=>{c.customizeTab=tab;return env.ReserveCustomizeUI.render(c);};
}

test('Make it yours puts the level above the tabs and a switch for every item under Home',()=>{
 const render=editor({viewLevel:'simple'});
 for(const tab of ['look','layout','courses','settings']){
  const html=render(tab);
  assert.match(html,/<h3 id="cz-level-title">How much shows<\/h3>/,tab);
  assert.match(html,/value="simple" checked/,tab);assert.ok(html.indexOf('cz-level')<html.indexOf('cz-tabs'),tab);
 }
 const home=render('layout');
 for(const id of ids)assert.match(home,new RegExp(`data-item="${id}"`),id);
 assert.match(home,/data-item="nextUp" checked/);assert.doesNotMatch(home,/data-item="weekStrip" checked/);
 assert.match(home,/<h3>What shows<\/h3><h4 class="cz-subhead">In Simple<\/h4>[\s\S]*>Advanced adds<\/h4>[\s\S]*>Developer adds<\/h4>[\s\S]*>Always shown<\/h4>/);
 const own=editor({viewLevel:'simple',viewItems:{weekStrip:true}})('layout');
 assert.match(own,/data-item="weekStrip" checked/);assert.match(own,/1 change of your own/);
});

test('without Make it yours (Lite) the level is a select in the command bar',async t=>{
 const f=fixture({setup:({env,store})=>{
  vm.runInContext(source('features.js'),env);env.ReserveFeatures.apply('lite');delete env.ReserveCustomizeUI;
  vm.runInContext(source('workspace-arrange.js'),env);vm.runInContext(source('customization-model.js'),env);
  store.get().settings.viewLevel='advanced';
 }});t.after(()=>f.dashboard.destroy());await flush();
 const select=f.container.querySelector('.rd-toolbar select[data-rd-field="view-level"]');assert.ok(select);
 assert.deepEqual(Array.from(select.querySelectorAll('option'),option=>option.getAttribute('value')),['simple','advanced','developer']);
 assert.equal(select.querySelector('option[selected]').getAttribute('value'),'advanced');
});
