/**
 * One-time migration: merge the Google-created account into the
 * original email/password account, then delete the duplicate.
 *
 * Run once with:  node scripts/mergeGoogleAccount.js your@email.com
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../models/User.js'

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/mergeGoogleAccount.js your@email.com')
  process.exit(1)
}

await mongoose.connect(process.env.MONGODB_URI)
console.log('✅ Connected to MongoDB\n')

// Find all accounts with this email
const users = await User.find({ email }).lean()

if (users.length === 0) {
  console.error(`❌ No users found with email: ${email}`)
  process.exit(1)
}

if (users.length === 1) {
  console.log('ℹ️  Only one account found — nothing to merge.')
  console.log(users[0])
  process.exit(0)
}

console.log(`Found ${users.length} accounts with email: ${email}\n`)
users.forEach((u, i) => {
  console.log(`[${i}] id=${u._id}  googleId=${u.googleId || 'none'}  passwordHash=${u.passwordHash ? 'yes' : 'none'}  github=${u.githubUsername || '-'}  leetcode=${u.leetcodeUsername || '-'}`)
})

// The "primary" account is the one with a passwordHash OR the most data
const primary   = users.find(u => u.passwordHash) || users[0]
const duplicate = users.find(u => u._id.toString() !== primary._id.toString())

console.log(`\n→ Primary account (keeping):   ${primary._id}`)
console.log(`→ Duplicate account (deleting): ${duplicate._id}`)

// Copy googleId and avatar from duplicate to primary (if primary doesn't already have them)
const updates = {}
if (!primary.googleId && duplicate.googleId)   updates.googleId = duplicate.googleId
if (!primary.avatar  && duplicate.avatar)       updates.avatar   = duplicate.avatar

if (Object.keys(updates).length > 0) {
  await User.findByIdAndUpdate(primary._id, { $set: updates })
  console.log('\n✅ Linked Google ID to primary account:', updates)
} else {
  console.log('\nℹ️  No new Google data to copy.')
}

// Delete the duplicate
await User.findByIdAndDelete(duplicate._id)
console.log('✅ Deleted duplicate account')

console.log('\n🎉 Done! Sign in with Google now — it will use your original account with all saved data.')
await mongoose.disconnect()
