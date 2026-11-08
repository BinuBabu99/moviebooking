const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  screenNumber: { type: Number, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g., "07:30 PM"
  ticketPrice: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Showtime', showtimeSchema);