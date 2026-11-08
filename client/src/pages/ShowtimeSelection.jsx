import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function ShowtimeSelection() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState([]);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/showtimes/movie/${movieId}`)
      .then(res => {
        setShowtimes(res.data);
        if (res.data.length > 0) setMovie(res.data[0].movieId);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [movieId]);

  if (loading) return <div style={{ padding: '20px' }}>Loading showtimes...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', cursor: 'pointer' }}>← Back</button>
      {movie && <h1>Screening Times for: {movie.title}</h1>}

      {showtimes.length === 0 ? (
        <p>No showtimes scheduled for this movie yet.</p>
      ) : (
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '20px' }}>
          {showtimes.map((st) => (
            <div key={st._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', background: '#fff' }}>
              <p><strong>Screen:</strong> {st.screenNumber}</p>
              <p><strong>Date:</strong> {new Date(st.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {st.time}</p>
              <p><strong>Price:</strong> ${st.ticketPrice}</p>
              <button 
                onClick={() => navigate(`/showtime/${st._id}/seats`)}
                style={{ background: '#e50914', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', width: '100%', marginTop: '10px' }}
              >
                Select Seats
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}