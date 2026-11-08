import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  
  // Form states for Movie
  const [movieData, setMovieData] = useState({
    title: '', description: '', duration: '', genre: '', posterUrl: '', releaseDate: ''
  });

  // Form states for Showtime
  const [showtimeData, setShowtimeData] = useState({
    movieId: '', screenNumber: 1, date: '', time: '', ticketPrice: 12
  });

  useEffect(() => {
    API.get('/movies')
      .then(res => setMovies(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...movieData,
        genre: movieData.genre.split(',').map(g => g.trim()),
        duration: Number(movieData.duration)
      };
      await API.post('/movies', formattedData);
      alert('Movie added successfully!');
      window.location.reload();
    } catch (err) {
      alert('Failed to add movie');
    }
  };

  const handleShowtimeSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/showtimes', showtimeData);
      alert('Showtime scheduled successfully!');
    } catch (err) {
      alert('Failed to schedule showtime');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '20px', cursor: 'pointer' }}>← Back to Home</button>
      <h2>⚙️ Admin Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px' }}>
        
        {/* Add Movie Form */}
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
          <h3>Add New Movie</h3>
          <form onSubmit={handleMovieSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input placeholder="Title" value={movieData.title} onChange={e => setMovieData({...movieData, title: e.target.value})} required style={{ padding: '8px' }} />
            <input placeholder="Description" value={movieData.description} onChange={e => setMovieData({...movieData, description: e.target.value})} required style={{ padding: '8px' }} />
            <input type="number" placeholder="Duration (mins)" value={movieData.duration} onChange={e => setMovieData({...movieData, duration: e.target.value})} required style={{ padding: '8px' }} />
            <input placeholder="Genres (comma separated)" value={movieData.genre} onChange={e => setMovieData({...movieData, genre: e.target.value})} required style={{ padding: '8px' }} />
            <input placeholder="Poster Image URL" value={movieData.posterUrl} onChange={e => setMovieData({...movieData, posterUrl: e.target.value})} required style={{ padding: '8px' }} />
            <input type="date" value={movieData.releaseDate} onChange={e => setMovieData({...movieData, releaseDate: e.target.value})} required style={{ padding: '8px' }} />
            <button type="submit" style={{ background: '#e50914', color: 'white', border: 'none', padding: '10px', cursor: 'pointer', borderRadius: '4px' }}>Add Movie</button>
          </form>
        </div>

        {/* Schedule Showtime Form */}
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
          <h3>Schedule Showtime</h3>
          <form onSubmit={handleShowtimeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select value={showtimeData.movieId} onChange={e => setShowtimeData({...showtimeData, movieId: e.target.value})} required style={{ padding: '8px' }}>
              <option value="">Select Movie</option>
              {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
            </select>
            <input type="number" placeholder="Screen Number" value={showtimeData.screenNumber} onChange={e => setShowtimeData({...showtimeData, screenNumber: e.target.value})} required style={{ padding: '8px' }} />
            <input type="date" value={showtimeData.date} onChange={e => setShowtimeData({...showtimeData, date: e.target.value})} required style={{ padding: '8px' }} />
            <input placeholder="Time (e.g. 07:30 PM)" value={showtimeData.time} onChange={e => setShowtimeData({...showtimeData, time: e.target.value})} required style={{ padding: '8px' }} />
            <input type="number" placeholder="Ticket Price ($)" value={showtimeData.ticketPrice} onChange={e => setShowtimeData({...showtimeData, ticketPrice: e.target.value})} required style={{ padding: '8px' }} />
            <button type="submit" style={{ background: '#333', color: 'white', border: 'none', padding: '10px', cursor: 'pointer', borderRadius: '4px' }}>Schedule Showtime</button>
          </form>
        </div>

      </div>
    </div>
  );
}