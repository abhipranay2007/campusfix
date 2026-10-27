const mongoose = require('mongoose');
const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ['CREATED', 'SUPPORT_ADDED', 'SUPPORT_REMOVED', 'STATUS_CHANGED', 'COMMENT'], required: true },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromStatus: { type: String }, toStatus: { type: String },
}, { timestamps: true });
const issueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 15, maxlength: 3000 },
  category: { type: String, enum: ['PLUMBING','ELECTRICITY','INTERNET','CLEANLINESS','FURNITURE','SAFETY','OTHER'], required: true },
  location: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  severity: { type: String, enum: ['LOW','MEDIUM','HIGH','CRITICAL'], required: true },
  status: { type: String, enum: ['SUBMITTED','UNDER_REVIEW','IN_PROGRESS','RESOLVED','REJECTED'], default: 'SUBMITTED', index: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  supporters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  activity: { type: [activitySchema], default: [] },
  resolutionReason: { type: String, maxlength: 500 },
}, { timestamps: true });
issueSchema.index({ category: 1, location: 1, severity: 1, status: 1, createdAt: -1 });
module.exports = mongoose.model('Issue', issueSchema);
