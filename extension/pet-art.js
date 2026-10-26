/* Canvas Harness companion: the drawing. A small pony in a red harness, drawn as one rigged SVG whose pose is chosen
   by data-pose on its wrapper and moved by the stylesheet (pet.css). No Canvas data is read here. Creator: Flzsh. */
(function(root){
 'use strict';
 // Coats are plain paint: body, shade under the belly, mane and tail, muzzle.
 const COATS={
  oat:{label:'Oat',coat:'#F1DEC0',shade:'#DDC49C',mane:'#C96442',muzzle:'#F6C9B4'},
  chestnut:{label:'Chestnut',coat:'#C98B5E',shade:'#A86E46',mane:'#5A3A28',muzzle:'#E8B796'},
  dapple:{label:'Dapple grey',coat:'#D9DEE2',shade:'#B8C1C9',mane:'#6F7F8C',muzzle:'#EFD5CF'},
  ink:{label:'Ink',coat:'#4A4744',shade:'#33312F',mane:'#1F1E1D',muzzle:'#8A7E77'},
  sage:{label:'Sage',coat:'#C9D4B4',shade:'#A9B890',mane:'#5E7F45',muzzle:'#F0D6C8'},
  rose:{label:'Rose',coat:'#F3D3D0',shade:'#E0B3B0',mane:'#A84A5C',muzzle:'#F8E3DC'}
 };
 // A coat too dark for ink to show on also names a face color: the eyes, nose and smile are drawn in it instead.
 COATS.ink.face='#F1E9DA';
 const HARNESS={red:'#E2463B',clay:'#D97757',gold:'#E2B865',forest:'#5E7F45',ocean:'#3F8FCC',iris:'#8E63B8'};
 const POSES=['stand','walk','trot','lie','sleep','read','eat','cheer','flag','fall','held'];
 const INK='var(--pet-ink,#141413)',FACE='var(--pet-face,var(--pet-ink,#141413))';
 const ink=(d,w=2.1,extra='')=>`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
 const fill=(d,paint,w=2.1,extra='')=>`<path d="${d}" fill="${paint}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
 const leg=(cls,x,top,foot,bend)=>`<g class="pet-leg ${cls}" style="transform-origin:${x}px ${top}px"><path d="M${x} ${top}C${x+bend} ${top+6} ${foot-bend*.4} ${top+11} ${foot} 57.4" fill="none" stroke="${INK}" stroke-width="4.8" stroke-linecap="round"/><path d="M${x} ${top}C${x+bend} ${top+6} ${foot-bend*.4} ${top+11} ${foot} 57.4" fill="none" stroke="var(--pet-coat)" stroke-width="2.3" stroke-linecap="round"/><path d="M${foot-1.9} 58.6h4.2" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/></g>`;
 // The parts every animal shares: the box, the shadow, and what only some poses show (a book, a treat, the Zs, sparks).
 // `sink` is how far the animal lowers when it lies down, as a share of the pony's: short legs have less to fold.
 const open=(title,animal,sink)=>`<svg class="pet-svg" viewBox="0 0 72 64" role="img" aria-label="${String(title).replace(/[<>&"]/g,'')}" focusable="false" data-animal="${animal}"${sink===1?'':` style="--pet-sink:${sink}"`}>
<path class="pet-shadow" d="M14 60.6C24 62.6 44 62.6 54 60.4C44 59.2 24 59.2 14 60.6z" fill="${INK}" opacity=".13"/>`;
 const at=(x,y)=>x||y?` transform="translate(${x} ${y})"`:'';
 const book=(x=0,y=0)=>`<g class="pet-book"${at(x,y)}><path d="M52 55.6L59 53.6L66 55.6L66 59.4L59 57.6L52 59.4z" fill="#FBF6EA" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M59 53.6V57.6M54 56.6l3.4-.9M61 55.8l3.4.9" fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round"/></g>`;
 const zz=(x=0,y=0)=>`<g class="pet-zz" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"${at(x,y)}><path class="z1" d="M60 40h4l-4 4.4h4"/><path class="z2" d="M65.4 31.4h3l-3 3.4h3"/></g>`;
 const sparks=`<g class="pet-sparks" fill="#E2B865" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"><path class="s1" d="M10 14l1.6 3.4L15 19l-3.4 1.6L10 24l-1.6-3.4L5 19l3.4-1.6z"/><path class="s2" d="M66 26l1.1 2.3L69.4 29.4L67.1 30.5L66 32.8L64.9 30.5L62.6 29.4L64.9 28.3z"/><path class="s3" d="M30 6l1 2.1L33.1 9.1L31 10.1L30 12.2L29 10.1L26.9 9.1L29 8.1z"/></g>`;
 // shown for a moment when it is petted; drawn in the head so they rise from wherever the head is
 const hearts=(x,y)=>`<g class="pet-hearts"${at(x,y)} fill="#E86F6F" stroke="${INK}" stroke-width="1" stroke-linejoin="round"><path class="h1" d="M0 1.4C-1.4-.6-4 .6-2.8 2.8L0 5.4L2.8 2.8C4 .6 1.4-.6 0 1.4z"/><path class="h2" d="M6 -1.4C4.9-3 2.8-2 3.8-.3L6 1.8L8.2-.3C9.2-2 7.1-3 6-1.4z"/></g>`;
 // a part that moves on its own now and then (an ear, a nose, a tail, cheeks), turning about (x, y)
 const part=(cls,x,y,inner)=>`<g class="${cls}" style="transform-origin:${x}px ${y}px">${inner}</g>`;
 const bowl=`<path d="M54 57.4C54 54.6 64 54.6 64 57.4L62.6 60H55.4z" fill="#D4A27F" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
 function pony(title){
  // 72 x 64 box; the ground is y = 60; the pony faces right. Mirroring is done by the wrapper, never here.
  return `${open(title,'pony',1)}
<g class="pet-all">
 <g class="pet-up">
  <g class="pet-legs">${leg('lf2',38.6,43,38.2,.8)}${leg('lh2',26.4,43,26.8,-.8)}</g>
  <g class="pet-tuck2"><path d="M40 43.1C44 45.1 48 45.7 52 45.5" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M40 43.1C44 45.1 48 45.7 52 45.5" fill="none" stroke="var(--pet-coat)" stroke-width="2.2" stroke-linecap="round"/></g>
  <g class="pet-tail" style="transform-origin:17px 33px">${fill('M18 31.6C10.4 32.6 7.2 40.6 9.4 50.4C11.6 46.4 14.2 42.6 19.6 38.8z','var(--pet-mane)',2.2)}${ink('M12.4 38.6C11.6 41.4 11.4 44 11.8 46.4',1.1,' opacity=".55"')}</g>
  <g class="pet-body">
   ${fill('M20 30.2C27.6 27 38 27 45 29C49.4 31 50.4 37 47.2 41.2C43 46.4 30 47.2 23 45.2C15.8 43 14 35 20 30.2z','var(--pet-coat)')}
   <path d="M22.6 43.6C29 46 40 45.6 45.6 41.6C42 46 30.4 46.8 23.4 44.9z" fill="var(--pet-shade)"/>
   <path class="pet-blanket" d="M26.6 29.2C30.6 28.2 35 28.2 38.6 29L37.4 36.4C33.6 37.4 30.6 37.2 27.8 36.2z" fill="var(--pet-harness)" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>
   <path class="pet-blanket" d="M29.4 31.4h6.4M29.8 33.8h5.4" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>
  </g>
  <g class="pet-legs">${leg('lf',43,42.6,43.4,.9)}${leg('lh',21.6,42.6,21,-.9)}</g>
  <g class="pet-tuck"><path d="M43.6 43.1C47 45.5 51.4 46.5 56 46.3" fill="none" stroke="${INK}" stroke-width="5.2" stroke-linecap="round"/><path d="M43.6 43.1C47 45.5 51.4 46.5 56 46.3" fill="none" stroke="var(--pet-coat)" stroke-width="2.3" stroke-linecap="round"/><path d="M21 42.9C17.6 44.9 17.2 46.5 21.4 46.9" fill="none" stroke="${INK}" stroke-width="5.2" stroke-linecap="round"/><path d="M21 42.9C17.6 44.9 17.2 46.5 21.4 46.9" fill="none" stroke="var(--pet-coat)" stroke-width="2.3" stroke-linecap="round"/></g>
  <g class="pet-neck" style="transform-origin:45px 33px">
   ${fill('M40.6 31.4C42.4 24.4 46.6 18.6 51 14.6L58 20.4C53.6 24.6 50.6 30.4 48.6 37.6C46 37.4 42.6 35 40.6 31.4z','var(--pet-coat)')}
   <path class="pet-collar" d="M41.6 29.4C44.6 31.4 47.4 34 49.2 36.8" fill="none" stroke="${INK}" stroke-width="6.6" stroke-linecap="round"/><path class="pet-collar" d="M41.6 29.4C44.6 31.4 47.4 34 49.2 36.8" fill="none" stroke="var(--pet-harness)" stroke-width="3.6" stroke-linecap="round"/>
   <circle class="pet-collar" cx="45.6" cy="33" r="1.5" fill="#E2B865" stroke="${INK}" stroke-width=".9"/>
   <g class="pet-head" style="transform-origin:53px 16px">
    ${fill('M50.4 10.6L51.2 3.8L55.4 8.8z','var(--pet-coat)',2)}
    ${fill('M49 12.2C52.6 7.8 61 9.4 63.4 14.4C65.4 18.8 62.2 23.4 57 23.2C51.8 23 46.6 18 49 12.2z','var(--pet-coat)')}
    <path d="M58.6 16.6C61.6 15.2 64.4 16.6 64 19.4C63.4 22 60.4 23.4 57.6 23z" fill="var(--pet-muzzle)"/>
    ${ink('M49 12.2C52.6 7.8 61 9.4 63.4 14.4C65.4 18.8 62.2 23.4 57 23.2C51.8 23 46.6 18 49 12.2z')}
    ${fill('M53.2 9.4L55.2 3.2L58.4 8.6z','var(--pet-coat)',2)}
    <g class="pet-eye"><circle cx="56.2" cy="14.8" r="1.45" fill="${FACE}"/><circle cx="56.7" cy="14.3" r=".45" fill="#FFFFFF"/></g>
    <path class="pet-lid" d="M54.4 15.2C55.4 16.2 57 16.2 58 15.2" fill="none" stroke="${FACE}" stroke-width="1.3" stroke-linecap="round"/>
    <circle cx="62" cy="18.6" r=".8" fill="${FACE}"/>
    <path class="pet-smile" d="M58.8 21.2C60 21.8 61.2 21.6 62.2 20.8" fill="none" stroke="${FACE}" stroke-width="1" stroke-linecap="round"/>
    ${fill('M51.6 8.4C49 10.4 47.4 13 47.6 16.4C49.8 15 51.6 12.6 52.6 9.6z','var(--pet-mane)',1.8)}
    ${hearts(57,0)}
    <g class="pet-flag"><path d="M62.6 20.4L67.6 3.6" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M67.6 3.6L71.4 6.6L66.4 9.4z" fill="var(--pet-note,#E2B865)" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/></g>
   </g>
   ${fill('M50.6 12.6C46.6 15.4 43 20.6 41.2 27.6C38.6 24.6 39.4 17.6 43.6 12.8C46 10.2 49.4 9.8 50.6 12.6z','var(--pet-mane)',2.2)}
   ${ink('M44.4 15.4C42.8 18 42 20.8 41.8 23.4',1.1,' opacity=".55"')}
  </g>
 </g>
 ${book()}
 <g class="pet-oats">${bowl}<path d="M56 55.4c1.4-1.4 4.6-1.4 6 0" fill="none" stroke="#E2B865" stroke-width="1.8" stroke-linecap="round"/></g>
 ${zz()}
 ${sparks}
</g></svg>`;
 }

 // THE OTHER ANIMALS are drawn on the pony's rig: the same parts under the same class names (legs in diagonal pairs, the
 // tucked legs that show lying down, a tail, a neck that carries the head), so pets.js and pet.css move every one of them
 // the way they move the pony, through every pose. Same box, same ground, same ink and the same paint variables.
 const tube=(d,w,core,paint='var(--pet-coat)')=>`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${paint}" stroke-width="${core}" stroke-linecap="round"/>`;
 const r2=n=>+n.toFixed(2);
 // a leg as the pony draws one, ending in a paw instead of a hoof (long: a rabbit's hind foot)
 const paw=(cls,x,top,foot,bend,{w=4.8,core=2.3,paint='var(--pet-coat)',long=0}={})=>{
  const h=57.4-top;
  return `<g class="pet-leg ${cls}" style="transform-origin:${x}px ${top}px">${tube(`M${x} ${top}C${r2(x+bend)} ${r2(top+h*.4)} ${r2(foot-bend*.4)} ${r2(top+h*.75)} ${foot} 57.4`,w,core,paint)}<ellipse cx="${r2(foot+.4+long)}" cy="58.3" rx="${r2(w/2+long)}" ry="1.5" fill="${paint}" stroke="${INK}" stroke-width="1.4"/></g>`;
 };
 const eye=(x,y,lid=FACE)=>`<g class="pet-eye"><circle cx="${x}" cy="${y}" r="1.45" fill="${FACE}"/><circle cx="${r2(x+.5)}" cy="${r2(y-.5)}" r=".45" fill="#FFFFFF"/></g><path class="pet-lid" d="M${r2(x-1.8)} ${r2(y+.4)}C${r2(x-.8)} ${r2(y+1.4)} ${r2(x+.8)} ${r2(y+1.4)} ${r2(x+1.8)} ${r2(y+.4)}" fill="none" stroke="${lid}" stroke-width="1.3" stroke-linecap="round"/>`;
 const collar=(d,x,y,w=6.6,core=3.6)=>`<path class="pet-collar" d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"/><path class="pet-collar" d="${d}" fill="none" stroke="var(--pet-harness)" stroke-width="${core}" stroke-linecap="round"/><circle class="pet-collar" cx="${x}" cy="${y}" r="1.5" fill="#E2B865" stroke="${INK}" stroke-width=".9"/>`;
 const blanket=(d,stripes)=>`<path class="pet-blanket" d="${d}" fill="var(--pet-harness)" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/><path class="pet-blanket" d="${stripes}" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>`;
 // the note it carries when something is due, held in the mouth at (x, y)
 const flag=(x,y)=>{const tx=r2(x+5),ty=r2(y-16.8);return `<g class="pet-flag" style="transform-origin:${x}px ${y}px"><path d="M${x} ${y}L${tx} ${ty}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M${tx} ${ty}L${r2(tx+3.8)} ${r2(ty+3)}L${r2(tx-1.2)} ${r2(ty+5.8)}z" fill="var(--pet-note,#E2B865)" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/></g>`;};
 const whiskers=d=>`<path d="${d}" fill="none" stroke="${FACE}" stroke-width=".9" stroke-linecap="round" opacity=".55"/>`;
 const rig=(title,animal,p)=>`${open(title,animal,ANIMALS[animal].sink)}
<g class="pet-all">
 <g class="pet-up">
  <g class="pet-sway" style="transform-origin:34px 58px">
  <g class="pet-legs">${p.backLegs}</g>
  <g class="pet-tuck2">${p.tuck2||''}</g>
  <g class="pet-tail" style="transform-origin:${p.tailAt}">${p.tail}</g>
  <g class="pet-body">${p.body}</g>
  <g class="pet-legs">${p.legs}</g>
  <g class="pet-tuck">${p.tuck}</g>
  <g class="pet-neck" style="transform-origin:${p.neckAt}">${p.neck}<g class="pet-head" style="transform-origin:${p.headAt}">${p.head}${p.hearts}</g></g>
  </g>
 </g>
 ${p.book}
 <g class="pet-oats">${p.treat}</g>
 ${p.zz}
 ${sparks}
</g></svg>`;
 const COAT='var(--pet-coat)',MANE='var(--pet-mane)',SHADE='var(--pet-shade)',MUZZLE='var(--pet-muzzle)';
 const shape=(d,paint)=>`<path d="${d}" fill="${paint}"/>`;

 function cat(title){
  const head='M45.4 24.6C45.4 19 49.6 16 54.4 16.2C59.6 16.4 63.4 19.8 63 24.8C62.6 29.6 58.6 32.4 54 32.2C49.2 32 45.4 29.6 45.4 24.6z';
  return rig(title,'cat',{
   backLegs:paw('lf2',40.2,44.2,40,.6)+paw('lh2',25.6,44.2,26,-.6),
   tuck2:tube('M40 46.4C44 48 47.6 48.4 51 48.2',5,2.2),
   tailAt:'19px 38px',
   tail:tube('M19.6 38.6C13.4 38.4 10.4 34 10.8 28.6C11.1 24.8 13.2 22.2 15.8 22.6',5.4,2.8)+`<path d="M11.4 25.6C12.4 23.6 14 22.4 15.8 22.6" fill="none" stroke="${MANE}" stroke-width="2.8" stroke-linecap="round"/>`,
   body:fill('M20.4 35.6C27.4 32.6 38.8 32.4 45.4 34.4C49.8 36 50.6 41.6 47.4 44.8C43 48.4 29.6 48.8 22.6 46.8C16.6 45 15.4 39 20.4 35.6z',COAT)
    +shape('M23 45.4C29.6 47.6 40.6 47.2 46 43.8C42.4 47.8 30.2 48.4 23.6 46.6z',SHADE)
    +`<path d="M21.4 37.6l2.8 1.4M20.4 40.8l3 .6" fill="none" stroke="${MANE}" stroke-width="1.6" stroke-linecap="round"/>`
    +blanket('M28 33.4C31.6 32.6 35.6 32.6 39 33.2L38 39.6C34.6 40.4 31.4 40.2 29 39.4z','M30.4 35.4h5.8M30.8 37.6h4.8'),
   legs:paw('lf',44,44.4,44.6,.7)+paw('lh',22.4,44.4,21.8,-.7),
   tuck:tube('M44 46.6C47.4 48.6 51 49 54.6 48.8',5.2,2.3)+tube('M21.6 46.4C18.4 48 18.4 49.4 22 49.8',5.2,2.3),
   neckAt:'44px 38px',
   neck:fill('M41 35.6C42 31 44.6 27.8 48.4 26L54.4 30.8C51.8 33 50.2 36.4 49.6 40.4C46.2 40.4 42.8 38.6 41 35.6z',COAT)+collar('M42.2 33.4C45 35 47.6 37 49.4 39.6',45.8,36.2,5.8,3.2),
   headAt:'52px 29px',
   head:fill('M46.6 20.4L46.2 11.8L52.4 16.2z',COAT,2)+fill(head,COAT)
    +part('pet-ear',58.6,17.6,fill('M55.4 16.6L60 9.4L61.8 18.6z',COAT,2)+shape('M57.2 15.8L59.6 12.4L60.4 17z',MUZZLE))
    +`<path d="M50.6 17.6l.8 2.6M53.4 16.8l.4 2.8" fill="none" stroke="${MANE}" stroke-width="1.5" stroke-linecap="round"/>`
    +eye(56.8,22.8)
    +`<path d="M60.8 25.2L62.8 25.3L61.8 26.6z" fill="${MUZZLE}" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>`
    +`<path class="pet-smile" d="M60 27.6C60.6 28.4 61.4 28.2 61.8 27.2C62.2 28.2 63 28.4 63.4 27.6" fill="none" stroke="${FACE}" stroke-width="1" stroke-linecap="round"/>`
    +part('pet-whisk',63,26.4,whiskers('M63.2 25.6l4.2-.8M63.4 27l4 .6'))+flag(61.8,28.6),
   hearts:hearts(55,7),
   book:book(),
   treat:bowl+`<path d="M56.6 55.6C58.2 53.8 61 53.8 62.4 55.6C61 57 58.2 57 56.6 55.6z" fill="#9FB8C8" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/><path d="M56.6 55.6L54.8 54.4V56.8z" fill="#9FB8C8" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>`,
   zz:zz(0,-6)
  });
 }

 function bunny(title){
  const head='M44.4 28.4C44.2 23 48.4 20.2 53.4 20.4C58.8 20.6 62.4 24.2 62 28.8C61.6 33.4 57.4 36 52.8 35.8C48 35.6 44.6 33.2 44.4 28.4z',leg={w:4.6,core:2.2};
  return rig(title,'bunny',{
   backLegs:paw('lf2',40,47.2,40.2,.4,leg)+paw('lh2',26,46.8,25.4,-.4,{...leg,long:1.6}),
   tuck2:tube('M40 48.8C43.4 50.2 46.4 50.4 49.6 50.2',5,2.2),
   tailAt:'19px 39px',
   tail:fill('M15.2 38.4C14.4 35 17.6 33.2 20.4 34.6C22.8 35.8 22.6 39.8 19.6 40.6C17.6 41.2 15.6 40.2 15.2 38.4z','#FBF6EA',2),
   body:fill('M18.6 40.4C19.4 34 26 30.8 33.6 31.4C40.6 32 46.8 35.6 47.6 41.2C48.4 46.4 43.2 49.6 35.4 49.8C27 50 18 47.4 18.6 40.4z',COAT)
    +shape('M22 46.4C28 49 38 49.4 44.4 46.6C40.6 49.4 30 49.8 23.6 47.8z',SHADE)
    +ink('M22.4 44.2C23.2 39.6 27.6 37.8 31 40',1.2,' opacity=".55"')
    +blanket('M28.4 31.6C32 31 35.8 31.4 39.2 32.4L37.6 38.8C34.2 39.4 31.2 39 28.8 38z','M30.6 33.8h5.8M30.8 36h5'),
   legs:paw('lf',43.4,46.8,43.8,.5,leg)+paw('lh',22.4,46.4,21.6,-.5,{...leg,long:1.8}),
   tuck:tube('M43 49C46.2 50.6 49.6 50.8 52.6 50.4',5,2.2)+tube('M21.6 48.6C19.4 50.6 21 51.6 26.4 51.6',5,2.2),
   neckAt:'44px 41px',
   neck:fill('M40.6 36.8C41.6 33 44 30.6 47.2 29.6L52.2 33.6C50 35.4 48.8 38 48.4 41.4C45.4 41.2 42.4 39.6 40.6 36.8z',COAT)+collar('M41.6 35.4C44 36.6 46.4 38.4 48.2 40.6',44.6,37.6,5.6,3.2),
   headAt:'52px 31px',
   head:part('pet-ear2',50.6,21.6,fill('M48.6 22.6C46.4 16.4 46 9.8 48.6 6.6C51.6 8.6 53 15 52.6 21.6z',COAT,2))+fill(head,COAT)
    +part('pet-ear',54.8,21.6,fill('M53 21.2C53.4 14.2 55.6 8 58.8 6C60.8 9.4 59.4 16 56.4 22z',COAT,2)+shape('M55.2 18.4C55.8 13.6 57 10.6 58.2 9.4C58.8 11.8 58.2 15.4 56.6 19.2z',MUZZLE))
    +eye(55.8,26.6)+`<ellipse cx="57.6" cy="30.6" rx="1.7" ry="1" fill="${MUZZLE}"/>`
    +part('pet-nose',61.1,28.9,`<path d="M60.2 28.4L62 28.5L61.1 29.7z" fill="${MUZZLE}" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>`)
    +`<path class="pet-smile" d="M59.6 31C60.2 31.6 60.8 31.4 61.1 30.4C61.5 31.4 62.1 31.6 62.6 31" fill="none" stroke="${FACE}" stroke-width="1" stroke-linecap="round"/>`
    +part('pet-whisk',62.2,30,whiskers('M62.2 29.4l3.6-.6M62.4 30.6l3.4.6'))+flag(61.4,31),
   hearts:hearts(51,4),
   book:book(),
   treat:`<path d="M53.6 58.6L64 55.4C65.4 55.2 66 56.6 65 57.6L54.4 60z" fill="#E8925A" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/><path d="M57.4 58.4l.6-1.2M60.4 57.4l.6-1.2" fill="none" stroke="${INK}" stroke-width=".9" stroke-linecap="round"/><path d="M65 55.8l2.4-2.8M65.6 56.6l3-1" fill="none" stroke="#5E7F45" stroke-width="1.6" stroke-linecap="round"/>`,
   zz:zz(-1,-2)
  });
 }

 function fox(title){
  const head='M46 21.4C47.2 17.4 51.4 15.6 55.2 16.2C58.4 16.7 60.8 18.8 62.8 21.2L67.4 25.2C68 26.4 67.2 27.4 66 27.6L58.6 29.2C55 31.2 49.8 30.8 47.4 28C45.8 26.2 45.4 23.6 46 21.4z';
  const tail='M20.6 36.2C13.4 32.4 6.4 34.4 4.6 40.6C3.4 45.4 6 50.2 10.6 50.2C10 46.4 12.2 42.8 16.8 41.8C18.8 41.4 20.6 40.2 21.4 38.4z',sock={paint:MANE};
  return rig(title,'fox',{
   backLegs:paw('lf2',40,43.6,39.6,.8,sock)+paw('lh2',26.4,43.6,26.8,-.8,sock),
   tuck2:tube('M40 45.6C44 47.4 47.6 47.8 51 47.6',5,2.2,MANE),
   tailAt:'20px 37px',
   tail:part('pet-swish',20,37,shape(tail,COAT)+shape('M4.6 40.6C3.4 45.4 6 50.2 10.6 50.2C9.4 47.6 9.4 45 10.4 42.6C8.6 41 6.6 40.4 4.6 40.6z',MUZZLE)+ink(tail,2.2)),
   body:fill('M21 34.6C28 31.8 38.6 31.6 45 33.4C49.2 34.8 50 40.2 47 43.2C42.8 46.6 30.2 46.8 23.2 45C17.4 43.4 16.4 37.8 21 34.6z',COAT)
    +shape('M23.6 43.6C30 45.8 40.4 45.4 45.6 42.4C42 46 30.6 46.4 24.2 44.8z',SHADE)
    +blanket('M28 32.6C31.6 31.8 35.6 31.8 39 32.4L38 38.8C34.6 39.6 31.4 39.4 29 38.6z','M30.4 34.6h5.8M30.8 36.8h4.8'),
   legs:paw('lf',44,43.4,44.4,.9,sock)+paw('lh',22.2,43.2,21.6,-.9,sock),
   tuck:tube('M44 45.6C47.4 47.8 51.2 48.4 55.2 48.2',5.2,2.3,MANE)+tube('M21.6 45.2C18.4 46.8 18.4 48.2 22 48.6',5.2,2.3,MANE),
   neckAt:'44px 36px',
   neck:fill('M40.8 34.2C42 29.6 44.8 26.2 48.4 24.2L54.6 29C52 31.4 50.4 34.8 49.6 39C46.2 39 42.6 37.2 40.8 34.2z',COAT)
    +shape('M45.6 38.4C47.2 35.4 49.2 32.6 51.6 31L53.6 32.4C51.8 34.4 50.4 36.6 49.6 39C48.2 39 46.8 38.8 45.6 38.4z',MUZZLE)
    +collar('M42 32.2C44.8 33.8 47.4 35.8 49.2 38.4',45.6,35,5.8,3.2),
   headAt:'52px 26px',
   head:fill('M47.6 19.4L46.8 9.4L53.2 15.2z',COAT,2)+shape(head,COAT)
    +shape('M51.6 26.6C55 27.6 60.4 27.6 66.4 27.4L58.6 29.2C55 31.2 50 30.8 47.6 28.2C48.8 27.4 50.2 26.8 51.6 26.6z',MUZZLE)+ink(head)
    +part('pet-ear',57.6,17.4,fill('M54.6 16.4L57.8 7.4L60.8 18.4z',COAT,2)+shape('M56.6 15.6L57.8 11.4L59 16.4z',MUZZLE))
    +eye(57.4,21.2)+`<circle cx="67" cy="25.6" r="1.1" fill="${INK}"/>`
    +`<path class="pet-smile" d="M61.8 26.2C62.8 26.8 64 26.6 64.8 26" fill="none" stroke="${FACE}" stroke-width="1" stroke-linecap="round"/>`
    +flag(64.4,27.6),
   hearts:hearts(52,5),
   book:book(2,0),
   treat:bowl+`<g fill="#C2413A" stroke="${INK}" stroke-width=".9"><circle cx="57" cy="55.4" r="1.3"/><circle cx="61.2" cy="55.4" r="1.3"/><circle cx="59.1" cy="54.6" r="1.3"/></g>`,
   zz:zz(0,-4)
  });
 }

 function panda(title){
  const head='M43.6 26.4C43.6 20.4 48.4 17 54 17.2C59.8 17.4 64 21 63.6 26.6C63.2 31.8 58.8 34.6 53.6 34.4C48.2 34.2 43.6 31.6 43.6 26.4z';
  const body='M18.2 39.2C18.8 32.6 26.4 29.6 34.4 30C42.4 30.4 49.4 33.8 49.8 40.4C50.2 46.4 44.4 49.6 34.6 49.8C25.4 50 17.6 46.4 18.2 39.2z',leg={w:6.4,core:3.6,paint:MANE};
  return rig(title,'panda',{
   backLegs:paw('lf2',40.4,46.4,40.4,.4,leg)+paw('lh2',26,46.4,26.2,-.4,leg),
   tuck2:tube('M40 48.6C43.6 50.2 46.8 50.4 50 50.2',6.4,3.6,MANE),
   tailAt:'18px 38px',
   tail:fill('M19.2 35.4C16.4 34.6 14.6 36.6 15.2 38.8C15.8 40.8 18.4 41.2 19.8 39.8z',COAT,2),
   body:shape(body,COAT)+shape('M21.6 45.8C27.6 48.8 40.6 49.2 46.8 45.8C43 49.2 30 49.6 23.4 47.6z',SHADE)
    +shape('M40.2 30.6C44.4 31.4 48 33.2 49.4 37.2C50.4 40.6 49.2 43.8 46.6 45.8C44.8 40.6 42.8 35.4 40.2 30.6z',MANE)+ink(body)
    +blanket('M26.4 30.6C30 29.8 34 29.8 37.6 30.6L36.4 37.4C32.8 38.2 29.6 38 27.2 37z','M28.8 32.6h5.8M29.2 34.8h4.8'),
   legs:paw('lf',44.4,46,44.8,.5,leg)+paw('lh',22.4,45.6,21.8,-.5,leg),
   tuck:tube('M43.6 48.4C47 50 50.6 50.4 54 50.2',6.4,3.6,MANE)+tube('M21.6 47.6C18.6 49.2 18.8 50.6 22.4 51',6.4,3.6,MANE),
   neckAt:'44px 40px',
   neck:fill('M40.4 36C41.4 31.8 44 28.8 47.6 27.4L53.2 31.6C50.8 33.6 49.4 36.6 49 40.2C45.6 40.2 42.2 38.6 40.4 36z',COAT)+collar('M41.4 34C44.2 35.6 46.8 37.6 48.6 40.2',45,36.8,5.8,3.2),
   headAt:'53px 28px',
   head:`<circle cx="47.2" cy="19.4" r="3.6" fill="${MANE}" stroke="${INK}" stroke-width="2"/><circle cx="58.6" cy="18" r="3.8" fill="${MANE}" stroke="${INK}" stroke-width="2"/>`+fill(head,COAT)
    +shape('M54 23.4C55 20.8 58.6 20.6 59.6 23C60.4 25.2 58.4 27.6 56 27.2C54.4 26.9 53.4 25.2 54 23.4z',MANE)
    +`<g class="pet-eye"><circle cx="56.9" cy="23.6" r="1.45" fill="#FFFFFF"/><circle cx="57.2" cy="23.7" r=".8" fill="${INK}"/></g><path class="pet-lid" d="M55.2 24C56.2 25 57.8 25 58.8 24" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round"/>`
    +`<path d="M61 27.2C61.8 26.6 63.2 26.8 63.4 27.6C63.2 28.4 61.8 28.6 61 28z" fill="${INK}"/>`
    +`<path class="pet-smile" d="M59.8 29.8C60.6 30.6 61.6 30.4 62.2 29.6" fill="none" stroke="${FACE}" stroke-width="1" stroke-linecap="round"/>`
    +flag(61.6,30),
   hearts:hearts(52,8),
   book:book(),
   treat:tube('M52.6 58.6L66.4 55',4.2,2.4,'#9DBF6E')+ink('M57 57.8l-.6-2.4M61.6 56.6l-.6-2.4',1)+fill('M64 55.6C65.4 53 67.6 52.2 69.6 52.6C68.4 54.6 66.4 55.8 64 55.6z','#7FA65A',1.1),
   zz:zz(0,-3)
  });
 }

 function hamster(title){
  const head='M42.8 33.2C42.8 26.8 47.6 23.2 53.4 23.4C59.6 23.6 63.4 27.8 63 33.4C62.6 38.8 58.2 41.8 52.8 41.6C47 41.4 42.8 38.8 42.8 33.2z';
  const body='M17.6 44.4C17.2 37.4 23.2 32.8 31.2 32.4C39.6 32 46.8 35.2 48.8 40.8C50.6 46.2 46.8 51 38.4 51.6C28.6 52.2 18 51 17.6 44.4z',leg={w:4,core:1.8};
  return rig(title,'hamster',{
   backLegs:paw('lf2',40,49.6,40.2,.3,leg)+paw('lh2',26,49.6,25.8,-.3,leg),
   tailAt:'18px 42px',
   tail:fill('M18.6 41C16.6 40.2 15.2 41.6 15.8 43.2C16.4 44.6 18.4 44.6 19.2 43.4z',COAT,1.8),
   body:shape(body,COAT)+shape('M18.2 40.8C20 35.4 25.6 32.6 31.2 32.4C37.8 32.2 43.4 34 46.6 37.4C41.6 37.6 36.4 39.4 32 42.6C27.4 45.8 21.4 45.6 18.2 40.8z',MANE)
    +shape('M21.4 48.6C28 51.4 40 51.6 46.4 48.4C42.6 51.4 30 52 23.4 50.2z',SHADE)+ink(body)
    +blanket('M27.4 32.8C31 32.2 34.8 32.4 38.2 33.2L37 39.2C33.6 39.8 30.6 39.6 28.2 38.6z','M29.6 34.8h5.8M30 37h4.8'),
   legs:paw('lf',43.4,49.4,43.8,.3,leg)+paw('lh',22.4,49.2,22,-.3,leg),
   tuck:tube('M42.4 51C45 52 47.6 52 50.2 51.6',4.4,2),
   neckAt:'44px 44px',
   neck:fill('M40.6 40.4C41.6 37 44 35 47 34.4L51 38C49.2 39.6 48.2 42 48 44.8C45.2 44.6 42.2 43 40.6 40.4z',COAT)+collar('M41.4 39C43.6 40.2 45.8 41.8 47.6 44',44.4,41.4,5,2.8),
   headAt:'53px 34px',
   head:`<circle cx="46.8" cy="25.6" r="2.8" fill="${COAT}" stroke="${INK}" stroke-width="1.8"/>`+shape(head,COAT)
    +shape('M43.4 29.4C45 25.4 49 23.4 53.4 23.4C56.8 23.6 59.6 25 61.2 27.2C57.6 27.4 54.6 28.6 52.4 30.6C49.2 32.4 45.6 31.8 43.4 29.4z',MANE)+ink(head)
    +part('pet-cheek',57.6,38.6,shape('M53.6 37.4C55.6 35.2 60.6 35 62.2 36.8C62.6 39.2 60.6 41 57.6 41C55.2 41 53.4 39.6 53.6 37.4z',COAT)+ink('M54.6 39.4C57.8 40.6 61 39.4 62.2 36.6',1.1,' opacity=".55"'))
    +`<circle cx="56.4" cy="24.4" r="3" fill="${COAT}" stroke="${INK}" stroke-width="1.8"/><circle cx="56.6" cy="24.6" r="1.5" fill="${MUZZLE}"/>`
    +eye(56.4,30.6)+`<circle cx="62.2" cy="32.8" r=".9" fill="${MUZZLE}" stroke="${INK}" stroke-width=".8"/>`
    +`<path class="pet-smile" d="M60.4 35.2C60.9 35.8 61.6 35.7 62 35" fill="none" stroke="${FACE}" stroke-width="1" stroke-linecap="round"/>`
    +part('pet-whisk',63,34.2,whiskers('M63 33.6l3.4-.6M63 34.8l3.2.6'))+flag(61.6,35.6),
   hearts:hearts(51,15),
   book:book(),
   treat:`<g fill="#4A4744" stroke="${INK}" stroke-width=".8"><ellipse cx="55.6" cy="58.8" rx="1.7" ry=".9"/><ellipse cx="59" cy="59" rx="1.7" ry=".9" transform="rotate(-14 59 59)"/><ellipse cx="62.4" cy="58.8" rx="1.7" ry=".9"/><ellipse cx="57.4" cy="57.4" rx="1.7" ry=".9" transform="rotate(10 57.4 57.4)"/><ellipse cx="60.8" cy="57.4" rx="1.7" ry=".9"/></g><path d="M54.6 58.8h1.8M58 59.2l1.8-.4M61.4 58.8h1.8M56.4 57.2l1.8.3M59.8 57.4h1.8" fill="none" stroke="#FBF6EA" stroke-width=".5" stroke-linecap="round"/>`,
   zz:zz(-2,2)
  });
 }

 // Each animal: its name, how far it lowers to lie down (see open()), poses it holds differently from the pony (the
 // numbers pets.js eases; pet.css repeats them for a drawing without the controller), and coats it wears its own way.
 const ANIMALS={
  pony:{label:'Pony',sink:1,draw:pony},
  cat:{label:'Cat',sink:.83,draw:cat,poses:{eat:{down:6,neck:50,head:16}}},
  bunny:{label:'Bunny',sink:.65,draw:bunny,poses:{eat:{down:7,neck:40,head:12}}},
  fox:{label:'Fox',sink:.95,draw:fox,coats:{oat:{label:'Red',coat:'#E58C52',shade:'#C46F3A',mane:'#4A2F24',muzzle:'#FBF1E2'}}},
  panda:{label:'Panda',sink:.67,draw:panda,poses:{eat:{down:6,neck:46,head:14}},coats:{oat:{label:'Classic',coat:'#F7F4EC',shade:'#DCD6CA',mane:'#2B2826',muzzle:'#F7F4EC'}}},
  hamster:{label:'Hamster',sink:.5,draw:hamster,poses:{eat:{down:8,neck:34,head:10}}}
 };
 const kind=animal=>typeof animal==='string'&&Object.hasOwn(ANIMALS,animal)?animal:'pony';
 // the paint for one coat on one animal: a fox in Oat is a red fox, a panda in Oat is black and white
 const paint=(animal,coat)=>{const key=typeof coat==='string'&&Object.hasOwn(COATS,coat)?coat:'oat';return {...COATS[key],...ANIMALS[kind(animal)].coats?.[key]};};
 function svg({title,animal='pony'}={}){const a=kind(animal);return ANIMALS[a].draw(title??'Your '+ANIMALS[a].label.toLowerCase());}
 const api={COATS,HARNESS,POSES,ANIMALS,paint,svg};
 root.ReservePetArt=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
