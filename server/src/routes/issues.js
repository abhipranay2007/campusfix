const express = require('express');
const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const { scorePriority, priorityBand } = require('../utils/priority');
const { canTransition } = require('../utils/transitions');
const categories = ['PLUMBING','ELECTRICITY','INTERNET','CLEANLINESS','FURNITURE','SAFETY','OTHER'];
const severities = ['LOW','MEDIUM','HIGH','CRITICAL'];
const statuses = ['SUBMITTED','UNDER_REVIEW','IN_PROGRESS','RESOLVED','REJECTED'];
function issueRoutes({ auth }) {
  const router = express.Router(); router.use(auth.authenticate);
  const decorate = (doc, userId) => {
    const issue = doc.toObject ? doc.toObject() : doc;
    issue.supportCount = issue.supporters.length;
    issue.supportedByMe = issue.supporters.some(id => String(id) === String(userId));
    issue.priorityScore = scorePriority(issue); issue.priorityBand = priorityBand(issue.priorityScore);
    delete issue.supporters;
    return issue;
  };
  router.get('/', async (req, res, next) => {
    try {
      const query = {};
      if (req.query.scope === 'mine') query.creator = req.user.id;
      if (req.query.scope === 'community') query.creator = { $ne: req.user._id };
      for (const key of ['category','severity','status']) if (req.query[key] && (key === 'category' ? categories : key === 'severity' ? severities : statuses).includes(req.query[key])) query[key] = req.query[key];
      if (req.query.location) query.location = { $regex: String(req.query.location).slice(0,80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      if (req.query.search) { const term = String(req.query.search).slice(0,80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); query.$or = [{ title: { $regex: term, $options: 'i' } }, { description: { $regex: term, $options: 'i' } }]; }
      const docs = await Issue.find(query).populate('creator','name').lean();
      const items = docs.map(d => decorate(d, req.user.id));
      if (req.query.sort === 'priority') items.sort((a,b) => b.priorityScore - a.priorityScore || b.createdAt-a.createdAt);
      else items.sort((a,b) => b.createdAt-a.createdAt);
      res.json({ issues: items });
    } catch (err) { next(err); }
  });
  router.post('/', async (req, res, next) => {
    try {
      const b = req.body || {};
      if (typeof b.title !== 'string' || b.title.trim().length < 5 || b.title.trim().length > 120) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Title must be 5–120 characters.' } });
      if (typeof b.description !== 'string' || b.description.trim().length < 15 || b.description.trim().length > 3000) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Description must be 15–3000 characters.' } });
      if (!categories.includes(b.category)) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose a valid issue category.' } });
      if (!severities.includes(b.severity)) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose a valid severity.' } });
      if (typeof b.location !== 'string' || b.location.trim().length < 2 || b.location.trim().length > 120) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Location must be 2–120 characters.' } });
      const issue = await Issue.create({ title:b.title.trim(), description:b.description.trim(), category:b.category, severity:b.severity, location:b.location.trim(), creator:req.user._id, activity:[{ type:'CREATED', message:'Issue submitted.', actor:req.user._id }] });
      await issue.populate('creator','name'); res.status(201).json({ issue:decorate(issue,req.user.id) });
    } catch (err) { next(err); }
  });
  router.get('/:id', async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error:{code:'INVALID_ID',message:'The supplied identifier is invalid.'} });
      const issue = await Issue.findById(req.params.id).populate('creator','name').populate('activity.actor','name role');
      if (!issue) return res.status(404).json({ error:{code:'NOT_FOUND',message:'Issue not found.'} });
      res.json({ issue:decorate(issue,req.user.id) });
    } catch (err) { next(err); }
  });
  router.post('/:id/support', async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error:{code:'INVALID_ID',message:'The supplied identifier is invalid.'} });
      const issue = await Issue.findById(id);
      if (!issue) return res.status(404).json({ error:{code:'NOT_FOUND',message:'Issue not found.'} });
      if (['RESOLVED','REJECTED'].includes(issue.status)) return res.status(409).json({ error:{code:'ISSUE_CLOSED',message:'Closed issues can no longer receive support.'} });
      if (String(issue.creator) === String(req.user.id)) return res.status(400).json({ error:{code:'SELF_SUPPORT',message:'You cannot support your own report.'} });
      if (issue.supporters.some(s => String(s) === String(req.user.id))) return res.status(409).json({ error:{code:'ALREADY_SUPPORTED',message:'You already support this issue.'} });
      const result = await Issue.updateOne({ _id:id, creator:{$ne:req.user._id}, supporters:{$ne:req.user._id} }, { $addToSet:{supporters:req.user._id}, $push:{activity:{type:'SUPPORT_ADDED',message:'A student supported this issue.',actor:req.user._id}} });
      if (!result.modifiedCount) return res.status(409).json({ error:{code:'ALREADY_SUPPORTED',message:'This issue changed; refresh and try again.'} });
      res.json({ message:'Support added.' });
    } catch (err) { next(err); }
  });
  router.delete('/:id/support', async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error:{code:'INVALID_ID',message:'The supplied identifier is invalid.'} });
      const issue = await Issue.findById(req.params.id);
      if (!issue) return res.status(404).json({ error:{code:'NOT_FOUND',message:'Issue not found.'} });
      if (!issue.supporters.some(s => String(s) === String(req.user.id))) return res.status(409).json({ error:{code:'NOT_SUPPORTED',message:'You do not currently support this issue.'} });
      const result=await Issue.updateOne({ _id:req.params.id, supporters:req.user._id }, { $pull:{supporters:req.user._id}, $push:{activity:{type:'SUPPORT_REMOVED',message:'A student removed their support.',actor:req.user._id}} });
      if(!result.modifiedCount) return res.status(409).json({error:{code:'NOT_SUPPORTED',message:'Your support was already removed. Refresh and try again.'}});
      res.json({ message:'Support removed.' });
    } catch (err) { next(err); }
  });
  router.patch('/:id/status', auth.staffOnly, async (req, res, next) => {
    try {
      const { status, comment } = req.body || {};
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error:{code:'INVALID_ID',message:'The supplied identifier is invalid.'} });
      if (!statuses.includes(status)) return res.status(400).json({ error:{code:'VALIDATION_ERROR',message:'Choose a valid status.'} });
      if (comment !== undefined && (typeof comment !== 'string' || comment.trim().length > 500)) return res.status(400).json({ error:{code:'VALIDATION_ERROR',message:'Comment must be at most 500 characters.'} });
      if (status === 'REJECTED' && (!comment || comment.trim().length < 5)) return res.status(400).json({ error:{code:'REASON_REQUIRED',message:'Add a reason of at least 5 characters when rejecting an issue.'} });
      const issue = await Issue.findById(req.params.id);
      if (!issue) return res.status(404).json({ error:{code:'NOT_FOUND',message:'Issue not found.'} });
      if (!canTransition(issue.status,status)) return res.status(409).json({ error:{code:'INVALID_TRANSITION',message:`Cannot move an issue from ${issue.status} to ${status}.`} });
      const old = issue.status;
      const activity = [{type:'STATUS_CHANGED',message:comment?.trim() || `Status changed to ${status.replaceAll('_',' ').toLowerCase()}.`,actor:req.user._id,fromStatus:old,toStatus:status}];
      const update = { $set:{status}, $push:{activity:{$each:activity}} };
      if (status === 'REJECTED') update.$set.resolutionReason = comment.trim();
      const result = await Issue.updateOne({_id:issue._id,status:old},update);
      if (!result.modifiedCount) return res.status(409).json({error:{code:'CONCURRENT_UPDATE',message:'The issue changed while you were updating it. Refresh and try again.'}});
      const saved = await Issue.findById(issue._id).populate('creator','name').populate('activity.actor','name role');
      res.json({issue:decorate(saved,req.user.id)});
    } catch (err) { next(err); }
  });
  router.post('/:id/comments', auth.staffOnly, async (req,res,next) => {
    try {
      const { comment } = req.body || {};
      if (typeof comment !== 'string' || comment.trim().length < 2 || comment.trim().length > 500) return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'Comment must be 2–500 characters.'}});
      const issue = await Issue.findByIdAndUpdate(req.params.id,{$push:{activity:{type:'COMMENT',message:comment.trim(),actor:req.user._id}}},{new:true}).populate('creator','name').populate('activity.actor','name role');
      if (!issue) return res.status(404).json({error:{code:'NOT_FOUND',message:'Issue not found.'}});
      res.json({issue:decorate(issue,req.user.id)});
    } catch(err){next(err);}
  });
  return router;
}
module.exports = issueRoutes;
