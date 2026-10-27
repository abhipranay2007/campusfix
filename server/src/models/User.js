const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['STUDENT', 'STAFF'], default: 'STUDENT', immutable: true },
}, { timestamps: true });
userSchema.set('toJSON', { transform(_doc, ret) { delete ret.passwordHash; delete ret.__v; return ret; } });
module.exports = mongoose.model('User', userSchema);
