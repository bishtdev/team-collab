// models/Org.js
// Organization = isolation boundary for one company.
// Each Org has its own members[] (SOLE role truth at org level),
// its own Teams/Projects/Invites (all carry orgId).
// Why slug: human URL (/org/company-a-x7k2) + unique even with duplicate names.
const mongoose = require('mongoose');

const orgMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // OWNER = company boss (creator). ADMIN manages people, MANAGER manages work.
    role: { type: String, enum: ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'], default: 'MEMBER' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [orgMemberSchema],
    plan: { type: String, default: 'trial' }, // stub for billing later
    settings: {
      allowMemberInvite: { type: Boolean, default: false },
      domainClaim: { type: String, default: null },
    },
  },
  { timestamps: true }
);

orgSchema.index({ ownerId: 1 });
orgSchema.index({ 'members.userId': 1 });

// Build slug like "company-a-x7k2" from name + 4 random chars.
// Why suffix: two companies named "Company A" don't collide.
orgSchema.statics.buildSlug = (name) => {
  const base = String(name || 'workspace')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'workspace';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
};

module.exports = mongoose.model('Org', orgSchema);
