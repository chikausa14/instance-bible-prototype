import test from 'node:test';
import assert from 'node:assert/strict';
import { META_KEY, lockBible, getLockedBible, injectBible, isStoryPrompt } from './core.mjs';

test('locks once and survives serialized metadata roundtrip', () => {
  let meta = {};
  const record = lockBible(meta, {title:'QA',body:'PAPER CRANE'});
  assert.equal(record.locked,true);
  assert.throws(() => lockBible(meta,{title:'Other',body:'different'}),/already exists/);
  const roundtrip = JSON.parse(JSON.stringify(meta));
  assert.equal(getLockedBible(roundtrip).body,'PAPER CRANE');
  assert.equal(roundtrip[META_KEY].body,'PAPER CRANE');
});

test('prompt gate accepts pre- and post-Megumin V11 prompts', () => {
 assert.ok(isStoryPrompt([{role:'system',content:'[[prompt1]]'}]));
 assert.ok(isStoryPrompt([{role:'system',content:"You are a writers' room of five, writing an ongoing story"}]));
 assert.equal(isStoryPrompt([{role:'system',content:'Chomusuke utility extraction'}]),false);
});

test('injects locked Bible only once, with full unmodified contents', () => {
 const meta={}; lockBible(meta,{title:'QA',body:'PAPER CRANE'});
 const msgs=[{role:'system',content:'V11 prompt'}];
 assert.equal(injectBible(msgs,getLockedBible(meta)),true);
 assert.equal(msgs[0].role,'system');
 assert.ok(msgs[0].content.includes('PAPER CRANE'));
 assert.equal(injectBible(msgs,getLockedBible(meta)),false);
 assert.equal(msgs.length,2);
});
