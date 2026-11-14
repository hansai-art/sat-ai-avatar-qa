import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {rankQuestions} from '../src/lib/rank.mjs';
const audit=JSON.parse(fs.readFileSync('docs/content-source-audit.json','utf8'));
const questions=new Map(fs.readdirSync('src/content/questions').filter(f=>f.endsWith('.md')).map(f=>{
 const raw=fs.readFileSync('src/content/questions/'+f,'utf8');
 const data=Object.fromEntries(raw.split('---')[1].trim().split('\n').map(line=>{const p=line.indexOf(': ');return [line.slice(0,p),JSON.parse(line.slice(p+2))];}));
 return [f.slice(0,-3),data];
}));
test('全部來源紀錄與拆題均有去向，FAQ 可反查來源',()=>{
 assert.equal(audit.records.length,audit.summary.sourceRecords);
 assert.deepEqual(audit.records.map(r=>r.recordId),Array.from({length:66},(_,i)=>'Q'+String(i+1).padStart(3,'0')));
 assert.equal(audit.records.reduce((n,r)=>n+r.subquestions.length,0),audit.summary.mappedSubquestions);
 assert.equal(questions.size,audit.summary.publishedQuestions);
 for(const r of audit.records){
  assert.match(r.sha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(r.questions,[...new Set(r.subquestions.map(s=>s.questionId))]);
  if(!r.subquestions.length)assert.match(r.status,/支持或稱讚|解決回報/);
  else assert.equal(r.status,'已全部對應');
  for(const part of r.subquestions){
   const q=questions.get(part.questionId);assert.ok(q,part.questionId);
   assert.ok(q.sourceRefs.some(s=>s.recordId===r.recordId&&s.part===part.part&&s.askedAt===r.date),r.recordId+' '+part.part);
  }
 }
 const classroom=audit.classroomImports;
 assert.equal(classroom.records.length,classroom.summary.threadsReviewed);
 assert.deepEqual([...new Set(classroom.records.map(r=>r.page))],classroom.pagesReviewed);
 assert.equal(classroom.records.reduce((n,r)=>n+r.screenshotRefs,0),classroom.summary.screenshotRefsInExports);
 const classroomById=new Map(classroom.records.map(record=>[record.recordId,record]));
 assert.equal(classroomById.size,classroom.records.length);
 for(const r of classroom.records){
  assert.ok(r.replyDates.length,r.recordId);
  assert.ok(r.subquestions.length,r.recordId);
  for(const part of r.subquestions){
   const q=questions.get(part.questionId);
   assert.ok(q?.sourceRefs.some(s=>s.recordId===r.recordId&&s.part===part.part&&s.askedAt===r.date),r.recordId+' '+part.part);
  }
 }
 for(const [id,q] of questions){
  assert.equal(q.publication,'published');assert.equal(q.questionOrigin,'asked');
  assert.ok(q.askedBy.every(x=>x.name==='學員提問'));
  for(const s of q.sourceRefs.filter(s=>s.recordId.startsWith('Q'))){
   const r=audit.records.find(r=>r.recordId===s.recordId);
   assert.ok(r?.subquestions.some(p=>p.questionId===id&&p.part===s.part),id+' '+s.recordId);
  }
  for(const s of q.sourceRefs.filter(s=>s.recordId.startsWith('CLASS-')&&!audit.legacyRecords.some(r=>r.recordId===s.recordId))){
   const r=classroomById.get(s.recordId);
   assert.ok(r?.subquestions.some(p=>p.questionId===id&&p.part===s.part),id+' '+s.recordId);
  }
 }
 for(const r of audit.publicImports.records){
  assert.match(r.recordId,/^PUB-\d{2}$/);
  for(const part of r.subquestions){
   const q=questions.get(part.questionId);assert.ok(q,part.questionId);
   assert.ok(q.sourceRefs.some(s=>s.recordId===r.recordId&&s.part===part.part&&s.askedAt===r.date),r.recordId+' '+part.part);
  }
 }
 assert.deepEqual(audit.followupsPending,[]);
});
test('前十題優先處理跟課障礙，HTML 重複保留別名但不另算人數',()=>{
 const first=[...questions].sort((a,b)=>a[1].faqOrder-b[1].faqOrder).slice(0,10).map(([id])=>id);
 assert.deepEqual(first,audit.priorityQuestionIds);
 assert.equal(new Set([...questions.values()].map(q=>q.faqOrder)).size,questions.size);
 for(const record of audit.legacyRecords.filter(r=>r.canonicalRecord))assert.ok(audit.records.some(r=>r.recordId===record.canonicalRecord));
});
test('題目順序與首頁前十題符合實際留言串數統計，新增題目後要重跑 npm run rank',()=>{
 const {order,starters,counts}=rankQuestions(audit,questions);
 assert.deepEqual([...questions].sort((a,b)=>a[1].faqOrder-b[1].faqOrder).map(([id])=>id),order);
 assert.deepEqual(audit.priorityQuestionIds,starters);
 for(const id of order)assert.deepEqual(audit.askCounts[id],{total:counts.get(id).total,afterOpen:counts.get(id).afterOpen},id);
 assert.ok(!Object.keys(audit.askCounts).some(id=>!questions.has(id)));
});
