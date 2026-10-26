/* Canvas Harness — workspace preferences. Original creator: Flzsh. */
(function(root){
 'use strict';
 const arrange=root.ReserveWorkspaceArrange||(typeof module==='object'&&module.exports?require('./workspace-arrange.js'):null);
 const enums={sceneTheme:['','starry','sea','stars','blueprint'],dockSize:['small','medium','large'],pageTint:['paper','accent','sky','sage','lilac','blush','sand','snow'],courseNavigation:['sidebar','topbar','dock'],deskOrder:['context-first','work-first','stacked'],surfaceStyle:['paper','clean','contrast'],courseCardStyle:['sketch','rounded','minimal'],bannerSize:['compact','standard','large'],panelFrame:['pen','stitch','card','line','none']};
 const defaults={sceneTheme:'',dockSize:'medium',nightArt:0,pageTint:'paper',courseNavigation:'sidebar',deskOrder:'context-first',surfaceStyle:'paper',courseCardStyle:'sketch',bannerSize:'standard',showCourseIcons:true,showDeadlinePreview:true,showBookmarks:true,showCourseInformation:true,showCourseStrip:true,showRecentGrades:false,density:'comfortable',panelFrame:'pen',moduleSize:{},workspaceOrder:['context','work','reader'],workspaceMode:'side-by-side',workspaceLayout:null,workspaceUndo:null};
 const artKeys=['bannerArt','cardArt','backgroundArt','borderArt','iconArt','titleArt'];
 // How much shows: Simple (the default for new students), Advanced or Developer. Each item names the levels that
 // show it; a switch in Make it yours → Home → What shows keeps one item on or off whatever the level (viewItems).
 // Items with an older switch (key) also need that switch on, so an item hidden before levels existed stays hidden.
 // Records saved before levels existed open on Advanced: the page they already knew, without the diagnostics.
 const VIEW_LEVELS=[['simple','Simple','What is due and what to do next.'],['advanced','Advanced','Course news, filters, previews and shortcuts.'],['developer','Developer','Everything, with diagnostics for bug reports.']];
 const levelIds=VIEW_LEVELS.map(([id])=>id),ALL=levelIds,MORE=['advanced','developer'],DEV=['developer'];
 const item=(id,name,hint,levels,key)=>({id,name,hint,levels,...(key?{key}:{})});
 const VIEW_ITEMS=[
  item('nextUp','Next up card','The one assignment to do next, with its Open button.',['simple']),
  item('deadlinePreview','Next deadlines on courses','What is due next, under each course name.',MORE,'showDeadlinePreview'),
  item('bookmarks','Bookmarks','The shelf under the heading and the Bookmark buttons.',MORE,'showBookmarks'),
  item('courseInformation','Course information','Announcements, messages and the teacher’s page.',MORE,'showCourseInformation'),
  item('weekStrip','Week strip','The seven days with their counts, above the list.',MORE),
  item('moreViews','More views','Missing, Completed, Overdue and the other lists.',MORE),
  item('excerpts','Instruction previews','The first lines of each assignment, in the list.',MORE),
  item('readyNote','Completion reminders','Work done in your plan that Canvas has not seen yet.',MORE),
  item('selectTools','Select for AI and archive','The Select buttons on assignments.',MORE),
  item('planTab','My plan tab','Steps, estimate and notes beside the instructions.',MORE),
  item('googleDoc','Start a Google Doc','The button beside an assignment’s instructions.',MORE),
  item('deadlineChanges','Deadline changes button','Dates your teachers moved, in the top bar.',MORE),
  item('editHome','Edit Home','Add a timer, clock, notes or your companion to Home.',MORE),
  item('shortcuts','Keyboard hints','/ and Ctrl K beside search and Tools.',MORE),
  item('explanations','Explanations','Notes under headings that say what a part is for.',MORE),
  item('cacheNotes','Saved-copy notes','How many materials were read, and when, under Materials.',DEV),
  item('diagnostics','Diagnostics','Version, features, counts and render time at the foot of the page.',DEV),
  item('ids','Canvas IDs','Course and assignment numbers, for bug reports.',DEV)
 ];
 const viewItem=new Map(VIEW_ITEMS.map(entry=>[entry.id,entry]));
 const viewLevel=s=>levelIds.includes(s?.viewLevel)?s.viewLevel:'simple';
 const levelShows=(s,id)=>!!viewItem.get(id)?.levels.includes(viewLevel(s));
 // On or off for this student: an older switch that is off wins, then their own choice, then the level.
 function viewShows(s,id){
  const entry=viewItem.get(id);if(!entry)return true;
  if(entry.key&&s?.[entry.key]===false)return false;
  const own=s?.viewItems?.[id];return typeof own==='boolean'?own:levelShows(s,id);
 }
 const viewHidden=s=>VIEW_ITEMS.filter(entry=>!viewShows(s,entry.id)).map(entry=>entry.id);
 // Picking a level starts it fresh: own choices are cleared and older switches turned back on.
 function setViewLevel(s,level){if(!levelIds.includes(level))throw Error('Choose Simple, Advanced or Developer.');s.viewLevel=level;s.viewItems={};for(const entry of VIEW_ITEMS)if(entry.key)s[entry.key]=true;return s;}
 // One switch: afterwards the student sees what they chose. Off on an item with an older switch is that switch,
 // so Restore course information and Biscuit, which set the older switch, bring it back.
 function setViewItem(s,id,on){
  const entry=viewItem.get(id);if(!entry||typeof on!=='boolean')throw Error('Choose a valid item.');
  const items={...(s.viewItems||{})};delete items[id];
  if(entry.key){s[entry.key]=on;if(on&&!levelShows(s,id))items[id]=true;}else if(on!==levelShows(s,id))items[id]=on;
  s.viewItems=items;return s;
 }
 function cleanViewItems(value){
  if(value===undefined)return {};
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid viewItems setting in backup.');
  const out={};for(const [id,on] of Object.entries(value)){if(!viewItem.has(id)||typeof on!=='boolean')throw Error('Invalid viewItems setting in backup.');out[id]=on;}
  return out;
 }
 const presets={studio:{...defaults},study:{...defaults,deskOrder:'work-first',workspaceOrder:['work','reader','context'],surfaceStyle:'clean',courseCardStyle:'rounded',bannerSize:'compact'},focus:{...defaults,courseNavigation:'topbar',deskOrder:'work-first',workspaceOrder:['work','reader','context'],bannerSize:'compact',showCourseInformation:false,showDeadlinePreview:false}};
 function cleanAppearance(value={}){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid course appearance.');
  const out={bannerFit:'contain',bannerPosition:'right'};
  for(const [key,allowed] of Object.entries({bannerFit:['cover','contain'],bannerPosition:['left','center','right'],titlePlacement:['separate','banner']})){
   if(value[key]!==undefined&&!allowed.includes(value[key]))throw Error(`Invalid ${key} setting in backup.`);
   if(value[key])out[key]=value[key];
  }
  for(const key of artKeys)if(value[key]!=null){
   const art=root.ReserveCustomArt||(typeof module==='object'&&module.exports?require('./custom-art.js'):null);
   if(!art)throw Error('Artwork support is unavailable. Reload Canvas Harness and try again.');
   const media=root.ReserveMediaReference||(typeof module==='object'&&module.exports?require('./media-reference.js'):null),slot=key.replace('Art',''),clean=asset=>{
    if(asset&&typeof asset==='object'&&Object.hasOwn(asset,'mediaId')){if(!media?.cleanReference)throw Error('Local artwork support is unavailable. Reload Canvas Harness and try again.');return media.cleanReference(asset,slot);}return art.cleanAsset(asset);
   };
   if(value[key]&&typeof value[key]==='object'&&Object.hasOwn(value[key],'asset')){if(!['banner','card','background'].includes(slot)||!media?.cleanFrame)throw Error('Invalid framed artwork slot.');out[key]=media.cleanFrame(value[key],clean);}else out[key]=clean(value[key]);
  }
  return out;
 }
 function cleanSettings(settings){
  const out={...defaults};
  for(const [key,allowed] of Object.entries(enums)){
   if(settings[key]!==undefined&&!allowed.includes(settings[key]))throw Error(`Invalid ${key} setting in backup.`);
   if(settings[key]!==undefined)out[key]=settings[key];
  }
  for(const key of Object.keys(defaults).filter(key=>typeof defaults[key]==='boolean')){
   if(settings[key]!==undefined&&typeof settings[key]!=='boolean')throw Error(`Invalid ${key} setting in backup.`);
   if(settings[key]!==undefined)out[key]=settings[key];
  }
  if(settings.nightArt!==undefined){const n=Number(settings.nightArt);if(!Number.isFinite(n)||n<0||n>100)throw Error('Invalid nightArt setting in backup.');out.nightArt=Math.round(n);}
  if(!arrange)throw Error('Workspace arrangement is unavailable. Reload Canvas Harness and try again.');
  Object.assign(out,arrange.cleanSaved(settings));
  out.overviewArt=cleanAppearance(settings.overviewArt);out.themeArt=cleanAppearance(settings.themeArt);
  if(settings.viewLevel!==undefined&&!levelIds.includes(settings.viewLevel))throw Error('Invalid viewLevel setting in backup.');
  out.viewLevel=settings.viewLevel??'advanced';out.viewItems=cleanViewItems(settings.viewItems);
  return out;
 }
 function checkBudget(settings){
  const total=[settings.themeArt,settings.overviewArt,...Object.values(settings.coursePrefs||{})].reduce((sum,pref)=>sum+artKeys.reduce((n,key)=>n+new TextEncoder().encode((pref?.[key]?.asset||pref?.[key])?.svg||'').length,0),0);
  if(total>(root.ReserveCustomArt?.limits.totalBytes||2097152))throw Error('Course artwork is full. Remove an unused upload to stay below 2 MiB.');
 }
 const api={enums,defaults,artKeys,presets,VIEW_LEVELS,VIEW_ITEMS,viewLevel,levelShows,viewShows,viewHidden,setViewLevel,setViewItem,cleanAppearance,cleanSettings,checkBudget};root.ReserveCustomization=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
