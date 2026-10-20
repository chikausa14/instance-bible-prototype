export const KEY='pipette_instance_bible_v02',SCHEMA='instance-bible-v0.2';
const w=x=>typeof x==='string'&&x.trim().length>=6;
const nonblank=x=>typeof x==='string'&&x.trim().length>0;
const properName=x=>typeof x==='string'&&x.trim().length>=2;
const maleGender=x=>nonblank(x)&&/\b(male|man)\b/i.test(x)&&!/\b(female|woman)\b/i.test(x);
const arr=(a,n=1)=>Array.isArray(a)&&a.length>=n;
const texts=(a,n=1)=>arr(a,n)&&a.every(w);
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function parseJSON(raw){
 const text=String(raw||'')
   .replace(/<think\b[^>]*>[\s\S]*?<\/think\s*>/gi,'')
   .replace(/^\s*\u0060{3}(?:json)?\s*/i,'')
   .replace(/\s*\u0060{3}\s*$/,'').trim();
 const begin=text.indexOf('{');
 if(begin<0)throw Error('Model response contains no JSON object ('+text.length+' characters).');
 // Locate the FIRST complete top-level JSON object. An extra explanation after an
 // otherwise valid JSON object must not make parsing fail by extending to the last }.
 let depth=0,inString=false,escaped=false,end=-1;
 for(let i=begin;i<text.length;i++){
   const ch=text[i];
   if(inString){
     if(escaped)escaped=false;
     else if(ch==='\\')escaped=true;
     else if(ch==='"')inString=false;
   }else if(ch==='"')inString=true;
   else if(ch==='{')depth++;
   else if(ch==='}'){
     depth--;
     if(depth===0){end=i+1;break;}
   }
 }
 if(end<0)throw Error('Incomplete JSON ('+text.length+' characters; no closing top-level brace).');
 let result;
 try{result=JSON.parse(text.slice(begin,end))}
 catch(err){throw Error('Invalid JSON near the start ('+text.length+' chars): '+err.message)}
 const trailing=text.slice(end).trim().replace(/^\u0060{3}\s*/,'').trim();
 // Do not quietly accept multiple competing Bibles or audit verdicts.
 if(trailing.includes('{')||trailing.includes('}'))
   throw Error('Multiple JSON objects or extra brace text detected ('+text.length+' chars).');
 // Only tolerate a small amount of plain trailing prose, not arbitrarily long dumps.
 if(trailing.length>800)
   throw Error('Excess trailing non-JSON output ('+trailing.length+' characters).');
 return result;
}
export function validate(b){
 const issues=[],ck=(test,label)=>{if(!test)issues.push(label)};
 if(!obj(b))return {ok:false,issues:['missing object']};
 ck(b.schema===SCHEMA,'schema');
 for(const k of ['id','title','rank','atmosphere'])ck(w(b[k]),k);
 ck(obj(b.opening)&&w(b.opening.situation)&&w(b.opening.stakes)&&texts(b.opening.leads,2),'opening + two leads');
 ck(arr(b.map,3)&&b.map.every(x=>obj(x)&&w(x.name)&&texts(x.connections)),'connected map');
 ck(obj(b.truth)&&['question','answer','history','unknownCosmology'].every(k=>w(b.truth[k]))&&texts(b.truth.evidence,2),'truth and evidence');
 ck(arr(b.mechanics,2)&&b.mechanics.every(x=>obj(x)&&['id','rule','observable','limits','warning','counterplay'].every(k=>w(x[k]))),'mechanics and warnings');
 ck(arr(b.requiredFacts,2)&&b.requiredFacts.every(f=>obj(f)&&w(f.id)&&w(f.fact)&&w(f.recovery)&&arr(f.clues,2)&&f.clues.every(c=>obj(c)&&['source','observable','supports','doesNotProve'].every(k=>w(c[k])))&&new Set(f.clues.map(c=>c.source.toLowerCase().trim())).size>=2),'two independent clues per mandatory fact');
 ck(obj(b.clear)&&obj(b.clear.standard)&&['condition','recognition','reachableMethod'].every(k=>w(b.clear.standard[k])),'ordinary clear');
 ck(obj(b.clear)&&obj(b.clear.perfect)&&typeof b.clear.perfect.applicable==='boolean'&&(!b.clear.perfect.applicable||w(b.clear.perfect.condition)),'perfect clear');
 ck(obj(b.clear)&&obj(b.clear.liberation)&&typeof b.clear.liberation.applicable==='boolean'&&(!b.clear.liberation.applicable||w(b.clear.liberation.bindingAnchor)),'liberation');
 ck(arr(b.npcs,3),'at least three NPC records');
 if(Array.isArray(b.npcs))b.npcs.forEach((x,i)=>{
  const n='NPC #'+(i+1);
  ck(obj(x),n+': valid NPC record');
  if(!obj(x))return;
  ck(properName(x.name),n+': name (two or more characters)');
  ck(Number.isInteger(x.age)&&x.age>=18,n+': integer age 18+');
  ck(nonblank(x.gender),n+': nonempty gender');
  for(const k of ['role','motivation','knowledge','ignorance','initialAction'])
   ck(w(x[k]),n+': '+k+' description');
 });
 ck(arr(b.npcs)&&b.npcs.some(x=>obj(x)&&x.romanceProspect===true&&maleGender(x.gender)&&Number.isInteger(x.age)&&x.age>=18&&w(x.introductionOpportunity)),'accessible adult male romantic opportunity');
 ck(obj(b.dynamic)&&texts(b.dynamic.quietMoments,2)&&texts(b.dynamic.triggeredEvents,2)&&w(b.dynamic.improvisationLimits),'dynamic events and breathers');
 ck(obj(b.pacing)&&['earlyObjective','clueSpacing','avoidNoise'].every(k=>w(b.pacing[k])),'clarity and pacing');
 ck(obj(b.recovery)&&w(b.recovery.missedClues)&&w(b.recovery.failureHandling),'fallbacks');
 ck(texts(b.walkthrough,4),'deducible four-step ordinary clear walkthrough');
 return {ok:issues.length===0,issues};
}
export function sealed(x){return !!(obj(x)&&x.locked===true&&x.version===2&&x.reviewed===true&&validate(x.bible).ok)}
export function lock(meta,bible,review){
 if(!obj(meta))throw Error('Open a chat');
 if(sealed(meta[KEY]))throw Error('Bible already locked here');
 const result=validate(bible);
 if(!result.ok)throw Error('Missing '+result.issues.join(', '));
 if(!obj(review)||review.approved!==true||!Array.isArray(review.issues)||review.issues.length)throw Error('Second-pass audit rejected the Bible');
 const rec={version:2,locked:true,reviewed:true,bible,createdAt:new Date().toISOString()};
 meta[KEY]=rec;return rec;
}
export function injection(rec){
 if(!sealed(rec))return '';
 return ['<LOCKED_INSTANCE_BIBLE version="0.2" authority="fixed-gm-canon">',
 'PRIVATE. NEVER copy or summarize this Bible or reveal answers that the player has not discovered.',
 'Fixed mystery, flexible story. Never rewrite mechanisms, geography, timeline, clues or clear conditions.',
 'Only narrate facts discoverable through player action, consequences and bounded NPC knowledge.',
 'No invented player dialogue, thoughts or choices. Elaborate physical actions the player actually initiated.',
 'Ordinary clear requires neither romance nor perfect clear. Keep any master liberation independent.',
 JSON.stringify(rec.bible),'</LOCKED_INSTANCE_BIBLE>'].join('\n');
}
export const SYSTEM=[
 'PRIVATE INSTANCE ARCHITECT. Output ONLY one complete valid JSON object, no prose or Markdown.',
 'Create an internally fair, interesting F-rank supernatural mystery before play.',
 'Honor visible greeting, existing setting, GM rules, and player persona; do not invent player past or speech.',
 'Mystery answer, mechanics, chronology, danger warnings, mandatory clues and clear conditions must be immutable.',
 'Make two independent reachable clue paths for EACH required fact, plus fallback if clue is lost.',
 'Players need early observable stakes, two leads, chances to reflect, and a credible solvability walkthrough.',
 'Name the three starting adult survivors. Include an accessible adult male romantic prospect with independent goals; never guarantee a relationship.',
 'Do not demand perfect clear, master liberation or romance for ordinary escape.',
 'Keep larger cosmology and hub unmentioned before the first clear. Output concise, concrete details.',
 'CRITICAL OUTPUT CONTRACT: Entire JSON should be below 12000 characters. Write compact JSON with no Markdown.',
 'Exactly 3 connected map nodes, 2 mechanics, 2 mandatory facts, 2 clue sources per fact, 3 named adults, and 4 walkthrough steps.',
 'Each property value should be one concise factual sentence, except where the schema requires arrays or nested objects.',
 'Escape quotation marks inside JSON strings. Never use raw line breaks inside a quoted string; always close all brackets and braces.',
 'Shorten descriptions rather than omitting required facts, dangers, clear conditions, evidence or counters.',
].join('\n');
export const SHAPE={
 schema:SCHEMA,id:'specific instance ID',title:'specific instance title',rank:'F-rank',atmosphere:'setting mood',
 opening:{situation:'what opening already shows',stakes:'what is visibly wrong',leads:['first thing to investigate','second thing to investigate']},
 map:[{name:'named location',connections:['connected named location'],access:'obstacle or access'}],
 truth:{question:'central mystery',answer:'immutable explanation',history:'causal timeline',evidence:['specific physical clue','second physical clue'],unknownCosmology:'UNSPECIFIED'},
 mechanics:[{id:'named rule',rule:'exact mechanic',observable:'how players learn',limits:'exceptions and limits',warning:'advance danger sign',counterplay:'reasonable action'}],
 requiredFacts:[{id:'Fact A',fact:'mandatory discovery',clues:[{source:'first reachable place/witness',observable:'specific tangible evidence',supports:'what it implies',doesNotProve:'what remains unknown'},{source:'DIFFERENT reachable place/witness',observable:'independent evidence',supports:'what it implies',doesNotProve:'what remains unknown'}],recovery:'how still discoverable if a route is lost'}],
 clear:{standard:{condition:'necessary AND sufficient condition',recognition:'on-page clear signal',reachableMethod:'how normal player can achieve it'},perfect:{applicable:false,condition:'NOT APPLICABLE'},liberation:{applicable:false,bindingAnchor:'NOT APPLICABLE'}},
 npcs:[{name:'proper name',age:30,gender:'male',role:'role in scenario',motivation:'independent agenda',knowledge:'knows this',ignorance:'does not know this',initialAction:'does this unaided',romanceProspect:true,introductionOpportunity:'accessible scene'}],
 dynamic:{quietMoments:['investigate and compare','rest and conversation'],triggeredEvents:['condition causes this','another condition causes this'],improvisationLimits:'fixed truth cannot change'},
 pacing:{earlyObjective:'clear first short-term purpose',clueSpacing:'give discoveries breathing room',avoidNoise:'no unrelated rules each turn'},
 recovery:{missedClues:'alternate fair route',failureHandling:'partial failure not arbitrary death'},
 walkthrough:['first observable lead','first meaningful deduction','corroborating evidence','ordinary clear action']
};
export function generationPrompt(input){return [
 'GM card:',String(input.description||'').slice(0,14000),
 'Scenario:',String(input.scenario||'').slice(0,7000),
 'Player persona, do not expand history:',String(input.persona||'').slice(0,3000),
 'Fixed visible opening:',String(input.greeting||'').slice(0,4500),
 'Produce ALL fields in this schema and real content, not examples:',JSON.stringify(SHAPE),
 'Return ONE complete parsable compact JSON object. No thoughts, comments, trailing commas, Markdown, or preamble.',
 'Use exactly 3 named map locations, 2 supernatural mechanics, 2 requiredFacts (with two distinct accessible clue sources each), 3 named NPCs, and 4 walkthrough steps.',
 'Keep the whole response UNDER 12000 characters. Use short specific single-sentence strings. All required keys must appear.',
 'Map connection names must exist in map. Make the standard clear reachable without a romance, perfect clear or master liberation.'
 ].join('\n\n')}
export function reviewPrompt(b){return [
 'INDEPENDENT ADVERSARIAL AUDIT. Evaluate solvability by a player who knows only the opening, fair route to all clues, geography, number/timing consistency, threats and counterplay, meaningful NPC knowledge and ordinary clear independent of romance.',
 'Reject if logical gaps, one-person info bottlenecks, or arbitrary new rules remain. Do not revise in this step.',
 'Output exactly JSON: {"approved":true/false,"issues":["specific reason",...]}.',
 JSON.stringify(b)].join('\n\n')}
