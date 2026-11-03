import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{evaluate,validateProposal,Quota} from '../server/worker.mjs';
const F=globalThis.Fipi;
test('server does not expose a model key and fails closed when not configured',async()=>{
 const response=await worker.fetch(new Request('https://assessor/assess',{method:'POST',headers:{Origin:'https://citer529212.github.io','Content-Type':'application/json'},body:'{}'}),{});assert.equal(response.status,503);assert.ok(!(await response.text()).includes('sk-'));
});
test('unapproved origins never reach model calls',async()=>{
 const r=await worker.fetch(new Request('https://assessor/assess',{method:'POST',headers:{Origin:'https://example.net'}}),{});assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
});
test('incomplete/duplicate/hallucinated criteria are rejected',()=>{
 const r=F.rubrics['ege-writing-37'];assert.throws(()=>validateProposal({criteria:[]},r));
 const c={id:'K1',score:2,reason:'reason',evidence:'quote'};assert.throws(()=>validateProposal({criteria:[c,c,c]},r));
 assert.throws(()=>validateProposal({criteria:[c,{...c,id:'K2',score:3},{...c,id:'K3'}]},r));
});
test('short writing is zero by deterministic volume rule, without a model call',async()=>{
 const result=await evaluate({taskId:'author-ege-email-0',kind:'writing',text:'Dear Alex, thanks!'},{});assert.equal(result.result.score,0);assert.equal(result.result.max,6);
});
test('model total is never trusted; zero gate enforced by the server',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify({criteria:[{id:'K1',score:0,reason:'Не выполнена задача',evidence:'Test'},{id:'K2',score:2,reason:'Организация',evidence:'Test'},{id:'K3',score:2,reason:'Язык',evidence:'Test'}],summary:'Test',nextStep:'Test',needsReview:false,nonproductive:false})}]}]}));
 try{const r=await evaluate({taskId:'author-ege-email-0',kind:'writing',text:Array(100).fill('Test').join(' ')},{OPENAI_API_KEY:'test-only'});assert.equal(r.result.score,0);assert.equal(r.needsReview,true)}finally{globalThis.fetch=old}
});
test('incomplete speech is rejected before model calls',async()=>{
 await assert.rejects(()=>evaluate({taskId:'fipi-oge-survey',kind:'speaking',audio:'AAAA',partDurations:[2]},{}),/Неполная попытка/);
});
test('unusable sound produces no numerical score, not zero',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({audioQuality:'unusable',transcript:'',observations:'Noisy',phrases:null})}}]}));
 const b=Buffer.alloc(120);b.write('RIFF');b.write('WAVE',8);
 try{const r=await evaluate({taskId:'fipi-ege-read',kind:'speaking',audio:b.toString('base64'),partDurations:[8]},{OPENAI_API_KEY:'test-only'});assert.equal(r.result.score,null);assert.equal(r.needsReview,true)}finally{globalThis.fetch=old}
});
test('global quota is shared and limits visitors',async()=>{
 const store=new Map();const q=new Quota({storage:{transaction:fn=>fn({get:k=>store.get(k),put:(k,v)=>store.set(k,v)})}});
 const check=visitor=>q.fetch(new Request('https://quota',{method:'POST',body:JSON.stringify({day:'2026-11-04',visitor,daily:2,perVisitor:1})})).then(r=>r.json());
 assert.equal((await check('a')).allowed,true);assert.equal((await check('a')).allowed,false);assert.equal((await check('b')).allowed,true);assert.equal((await check('c')).allowed,false);
});
