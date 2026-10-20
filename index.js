import {getContext,saveMetadataDebounced} from '../../../extensions.js';
import {eventSource,event_types,substituteParams,generateQuietPrompt} from '../../../../script.js';
import {KEY,parseJSON,validate,sealed,lock,injection,SYSTEM,generationPrompt,reviewPrompt} from './architect.mjs';
const $=id=>document.getElementById(id);
let lastInjected='',lastTime='',busy=false,lastReport='';
const ctx=()=>{const c=getContext();if(!c?.chatId||!c?.chatMetadata)return null;const name=c.characters?.[c.characterId]?.name||c.name2||'';return String(name).includes('Infinite Flow BL Survival Simulator')?c:null};
const current=()=>{const c=ctx();return c?c.chatMetadata[KEY]:null};
function status(msg=''){
 if(msg)lastReport=msg;
 const el=$('ibp-status');if(!el)return;
 const c=ctx(),rec=current();
 el.textContent=(lastReport?lastReport+' · ':'')+(!c?'Open an Infinite Flow GM QA chat':sealed(rec)?'🔒 Instance Bible locked: '+rec.bible.title:'No locked Instance Bible in this chat')+(c&&lastInjected===c.chatId?' · Last prompt injection '+lastTime:' · No new injection observed');
 const btn=$('ibp-generate');if(btn)btn.disabled=busy||!c||sealed(rec);
 const wipe=$('ibp-delete');if(wipe)wipe.disabled=busy||!c||!sealed(rec);
}
function megModeRequest(kind,system,user){
 // Temporarily captures ONLY this extension's quiet utility call. Do not let Megumin's
 // main V11 story prompt and existing chat history contaminate the private blueprint.
 // CHAT_COMPLETION_PROMPT_READY is emitted synchronously through the standard ST request.
 return new Promise(async (resolve,reject)=>{
  let engaged=false;
  const handler=data=>{
   if(!engaged)return;
   const messages=data?.messages||data?.chat||(Array.isArray(data)?data:null);
   if(!Array.isArray(messages)||!messages.some(m=>typeof m.content==='string'&&m.content.includes('___IBP_PRIVATE_'+kind+'___')))return;
   messages.splice(0,messages.length,{role:'system',content:system},{role:'user',content:user});
  };
  eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY,handler);
  engaged=true;
  try{resolve(await generateQuietPrompt({prompt:'___IBP_PRIVATE_'+kind+'___',quietPrompt:'___IBP_PRIVATE_'+kind+'___'}))}
  catch(e){reject(e)}
  finally {engaged=false;eventSource.removeListener?.(event_types.CHAT_COMPLETION_PROMPT_READY,handler)}
 });
}
async function generate(){
 if(busy)return;const c=ctx();if(!c)return status('No compatible chat open');
 if(sealed(c.chatMetadata[KEY]))return status('Already locked');
 if(!confirm('Generate a private mystery blueprint in this THROWAWAY test chat? This makes two or more GLM calls and uses provider credits. The resulting mystery will not be shown.'))return;
 busy=true;status('Generating privately…');
 const originalId=c.chatId;
 try{
  const macro=k=>{try{return substituteParams(k)}catch{return ''}};
  const info={description:macro('{{description}}'),scenario:macro('{{scenario}}'),persona:macro('{{persona}}'),greeting:c.chat?.[0]?.mes||macro('{{char}}')};
  const draft=parseJSON(await megModeRequest('GENERATE',SYSTEM,generationPrompt(info)));
  const structure=validate(draft);
  if(!structure.ok)throw Error('Draft incomplete: '+structure.issues.join(', '));
  status('Reviewing clue fairness…');
  const review=parseJSON(await megModeRequest('REVIEW','You are a meticulous independent game-mystery auditor. Output only JSON.',reviewPrompt(draft)));
  const live=ctx();
  if(!live||live.chatId!==originalId)throw Error('Chat changed during generation. Nothing was saved.');
  lock(live.chatMetadata,draft,review);
  saveMetadataDebounced();
  status('Generated, reviewed, and sealed. Ready for QA (not yet full automatic campaign integration)');
 }catch(e){status('Not locked: '+String(e.message||e).slice(0,250));}
 finally{busy=false;status()}
}
function buildUI(){
 if($('ibp-panel'))return;
 const box=document.createElement('div');box.id='ibp-panel';
 const h=document.createElement('h3');h.textContent='📖 Instance Architect — QA v0.2';box.append(h);
 const p=document.createElement('p');p.textContent='Experimental. Generate, audit and seal a PRIVATE GM mystery before play. Only use in a disposable QA chat.';box.append(p);
 const controls=document.createElement('div');controls.className='ibp-controls';
 const btn=(id,label,cb)=>{const b=document.createElement('button');b.id=id;b.type='button';b.textContent=label;b.addEventListener('click',cb);controls.append(b)};
 btn('ibp-generate','✨ Generate Instance',generate);
 btn('ibp-check','Check status',()=>status());
 btn('ibp-delete','Delete QA Bible',()=>{
  const c=ctx();if(!c||!sealed(c.chatMetadata[KEY]))return;
  if(!confirm('DELETE the SEALED Instance Bible from this QA chat? This invalidates any mystery played in it.'))return;
  delete c.chatMetadata[KEY];saveMetadataDebounced();status('Deleted from QA chat');
 });
 box.append(controls);
 const st=document.createElement('p');st.id='ibp-status';st.setAttribute('aria-live','polite');box.append(st);
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
function init(){eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY,inject);eventSource.on(event_types.CHAT_CHANGED,()=>status());buildUI();console.info('[Instance Architect v0.2] loaded; test only')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
