import {getContext,saveMetadataDebounced} from '../../../extensions.js';
import {eventSource,event_types,substituteParams} from '../../../../script.js';
import {KEY,DRAFT_KEY,parseJSON,validate,sealed,lock,injection,pending,saveDraft,recordReview,reviewSummary,repairPrompt,SYSTEM,generationPrompt,reviewPrompt} from './architect.mjs';
const $=id=>document.getElementById(id);
let lastInjected='',lastTime='',busy=false,lastReport='';
const ctx=()=>{const c=getContext();if(!c?.chatId||!c?.chatMetadata)return null;const name=c.characters?.[c.characterId]?.name||c.name2||'';return String(name).includes('Infinite Flow BL Survival Simulator')?c:null};
const current=()=>{const c=ctx();return c?c.chatMetadata[KEY]:null};
function status(msg=''){
 if(msg)lastReport=msg;
 const el=$('ibp-status');if(!el)return;
 const c=ctx(),rec=current(),d=c?pending(c.chatMetadata):null;
 const state=!c?'Open an Infinite Flow GM QA chat'
   :sealed(rec)?'🔒 LOCKED: '+rec.bible.title
   :d?'UNSEALED candidate retained. '+reviewSummary(d)
   :'No locked Instance Bible in this chat';
 el.textContent=(lastReport?lastReport+' · ':'')+state+
   (c&&lastInjected===c.chatId?' · Last prompt injection '+lastTime:' · No new injection observed');
 const canEdit=!!c&&!busy&&!sealed(rec);
 const generate=$('ibp-generate');if(generate)generate.disabled=!canEdit||!!d;
 const repair=$('ibp-repair');if(repair){repair.disabled=!canEdit||!d;repair.textContent=d?.audit?.issues?.length?'🛠️ Repair & Re-review':'🔍 Retry Review'}
 const discard=$('ibp-discard');if(discard)discard.disabled=!canEdit||!d;
 const wipe=$('ibp-delete');if(wipe)wipe.disabled=busy||!c||!sealed(rec);
}
async function megModeRequest(kind, system, user) {
  // Official SillyTavern getContext().generateRaw provides an isolated request:
  // No chat history, Megumin V11 prompt, World Info, or event interception.
  // A missing API is a clear failure: never silently fall back to contaminated prompts.
  const context = getContext();
  if (typeof context?.generateRaw !== 'function') {
    throw Error('Isolated generateRaw API unavailable in this TauriTavern build. No request sent.');
  }
  const result = await context.generateRaw({ systemPrompt: system, prompt: user });
  if (typeof result !== 'string' || !result.trim()) {
    throw Error('Isolated '+kind+' request returned no text.');
  }
  return result;
}
function requireSameChat(id){
 const active=ctx();
 if(!active||active.chatId!==id)throw Error('Chat changed during AI work. No new result saved.');
 return active;
}
async function reviewAndSeal(id){
 const c=requireSameChat(id);
 const draft=pending(c.chatMetadata);
 if(!draft)throw Error('No validated unsealed draft available for review.');
 status('Reviewing privately…');
 const verdict=parseJSON(await megModeRequest('REVIEW',
   'You are an independent mystery QA auditor. Output only the requested JSON verdict. Reject unprovable puzzle fairness.',
   reviewPrompt(draft.bible)));
 const live=requireSameChat(id);
 if(!recordReview(live.chatMetadata,verdict)){
  saveMetadataDebounced();
  status('Review rejected. '+reviewSummary(pending(live.chatMetadata))+' Use Repair & Re-review.');
  return false;
 }
 lock(live.chatMetadata,draft.bible,verdict);
 delete live.chatMetadata[DRAFT_KEY];
 saveMetadataDebounced();
 status('Generated, independently reviewed and SEALED! QA only; not production-ready.');
 return true;
}
async function generate(){
 if(busy)return;
 const c=ctx();if(!c)return status('No compatible chat open.');
 if(sealed(c.chatMetadata[KEY]))return status('Bible already sealed.');
 if(pending(c.chatMetadata))return status('A candidate already exists. Repair, retry review or discard it.');
 if(!confirm('Generate a PRIVATE mystery candidate in this disposable QA chat? Uses GLM tokens for generation and auditing.'))return;
 busy=true;let stage='generation';status('Generating private candidate…');
 const originalId=c.chatId;
 try{
  const macro=k=>{try{return substituteParams(k)}catch{return ''}};
  const info={description:macro('{{description}}'),scenario:macro('{{scenario}}'),
    persona:macro('{{persona}}'),greeting:c.chat?.[0]?.mes||''};
  const draft=parseJSON(await megModeRequest('GENERATE',SYSTEM,generationPrompt(info)));
  const v=validate(draft);
  if(!v.ok)throw Error('Draft incomplete: '+v.issues.join(', '));
  const live=requireSameChat(originalId);
  saveDraft(live.chatMetadata,draft);
  saveMetadataDebounced();
  stage='review';
  await reviewAndSeal(originalId);
 }catch(e){status('Not locked ('+stage+'): '+String(e.message||e).slice(0,240));}
 finally{busy=false;status()}
}
async function repair(){
 if(busy)return;
 const c=ctx();if(!c)return status('No compatible QA chat open.');
 const d=pending(c.chatMetadata);if(!d)return status('No unsealed candidate to repair.');
 const originalId=c.chatId;
 const doRepair=Array.isArray(d.audit?.issues)&&d.audit.issues.length>0;
 if(!confirm((doRepair?'Repair the existing draft and re-review it?':'Retry the existing draft review?')+' This spends additional GLM tokens; the candidate remains private.'))return;
 busy=true;let stage=doRepair?'repair':'review';status(doRepair?'Repairing private candidate…':'Retrying private review…');
 try{
  if(doRepair){
   const revised=parseJSON(await megModeRequest('REPAIR',
     SYSTEM+'\nAddress the supplied independent-review objections, keep the exact JSON schema.',
     repairPrompt(d.bible,d.audit.issues)));
   const v=validate(revised);
   if(!v.ok)throw Error('Repair draft incomplete: '+v.issues.join(', '));
   const live=requireSameChat(originalId);
   const rec=saveDraft(live.chatMetadata,revised);
   rec.repairAttempts=(d.repairAttempts||0)+1;
   saveMetadataDebounced();
  }
  stage='review';
  await reviewAndSeal(originalId);
 }catch(e){status('Not locked ('+stage+'): '+String(e.message||e).slice(0,240));}
 finally{busy=false;status()}
}
function buildUI(){
 if($('ibp-panel'))return;
 const box=document.createElement('div');box.id='ibp-panel';
 // Use SillyTavern's native Extensions-panel drawer, closed by default.
 // The review/generation tasks and per-chat metadata keep running while collapsed.
 const drawer=document.createElement('div');drawer.className='inline-drawer';
 const header=document.createElement('div');header.className='inline-drawer-toggle inline-drawer-header';
 header.setAttribute('role','button');header.setAttribute('tabindex','0');
 header.setAttribute('aria-expanded','false');header.setAttribute('aria-controls','ibp-content');
 const title=document.createElement('b');title.textContent='📖 Instance Architect — QA v0.2.5';header.append(title);
 const icon=document.createElement('div');icon.className='inline-drawer-icon fa-solid fa-circle-chevron-down down';header.append(icon);
 header.addEventListener('click',()=>header.setAttribute('aria-expanded',String(header.getAttribute('aria-expanded')!=='true')));
 header.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();header.click();}});
 const content=document.createElement('div');content.id='ibp-content';content.className='inline-drawer-content';
 const p=document.createElement('p');p.textContent='Experimental. Generate, preserve and repair private drafts; only reviewed Bibles are locked. Disposable QA chats only.';content.append(p);
 const controls=document.createElement('div');controls.className='ibp-controls';
 const btn=(id,label,cb)=>{const b=document.createElement('button');b.id=id;b.type='button';b.textContent=label;b.addEventListener('click',cb);controls.append(b)};
 btn('ibp-generate','✨ Generate Instance',generate);
 btn('ibp-repair','🛠️ Repair & Re-review',repair);
 btn('ibp-check','Check status',()=>status());
 btn('ibp-discard','Discard UNSEALED Draft',()=>{
  const c=ctx();if(!c||sealed(c.chatMetadata[KEY])||!pending(c.chatMetadata))return;
  if(!confirm('Discard the unsealed candidate? This does not affect existing saved campaigns.'))return;
  delete c.chatMetadata[DRAFT_KEY];saveMetadataDebounced();status('Unsealed candidate discarded.');
 });
 btn('ibp-delete','Delete QA Bible',()=>{
  const c=ctx();if(!c||!sealed(c.chatMetadata[KEY]))return;
  if(!confirm('DELETE the SEALED Instance Bible from this QA chat? This invalidates the mystery run.'))return;
  delete c.chatMetadata[KEY];saveMetadataDebounced();status('Sealed QA Bible deleted.');
 });
 content.append(controls);
 const st=document.createElement('p');st.id='ibp-status';st.setAttribute('aria-live','polite');content.append(st);
 drawer.append(header,content);box.append(drawer);
 (document.getElementById('extensions_settings')||document.body).append(box);status();
}
function inject(payload,type){
 if(type==='count'||type==='dry'||type==='dryRun'||payload?.dryRun||payload?.dry||busy)return;
 const c=ctx(),rec=current();if(!c||!sealed(rec))return;
 const messages=payload?.messages||payload?.chat||(Array.isArray(payload)?payload:null);
 if(!Array.isArray(messages)||!messages.some(m=>typeof m.content==='string'&&(m.content.includes('[[prompt1]]')||m.content.includes("You are a writers' room of five"))))return;
 if(messages.some(m=>typeof m.content==='string'&&m.content.includes('<LOCKED_INSTANCE_BIBLE version="0.2"')))return;
 messages.unshift({role:'system',content:injection(rec)});
 lastInjected=c.chatId;lastTime=new Date().toLocaleTimeString();status();
}
function init(){eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY,inject);eventSource.on(event_types.CHAT_CHANGED,()=>status());buildUI();console.info('[Instance Architect v0.2.5] collapsible settings panel; isolated raw generation unchanged')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
