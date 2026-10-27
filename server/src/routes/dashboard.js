const express = require('express');
const Issue = require('../models/Issue');
const { scorePriority, priorityBand } = require('../utils/priority');
function dashboardRoutes({auth}) {
 const router=express.Router(); router.use(auth.authenticate,auth.staffOnly);
 router.get('/',async(_req,res,next)=>{try{
  const issues=await Issue.find().populate('creator','name').sort({createdAt:-1}).lean();
  const open=issues.filter(i=>!['RESOLVED','REJECTED'].includes(i.status));
  const byCategory=Object.fromEntries(['PLUMBING','ELECTRICITY','INTERNET','CLEANLINESS','FURNITURE','SAFETY','OTHER'].map(c=>[c,issues.filter(i=>i.category===c).length]));
  const resolved=issues.filter(i=>i.status==='RESOLVED');
  const durations=resolved.map(i=>{
   const event=i.activity.find(a=>a.type==='STATUS_CHANGED'&&a.toStatus==='RESOLVED');
   return event?(new Date(event.createdAt)-new Date(i.createdAt))/3600000:null;
  }).filter(hours=>hours!==null&&hours>=0);
  const avgResolutionHours=durations.length?Math.round(durations.reduce((sum,hours)=>sum+hours,0)/durations.length):null;
  const highPriority=open.map(i=>({...i,supportCount:i.supporters.length,priorityScore:scorePriority(i),priorityBand:priorityBand(scorePriority(i))})).filter(i=>i.priorityBand==='HIGH'||i.priorityBand==='URGENT').sort((a,b)=>b.priorityScore-a.priorityScore).slice(0,5);
  const recentActivity=issues.flatMap(i=>i.activity.map(a=>({id:i._id,title:i.title,type:a.type,message:a.message,status:a.toStatus||i.status,createdAt:a.createdAt,actor:a.actor?.name}))).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6);
  res.json({metrics:{total:issues.length,open:open.length,inProgress:issues.filter(i=>i.status==='IN_PROGRESS').length,resolved:resolved.length,avgResolutionHours},byCategory,recentActivity,highPriority});
 }catch(err){next(err)}});
 return router;
}
module.exports=dashboardRoutes;
