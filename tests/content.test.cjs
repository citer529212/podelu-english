const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const data=require('../content.json');const root=path.resolve(__dirname,'..');
test('all content IDs and answer keys are valid, provenance is explicit',()=>{
 const all=[...data.items,...data.writing,...data.speaking];assert.equal(new Set(all.map(x=>x.id)).size,all.length);
 for(const t of all){assert.ok(['ege','oge'].includes(t.exam));assert.ok(['author','official-demo'].includes(t.source.kind));if(t.source.kind==='official-demo')assert.ok(t.source.url.startsWith('https://doc.fipi.ru/'));else assert.equal(t.source.url,'');
  for(const q of t.questions||[]){assert.ok(q.text&&q.why);if(q.options)assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);else assert.ok(q.answers.length)}
  if(t.key){assert.match(t.key,/^\d+$/);assert.ok(t.key.length>t.max||t.key.length===t.max)}
  if(t.audio)assert.ok(fs.statSync(path.join(root,t.audio)).size>1000);
 }
 assert.equal(data.items.length,41);assert.equal(data.speaking.length,16);
});
test('speaking includes all task types and usable interview prompt assets',()=>{
 for(const exam of ['oge','ege']){const tasks=data.speaking.filter(t=>t.exam===exam);for(let n=1;n<=(exam==='ege'?4:3);n++)assert.ok(tasks.some(t=>t.task===n));
 for(const t of tasks){const oralQuestions=exam==='ege'&&t.task===3||exam==='oge'&&t.task===2;if(oralQuestions){assert.equal(t.parts.length,exam==='oge'?6:5);t.parts.forEach((_,i)=>assert.ok(fs.statSync(path.join(root,`assets/audio/prompt-${t.id}-${i}.mp3`)).size>1000))}if(exam==='ege'&&t.task===2){assert.equal(t.seconds,20);assert.equal(t.parts.length,4)}if(t.task===1)assert.equal(t.seconds,exam==='ege'?90:120);}
 }
});
test('official imported keys match checked demo answers',()=>{
 const find=id=>data.items.find(t=>t.id===id);assert.deepEqual(find('fipi-ege-corinth').questions.map(q=>q.answers),[['situated'],['first'],['was founded'],['became'],['have worked','have been working'],['looking']]);
 assert.equal(find('fipi-ege-audio-1').key,'763152');assert.equal(find('fipi-ege-audio-1').max,2);
 assert.deepEqual(find('fipi-oge-bolshoi').questions.map(q=>q.answers[0]),['went','most famous','knows','began','did not mind','were','its','was designed','had']);
});
