const express = require('express');
const router = express.Router();
const Showtime = require('../models/showtime');

// GET all showtimes for a specific movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const showtimes = await Showtime.find({ movieId: req.params.movieId }).populate('movieId');
    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new showtime (for admin/testing use)
router.post('/', async (req, res) => {
  try {
    const newShowtime = new Showtime(req.body);
    const savedShowtime = await newShowtime.save();
    res.status(201).json(savedShowtime);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate('movieId');
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });
    res.json(showtime);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;