import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import './Home.css';

const currentYear = new Date().getFullYear();

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/movies')
      .then(({ data }) => setMovies(data))
      .catch((requestError) => {
        console.error('Unable to load movies:', requestError);
        setError('We couldn’t connect to the movie list. Please check that the server is running and try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <p className="home-eyebrow"><span /> THE BIG SCREEN IS CALLING</p>
          <h1>Make it a<br />movie night.</h1>
          <p className="home-hero__description">
            Find your next favorite, pick your seats, and settle in. Great stories are better together.
          </p>
          <a className="home-hero__button" href="#now-showing">
            Explore movies <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="home-hero__art" aria-hidden="true">
          <div className="home-hero__orb home-hero__orb--one" />
          <div className="home-hero__orb home-hero__orb--two" />
          <div className="home-ticket">
            <span className="home-ticket__top">TONIGHT’S PLAN</span>
            <span className="home-ticket__icon">🎟️</span>
            <strong>Good seats.<br />Great movie.</strong>
            <span className="home-ticket__bottom">YOUR NEXT FAVORITE AWAITS</span>
          </div>
        </div>
      </section>

      <section className="home-movies" id="now-showing">
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">FIND YOUR FRONT ROW</p>
            <h2>Now showing</h2>
          </div>
          {!loading && !error && (
            <span className="home-movie-count">{movies.length} {movies.length === 1 ? 'movie' : 'movies'}</span>
          )}
        </div>

        {loading ? (
          <div className="home-feedback" role="status">
            <span className="home-spinner" aria-hidden="true" />
            <p>Finding what’s on…</p>
          </div>
        ) : error ? (
          <div className="home-feedback home-feedback--error" role="alert">
            <span className="home-feedback__icon" aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="home-feedback">
            <span className="home-feedback__icon" aria-hidden="true">🎬</span>
            <h3>No movies just yet</h3>
            <p>Check back soon for the latest screenings.</p>
          </div>
        ) : (
          <div className="home-movie-grid">
            {movies.map((movie) => (
              <article className="home-movie-card" key={movie._id}>
                <Link
                  className="home-movie-card__poster-link"
                  to={`/movie/${movie._id}`}
                  aria-label={`View showtimes for ${movie.title}`}
                >
                  {movie.posterUrl ? (
                    <img className="home-movie-card__poster" src={movie.posterUrl} alt={`${movie.title} poster`} />
                  ) : (
                    <div className="home-movie-card__poster home-movie-card__poster--empty" aria-hidden="true">🎬</div>
                  )}
                  <span className="home-movie-card__overlay">See showtimes <span aria-hidden="true">→</span></span>
                </Link>
                <div className="home-movie-card__info">
                  <h3>{movie.title}</h3>
                  <p>
                    {Array.isArray(movie.genre) && movie.genre.length
                      ? movie.genre.join(' · ')
                      : 'Now showing'}
                    {movie.duration ? ` · ${movie.duration} min` : ''}
                  </p>
                  <Link className="home-movie-card__link" to={`/movie/${movie._id}`}>
                    Choose a showtime <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <footer className="home-footer">
        <span>© {currentYear} CinemaBooking</span>
        <span>Make every movie night count.</span>
      </footer>
    </main>
  );
}
