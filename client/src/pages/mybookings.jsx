import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/bookings/user')
      .then(res => {
        setBookings(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching bookings:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading your bookings...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '20px', cursor: 'pointer' }}>← Back to Home</button>
      <h2>🎟️ My Ticket Bookings</h2>

      {bookings.length === 0 ? (
        <p>You haven't booked any tickets yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {bookings.map((booking) => {
            const showtime = booking.showtimeId;
            const movie = showtime?.movieId;
            return (
              <div key={booking._id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', background: '#fdfdfd', display: 'flex', gap: '20px', alignItems: 'center' }}>
                {movie?.posterUrl && (
                  <img src={movie.posterUrl} alt={movie.title} style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '4px' }} />
                )}
                <div style={{ flex: 1 }}>
                  <h3>{movie?.title || 'Movie Title Unavailable'}</h3>
                  <p><strong>Screen:</strong> {showtime?.screenNumber} | <strong>Time:</strong> {showtime?.time}</p>
                  <p><strong>Seats:</strong> {booking.seats.join(', ')}</p>
                  <p><strong>Total Paid:</strong> ${booking.totalAmount}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>Booked on: {new Date(booking.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span style={{ background: '#4CAF50', color: 'white', padding: '5px 10px', borderRadius: '4px', fontSize: '14px' }}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}