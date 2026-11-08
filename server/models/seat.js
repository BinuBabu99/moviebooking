const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
  row: { type: String, required: true },     // e.g., 'A'
  number: { type: Number, required: true },  // e.g., 5
  isBooked: { type: Boolean, default: false },
  heldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null } // Optional: for temporary lock during checkout
}, { timestamps: true });

module.exports = mongoose.model('Seat', seatSchema);