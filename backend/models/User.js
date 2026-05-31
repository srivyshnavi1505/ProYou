import mongoose from 'mongoose'
import bcrypt   from 'bcryptjs'

const GMAIL_REGEX    = /^[a-zA-Z0-9._%+\-]+@gmail\.com$/i
const USERNAME_REGEX = /^[a-zA-Z0-9_\-\.]{1,39}$/  // GitHub/LeetCode valid chars

const userSchema = new mongoose.Schema({
  name: {
    type: String, trim: true,
    maxlength: [60, 'Name cannot exceed 60 characters'],
    validate: {
      validator: (v) => !v || v.trim().length >= 2,
      message: 'Name must be at least 2 characters',
    },
  },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    maxlength: [254, 'Email too long'],
    validate: {
      validator: (v) => GMAIL_REGEX.test(v),
      message: 'Only Gmail addresses (@gmail.com) are accepted',
    },
  },
  passwordHash: { type: String, default: null },
  googleId:     { type: String, default: null },
  avatar:       { type: String, default: null },
  role: {
    type: String, default: 'SWE',
    enum: {
      values: ['SWE', 'Backend', 'Full Stack', 'ML Engineer', 'PM', 'Data Analyst', 'DevOps', 'Frontend'],
      message: 'Invalid role selected',
    },
  },

  githubUsername: {
    type: String, default: '', trim: true,
    maxlength: [39, 'GitHub username cannot exceed 39 characters'],
    validate: {
      validator: (v) => !v || USERNAME_REGEX.test(v),
      message: 'Invalid GitHub username format',
    },
  },
  leetcodeUsername: {
    type: String, default: '', trim: true,
    maxlength: [39, 'LeetCode username cannot exceed 39 characters'],
    validate: {
      validator: (v) => !v || USERNAME_REGEX.test(v),
      message: 'Invalid LeetCode username format',
    },
  },
  targetCompanies: {
    type: [String], default: [],
    validate: {
      validator: (arr) => arr.length <= 10 && arr.every(c => c.length <= 50),
      message: 'Max 10 target companies, each under 50 characters',
    },
  },
  emailNotifications: { type: Boolean, default: true },

  resetToken:       { type: String, default: null },
  resetTokenExpiry: { type: Date,   default: null },

  lastPlacementScore: {
    total:       { type: Number, default: null },
    breakdown:   { type: mongoose.Schema.Types.Mixed, default: null },
    advice:      { type: [String], default: [] },
    dataWarning: { type: String, default: null },
    generatedAt: { type: Date,   default: null },
  },
}, { timestamps: true })

userSchema.methods.comparePassword = function (plain) {
  if (!this.passwordHash) return Promise.resolve(false)
  return bcrypt.compare(plain, this.passwordHash)
}

export default mongoose.model('User', userSchema)