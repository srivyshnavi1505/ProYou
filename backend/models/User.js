import mongoose from 'mongoose'
import bcrypt   from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name:         { type: String, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: null },   // null for Google-only accounts
  googleId:     { type: String, default: null },    // Google sub ID
  avatar:       { type: String, default: null },    // Google profile picture
  role:         { type: String, default: 'SWE' },

  // Profile settings stored in DB
  githubUsername:     { type: String, default: '' },
  leetcodeUsername:   { type: String, default: '' },
  targetCompanies:    { type: [String], default: [] },
  emailNotifications: { type: Boolean, default: true },
}, { timestamps: true })

userSchema.methods.comparePassword = function (plain) {
  if (!this.passwordHash) return Promise.resolve(false)
  return bcrypt.compare(plain, this.passwordHash)
}

export default mongoose.model('User', userSchema)
