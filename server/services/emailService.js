const nodemailer = require('nodemailer');

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  const port = Number(SMTP_PORT);

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !process.env.EMAIL_FROM || !Number.isInteger(port)) {
    throw new Error('Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM in server/.env.');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

const sendTicketConfirmation = async ({ email, name, movieTitle, showtime, seats, totalAmount }) => {
  const date = new Date(showtime.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const seatList = seats.join(', ');
  const safeName = escapeHtml(name);
  const safeMovieTitle = escapeHtml(movieTitle);
  const safeDate = escapeHtml(date);
  const safeTime = escapeHtml(showtime.time);
  const safeScreen = escapeHtml(showtime.screenNumber);
  const safeSeatList = escapeHtml(seatList);
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalAmount);

  await createTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Your tickets for ${movieTitle}`,
    text: [
      `Hello ${name},`,
      '',
      'Your payment was successful. Here are your ticket details:',
      `Movie: ${movieTitle}`,
      `Date: ${date}`,
      `Time: ${showtime.time}`,
      `Screen: ${showtime.screenNumber}`,
      `Seats: ${seatList}`,
      `Total paid: ${formattedAmount}`,
      '',
      'Thank you for booking with us.',
    ].join('\n'),
    html: `
      <h2>Booking confirmed</h2>
      <p>Hello ${safeName}, your payment was successful.</p>
      <ul>
        <li><strong>Movie:</strong> ${safeMovieTitle}</li>
        <li><strong>Date:</strong> ${safeDate}</li>
        <li><strong>Time:</strong> ${safeTime}</li>
        <li><strong>Screen:</strong> ${safeScreen}</li>
        <li><strong>Seats:</strong> ${safeSeatList}</li>
        <li><strong>Total paid:</strong> ${escapeHtml(formattedAmount)}</li>
      </ul>
      <p>Thank you for booking with us.</p>
    `,
  });
};

module.exports = { sendTicketConfirmation };
