const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const User = require('../models/user');
const Showtime = require('../models/showtime');
const jwt = require('jsonwebtoken');
const { sendTicketConfirmation } = require('../services/emailService');

let stripeClient;
const getStripeClient = () => {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in server/.env.');
  }

  if (!stripeClient) {
    stripeClient = require('stripe')(apiKey);
  }

  return stripeClient;
};

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = verified; // contains { userId: ... }
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// POST a new booking
// router.post('/', async (req, res) => {
//   try {
//     const { showtimeId, seats, totalAmount } = req.body;

//     // For now, we can use a placeholder user ID until user authentication is added
//     const dummyUserId = '60c72b2f9b1d8b2ad48f1a2b'; 

//     const newBooking = new Booking({
//       userId: dummyUserId,
//       showtimeId,
//       seats,
//       totalAmount,
//       paymentStatus: 'Completed' // Simulating a successful payment for now
//     });

//     const savedBooking = await newBooking.save();
//     res.status(201).json(savedBooking);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

router.post('/', verifyToken, async (req, res) => {
  try {
    const { showtimeId, seats, totalAmount } = req.body;

    const newBooking = new Booking({
      userId: req.user.userId, // Comes from the logged-in user's token
      showtimeId,
      seats,
      totalAmount,
      paymentStatus: 'Completed'
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all bookings for the logged-in user
router.get('/user', verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId })
      .populate({
        path: 'showtimeId',
        populate: { path: 'movieId' } // Populate showtime and nested movie details
      })
      .sort({ createdAt: -1 }); // Show newest bookings first

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const { showtimeId, seats, totalAmount } = req.body;

    const session = await getStripeClient().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Cinema Ticket Booking',
              description: `Seats: ${seats.join(', ')}`,
            },
            unit_amount: Math.round(totalAmount * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Pass booking metadata so we can save it after successful payment
      metadata: {
        userId: req.user.userId,
        showtimeId: showtimeId,
        seats: JSON.stringify(seats),
        totalAmount: totalAmount
      },
      success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/showtime/${showtimeId}/seats`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CONFIRM PAYMENT & SAVE BOOKING
router.post('/confirm-booking', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'A Stripe checkout session ID is required.' });
    }

    // Retrieve the session from Stripe to verify payment
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const { userId, showtimeId, seats: seatsJson } = session.metadata || {};
    if (!userId || !showtimeId || !seatsJson) {
      return res.status(400).json({ error: 'Stripe session is missing booking details.' });
    }
    if (String(userId) !== String(req.user.userId)) {
      return res.status(403).json({ error: 'This checkout session belongs to another user.' });
    }

    let parsedSeats;
    try {
      parsedSeats = JSON.parse(seatsJson);
    } catch {
      return res.status(400).json({ error: 'Stripe session contains invalid seat details.' });
    }

    if (!Array.isArray(parsedSeats) || parsedSeats.length === 0 || !parsedSeats.every((seat) => typeof seat === 'string')) {
      return res.status(400).json({ error: 'Stripe session contains invalid seat details.' });
    }

    const totalAmount = session.amount_total / 100;
    if (!Number.isFinite(totalAmount)) {
      return res.status(400).json({ error: 'Stripe session contains an invalid payment amount.' });
    }

    let booking = await Booking.findOne({ stripeSessionId: session.id });
    if (!booking) {
      try {
        booking = await Booking.create({
          userId,
          showtimeId,
          seats: parsedSeats,
          totalAmount,
          stripeSessionId: session.id,
          paymentStatus: 'Completed',
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        booking = await Booking.findOne({ stripeSessionId: session.id });
        if (!booking) throw error;
      }
    }

    const retryBefore = new Date(Date.now() - 5 * 60 * 1000);
    const emailClaim = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        $or: [
          { confirmationEmailStatus: 'pending' },
          {
            confirmationEmailStatus: 'sending',
            confirmationEmailAttemptedAt: { $lt: retryBefore },
          },
        ],
      },
      {
        $set: {
          confirmationEmailStatus: 'sending',
          confirmationEmailAttemptedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!emailClaim) {
      booking = await Booking.findById(booking._id);
      return res.json({ booking, emailSent: booking.confirmationEmailStatus === 'sent' });
    }

    try {
      const [user, showtime] = await Promise.all([
        User.findById(userId),
        Showtime.findById(showtimeId).populate('movieId'),
      ]);

      if (!user || !showtime || !showtime.movieId) {
        throw new Error('Booking customer or showtime details could not be found for the ticket email.');
      }

      await sendTicketConfirmation({
        email: user.email,
        name: user.name,
        movieTitle: showtime.movieId.title,
        showtime,
        seats: booking.seats,
        totalAmount: booking.totalAmount,
      });

      booking = await Booking.findByIdAndUpdate(
        booking._id,
        { $set: { confirmationEmailStatus: 'sent' } },
        { new: true },
      );
      return res.status(201).json({ booking, emailSent: true });
    } catch (emailError) {
      console.error('Ticket confirmation email failed:', emailError);
      booking = await Booking.findByIdAndUpdate(
        booking._id,
        {
          $set: { confirmationEmailStatus: 'pending' },
          $unset: { confirmationEmailAttemptedAt: 1 },
        },
        { new: true },
      );
      return res.json({ booking, emailSent: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;