import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // Added time field
  location: { type: String, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  capacity: { type: Number },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
}, {
  timestamps: true
});

export const Event = mongoose.model('Event', eventSchema);
