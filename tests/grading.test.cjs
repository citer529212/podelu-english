const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../grading.js');
const words=n=>Array(n).fill('word').join(' ');
test('official short answers: spelling and extra punctuation are not silently corrected',()=>{
 assert.equal(F.shortScore({answers:['was founded']},'WASFOUNDED').score,1);
 assert.equal(F.shortScore({answers:['was founded']},'was founded.').score,0);
 assert.equal(F.shortScore({answers:['children']},'childrens').score,0);
});
test('EGE matching deducts one per incorrect position, not one per pair of errors',()=>{
 const task={key:'763152',max:2};
 assert.equal(F.shortScore(task,'763152').score,2);
 assert.equal(F.shortScore(task,'763153').score,1);
 assert.equal(F.shortScore(task,'763133').score,0);
 assert.equal(F.shortScore(task,'7631527').score,0);
 assert.equal(F.shortScore({key:'2385416',max:3},'238541').score,2);
});
test('OGE matching has a different maximum',()=>{
 assert.equal(F.shortScore({key:'32614',max:5},'32611').score,4);
 assert.equal(F.shortScore({key:'574162',max:6},'574162').score,6);
});
test('word counting includes greeting, signature, contractions, hyphens, grouped numerals and percentages',()=>{
 assert.equal(F.wordTokens("Dear Sam, I'm an English-speaking student. 126 204 people chose 25 %. UK. Best wishes, Alex").length,14);
 assert.equal(F.wordTokens('twenty five twenty-five cannot can’t CD-rom').length,6);
});
for(const [key,min,upper,cut] of [['oge-writing-35',90,132,120],['ege-writing-37',90,154,140],['ege-writing-38',180,275,250]]){
 test(key+' enforces exact lower/upper boundaries',()=>{
  assert.equal(F.wordCheck(words(min-1),key).zero,true);
  assert.equal(F.wordCheck(words(min),key).zero,false);
  assert.equal(F.wordCheck(words(upper),key).trimmed,false);
  const trimmed=F.wordCheck(words(upper+1),key);assert.equal(trimmed.trimmed,true);assert.equal(F.wordTokens(trimmed.evaluatedText).length,cut);
 });
}
test('cutoff preserves original character offsets around grouped numerals',()=>{
 const text='126 204 '+words(154);const c=F.wordCheck(text,'ege-writing-37');assert.equal(c.count,155);assert.equal(F.wordTokens(c.evaluatedText).length,140);assert.ok(c.evaluatedText.startsWith('126 204 '));
});
test('K1 zero overrides all other criteria',()=>{
 assert.equal(F.assess('ege-writing-37',{K1:0,K2:2,K3:2},{text:words(110)}).score,0);
 assert.equal(F.assess('oge-writing-35',{K1:0,K2:2,K3:3,K4:2},{text:words(110)}).score,0);
 assert.equal(F.assess('ege-speaking-4',{K1:0,K2:3,K3:3}).score,0);
});
test('missing and null criteria remain ungraded',()=>{
 const r=F.assess('ege-speaking-4',{K1:4,K2:3,K3:null});assert.equal(r.score,null);assert.equal(r.complete,false);assert.deepEqual(r.missing,['K3']);
});
test('monologue phrase zero gates and maximum totals differ by exam',()=>{
 assert.equal(F.assess('oge-speaking-3',{K1:3,K2:2,K3:2},{phrases:5}).score,0);
 assert.equal(F.assess('ege-speaking-4',{K1:4,K2:3,K3:3},{phrases:7}).score,0);
 assert.equal(F.assess('oge-speaking-3',{K1:3,K2:2,K3:2}).score,7);
 assert.equal(F.assess('ege-speaking-4',{K1:4,K2:3,K3:3}).score,10);
});
test('invalid criterion scores cannot enter totals',()=>{
 assert.throws(()=>F.assess('ege-writing-37',{K1:2,K2:3,K3:2},{text:words(120)}));
 assert.throws(()=>F.assess('ege-speaking-1',{P:.5}));
 for(const r of Object.values(F.rubrics))assert.equal(r.criteria.reduce((n,c)=>n+c.max,0),r.max);
});

test('word cutoff preserves punctuation after the last evaluated word',()=>{
 const text=words(139)+' final. '+words(20);const result=F.wordCheck(text,'ege-writing-37');assert.equal(result.trimmed,true);assert.ok(result.evaluatedText.trimEnd().endsWith('final.'));assert.equal(F.wordTokens(result.evaluatedText).length,140);
});
