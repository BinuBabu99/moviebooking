const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
  seats: [{ type: String }],
  totalAmount: { type: Number, required: true },
  stripeSessionId: { type: String, unique: true, sparse: true },
  confirmationEmailStatus: {
    type: String,
    enum: ['pending', 'sending', 'sent'],
    default: 'pending',
  },
  confirmationEmailAttemptedAt: { type: Date },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);