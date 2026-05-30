import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:  { type: String, required: true, trim: true },
  date:   { type: String, required: true },          // ISO date string e.g. "2025-07-10"
  type:   { type: String, default: 'other' },        // interview | deadline | contest | other
  note:   { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('Event', eventSchema)
