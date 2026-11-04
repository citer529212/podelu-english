/* Shared, deterministic planning rules. No exam score prediction. */
(function(root){
'use strict';
const DAY=86400000;
function dayKey(now=Date.now()){const d=new Date(now);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function blockHistory(state,id){return (state.blockAttempts||[]).filter(a=>a.exam===state.exam&&a.id===id).sort((a,b)=>a.at-b.at)}
function blockDue(state,item,now){const last=blockHistory(state,item.id).at(-1);return !!last&&last.at+(last.score/last.max<.8?DAY:3*DAY)<=now}
function makePlan(state,catalogue,bank,now=Date.now()){
 const exam=state.exam,available=catalogue.items.filter(t=>t.exam===exam),tasks=[];
 const own=(state.attempts||[]).filter(a=>a.exam===exam),latest=new Map(own.map(a=>[a.id,a]));
 const due=bank.filter(q=>latest.get(q.id)?.due<=now);
 tasks.push({kind:'micro',target:due.length?'review':'mixed',title:due.length?'Вернись к знакомым заданиям':'Разогрей базовые навыки',reason:due.length?`${due.length} заданий подошли к повторению после паузы.`:'Короткая самостоятельная практика с разбором каждого ответа.',minutes:5});
 if(state.minutes!==5){
 const dueBlocks=available.filter(t=>blockDue(state,t,now));
 const unseen=available.filter(t=>!blockHistory(state,t.id).length);
 const averages=new Map();for(const t of available){const a=blockHistory(state,t.id).at(-1);if(a){const v=averages.get(t.block)||[];v.push(a.score/a.max);averages.set(t.block,v)}}
 const weakness=t=>{const a=averages.get(t.block);return a?a.reduce((a,b)=>a+b,0)/a.length:.5};
 const chosen=dueBlocks.sort((a,b)=>blockHistory(state,a.id).at(-1).at-blockHistory(state,b.id).at(-1).at)[0]||unseen.sort((a,b)=>weakness(a)-weakness(b))[0]||available.sort((a,b)=>(blockHistory(state,a.id).at(-1)?.at||0)-(blockHistory(state,b.id).at(-1)?.at||0))[0];
 if(chosen)tasks.push({kind:'block',target:chosen.id,title:chosen.title,reason:dueBlocks.length?'Проверь знакомое задание после паузы.':'Новый контекст; приоритет у блока, в котором больше трудностей.',minutes:7});
 const prior=[...(state.assessments||[]),...(state.learningCompletions||[])].filter(a=>a.exam===exam).sort((a,b)=>a.at-b.at),last=prior.at(-1),kind=(last?.kind==='speaking'||catalogue.speaking?.some(t=>t.id===last?.taskId))?'writing':'speaking';
 tasks.push({kind:kind,target:kind,title:kind==='writing'?'Напиши самостоятельный ответ':'Сформулируй ответ вслух',reason:kind==='writing'?'Сохрани черновик и проверь его по рубрике.':'Запиши ответ и переслушай: что можно выразить точнее?',minutes:state.minutes===40?15:7});
 }
 return {exam,day:dayKey(now),minutes:state.minutes,createdAt:now,tasks};
}
function taskDone(task,plan,state){
 const recent=a=>a.exam===plan.exam&&a.at>=plan.createdAt;
 if(task.kind==='micro')return (state.sessions||[]).some(recent);
 if(task.kind==='block')return (state.blockAttempts||[]).some(a=>recent(a)&&a.id===task.target);
 return (state.learningCompletions||[]).some(a=>recent(a)&&a.kind===task.kind);
}
function classifyAudio(path){const s=String(path).replace(/\\/g,'/');const name=s.split('/').at(-1);const m=/^(\d{1,2})\.mp3$/i.exec(name);if(!m||+m[1]<1||+m[1]>20)return null;const kind=/Аудирование\//i.test(s)?'listening':/Устная часть\//i.test(s)?'speaking':null;return kind?{id:`${kind}-${+m[1]}`,kind,variant:+m[1]}:null}
const api={dayKey,makePlan,taskDone,blockDue,classifyAudio};
if(typeof module!=='undefined')module.exports=api;else root.Learning=api;
})(typeof window!=='undefined'?window:globalThis);
