const test=require('node:test');const assert=require('node:assert/strict');const {scorePriority,priorityBand}=require('../src/utils/priority');const {canTransition}=require('../src/utils/transitions');
test('priority score is predictable and rewards severity, support, and unresolved age',()=>{
 const now=new Date('2026-10-27T00:00:00Z');
 const baseline={severity:'LOW',supporters:[],status:'SUBMITTED',createdAt:now};
 assert.equal(scorePriority(baseline,now),10);
 assert.equal(scorePriority({...baseline,severity:'CRITICAL'},now),40);
 assert.equal(scorePriority({...baseline,supporters:Array(12).fill('u')},now),30);
 assert.equal(scorePriority({...baseline,createdAt:new Date(now.getTime()-40*86400000)},now),25);
 assert.equal(scorePriority({...baseline,status:'RESOLVED',createdAt:new Date(now.getTime()-40*86400000)},now),10);
 assert.equal(priorityBand(52),'URGENT');assert.equal(priorityBand(35),'HIGH');assert.equal(priorityBand(20),'MEDIUM');assert.equal(priorityBand(19),'LOW');
});
test('status transitions allow only the intended workflow',()=>{
 assert.equal(canTransition('SUBMITTED','UNDER_REVIEW'),true);
 assert.equal(canTransition('UNDER_REVIEW','IN_PROGRESS'),true);
 assert.equal(canTransition('IN_PROGRESS','RESOLVED'),true);
 assert.equal(canTransition('SUBMITTED','RESOLVED'),false);
 assert.equal(canTransition('RESOLVED','IN_PROGRESS'),false);
 assert.equal(canTransition('UNKNOWN','SUBMITTED'),false);
});
