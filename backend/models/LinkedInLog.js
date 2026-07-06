import mongoose from 'mongoose'

const linkedInLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String, required: true,
    enum: { values: ['post', 'connection', 'message', 'application'], message: 'Invalid activity type' },
  },
  note:   { type: String, default: '' },
  date:   { type: String, default: () => new Date().toISOString() },
}, { timestamps: true })

export default mongoose.model('LinkedInLog', linkedInLogSchema)
