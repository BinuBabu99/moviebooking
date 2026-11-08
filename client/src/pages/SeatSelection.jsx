import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../services/api';
import './SeatSelection.css';

const rows = ['A', 'B', 'C', 'D', 'E'];
const columns = [1, 2, 3, 4, 5, 6, 7, 8];

export default function SeatSelection() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [showtime, setShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    socket.emit('join_showtime', showtimeId);

    socket.on('seat_locked', ({ seatId }) => {
      setLockedSeats((previous) => previous.includes(seatId) ? previous : [...previous, seatId]);
    });
    socket.on('seat_unlocked', ({ seatId }) => {
      setLockedSeats((previous) => previous.filter((seat) => seat !== seatId));
    });
    socket.on('seats_expired', ({ seats }) => {
      setLockedSeats((previous) => previous.filter((seat) => !seats.includes(seat)));
    });
    socket.on('checkout_timeout', () => {
      setSelectedSeats([]);
      setTimeLeft(null);
      setBookingError('Your seat hold expired. Please select your seats again.');
    });

    API.get(`/showtimes/${showtimeId}`)
      .then(({ data }) => {
        setShowtime(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoadError('We couldn’t load this showtime. Please try again.');
        setLoading(false);
      });

    return () => {
      socket.off('seat_locked');
      socket.off('seat_unlocked');
      socket.off('seats_expired');
      socket.off('checkout_timeout');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showtimeId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return undefined;

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          setSelectedSeats([]);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const toggleSeat = (row, column) => {
    const seatId = `${row}-${column}`;
    if (lockedSeats.includes(seatId) || booking) return;

    let updatedSeats;
    if (selectedSeats.includes(seatId)) {
      updatedSeats = selectedSeats.filter((seat) => seat !== seatId);
      socketRef.current?.emit('unlock_seat', { showtimeId, seatId });
    } else {
      updatedSeats = [...selectedSeats, seatId];
      socketRef.current?.emit('lock_seat', { showtimeId, seatId });

      if (selectedSeats.length === 0) {
        setTimeLeft(300);
        socketRef.current?.emit('lock_seats_with_timer', { showtimeId, seats: updatedSeats });
      }
    }

    setSelectedSeats(updatedSeats);
    setBookingError('');

    if (updatedSeats.length === 0) {
      setTimeLeft(null);
      socketRef.current?.emit('clear_seat_timer', { showtimeId });
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0 || booking) return;

    setBooking(true);
    setBookingError('');
    try {
      const totalAmount = selectedSeats.length * ticketPrice;
      const { data } = await API.post('/bookings/create-checkout-session', {
        showtimeId,
        seats: selectedSeats,
        totalAmount,
      });
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setBookingError('We couldn’t start checkout. Please try again.');
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <main className="seat-page">
        <div className="seat-state" role="status">
          <span className="seat-spinner" aria-hidden="true" />
          <h1>Preparing your seats</h1>
          <p>Just a moment while we load the showtime.</p>
        </div>
      </main>
    );
  }

  if (loadError || !showtime) {
    return (
      <main className="seat-page">
        <div className="seat-state seat-state--error" role="alert">
          <span className="seat-state-icon" aria-hidden="true">!</span>
          <h1>Showtime unavailable</h1>
          <p>{loadError || 'We couldn’t find this showtime.'}</p>
          <button className="seat-button seat-button--secondary" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </main>
    );
  }

  const ticketPrice = showtime.ticketPrice || 10;
  const totalAmount = selectedSeats.length * ticketPrice;
  const movie = showtime.movieId;
  const showDate = showtime.date
    ? new Date(showtime.date).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : '';

  return (
    <main className="seat-page">
      <div className="seat-page__inner">
        <button className="seat-back" onClick={() => navigate(-1)}>
          <span aria-hidden="true">←</span> Back to showtimes
        </button>

        <header className="seat-header">
          <div className="seat-header__copy">
            <p className="seat-eyebrow">YOUR NIGHT AT THE MOVIES</p>
            <h1>Choose your seats</h1>
            <p className="seat-header__subtitle">Pick the perfect spot. Your seats are held while you check out.</p>
          </div>
          {timeLeft !== null && timeLeft > 0 && (
            <div className="seat-countdown" role="timer" aria-live="polite">
              <span className="seat-countdown__icon" aria-hidden="true">◷</span>
              <span>
                <strong>{formatTime(timeLeft)}</strong>
                <small>Time left to book</small>
              </span>
            </div>
          )}
        </header>

        <section className="seat-show-card" aria-label="Showtime details">
          {movie?.posterUrl ? (
            <img className="seat-show-card__poster" src={movie.posterUrl} alt={`${movie.title} poster`} />
          ) : (
            <div className="seat-show-card__poster seat-show-card__poster--empty" aria-hidden="true">🎬</div>
          )}
          <div className="seat-show-card__details">
            <span className="seat-show-card__label">NOW BOOKING</span>
            <h2>{movie?.title || 'Movie screening'}</h2>
            <p>{[showDate, showtime.time, `Screen ${showtime.screenNumber}`].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="seat-show-card__price">
            <strong>${Number(ticketPrice).toFixed(2)}</strong>
            <span>per ticket</span>
          </div>
        </section>

        <div className="seat-layout">
          <section className="seat-picker" aria-label="Select your seats">
            <div className="seat-picker__heading">
              <div>
                <p className="seat-eyebrow">THE AUDITORIUM</p>
                <h2>Choose your seats</h2>
              </div>
              <div className="seat-legend" aria-label="Seat legend">
                <span><i className="seat-legend__swatch seat-legend__swatch--available" />Available</span>
                <span><i className="seat-legend__swatch seat-legend__swatch--selected" />Selected</span>
                <span><i className="seat-legend__swatch seat-legend__swatch--locked" />Unavailable</span>
              </div>
            </div>

            <div className="seat-screen-wrap" aria-hidden="true">
              <div className="seat-screen">SCREEN</div>
              <span>All eyes this way</span>
            </div>

            <div className="seat-grid" role="group" aria-label="Seat map, rows A through E">
              {rows.map((row) => (
                <div className="seat-row" key={row}>
                  <span className="seat-row__label" aria-hidden="true">{row}</span>
                  {columns.map((column) => {
                    const seatId = `${row}-${column}`;
                    const isSelected = selectedSeats.includes(seatId);
                    const isLocked = lockedSeats.includes(seatId);

                    return (
                      <button
                        className={`seat ${isSelected ? 'seat--selected' : ''} ${isLocked ? 'seat--locked' : ''}`}
                        key={column}
                        type="button"
                        onClick={() => toggleSeat(row, column)}
                        disabled={isLocked || booking}
                        aria-label={`Row ${row}, seat ${column}${isSelected ? ', selected' : isLocked ? ', unavailable' : ', available'}`}
                        aria-pressed={isSelected}
                        title={`Row ${row}, seat ${column}`}
                      >
                        {column}
                      </button>
                    );
                  })}
                  <span className="seat-row__label" aria-hidden="true">{row}</span>
                </div>
              ))}
            </div>
            <p className="seat-picker__note">Tap a seat to select it. Tap again to remove it.</p>
          </section>

          <aside className="seat-summary" aria-label="Booking summary">
            <div className="seat-summary__top">
              <p className="seat-eyebrow">YOUR ORDER</p>
              <h2>Booking summary</h2>
            </div>
            <div className="seat-summary__body">
              <div className="seat-summary__line">
                <span>Selected seats</span>
                <strong>{selectedSeats.length}</strong>
              </div>
              <div className="seat-selected-list">
                {selectedSeats.length > 0 ? selectedSeats.map((seat) => (
                  <button
                    className="seat-chip"
                    key={seat}
                    type="button"
                    onClick={() => toggleSeat(seat.split('-')[0], Number(seat.split('-')[1]))}
                    aria-label={`Remove seat ${seat}`}
                    disabled={booking}
                  >
                    {seat}<span aria-hidden="true"> ×</span>
                  </button>
                )) : <span className="seat-summary__empty">No seats selected yet</span>}
              </div>
              <div className="seat-summary__line seat-summary__line--sub">
                <span>Ticket price</span>
                <span>${Number(ticketPrice).toFixed(2)} × {selectedSeats.length}</span>
              </div>
              <div className="seat-summary__total">
                <span>Total</span>
                <strong>${totalAmount.toFixed(2)}</strong>
              </div>

              {bookingError && <p className="seat-message seat-message--error" role="alert">{bookingError}</p>}

              <button
                className="seat-button seat-button--primary"
                type="button"
                onClick={handleBooking}
                disabled={selectedSeats.length === 0 || booking}
              >
                {booking ? (
                  <><span className="seat-spinner seat-spinner--small" aria-hidden="true" /> Connecting to checkout…</>
                ) : (
                  <>Continue to payment <span aria-hidden="true">→</span></>
                )}
              </button>
              <p className="seat-summary__secure">🔒 Secure checkout powered by Stripe</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
