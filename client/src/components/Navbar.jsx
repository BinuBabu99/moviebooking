import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch (error) {
    console.error('Unable to read saved user information:', error);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="app-navbar">
      <Link className="app-navbar__brand" to="/" aria-label="CinemaBooking home">
        <span className="app-navbar__brand-icon" aria-hidden="true">▶</span>
        <span>Cinema<span className="app-navbar__brand-accent">Booking</span></span>
      </Link>

      <nav className="app-navbar__links" aria-label="Main navigation">
        <Link to="/">Movies</Link>
        {token && <Link to="/my-bookings">My tickets</Link>}
        {token && <Link to="/admin">Admin</Link>}
      </nav>

      <div className="app-navbar__actions">
        {token ? (
          <>
            <span className="app-navbar__greeting">Hi, {user?.name || 'there'}</span>
            <button className="app-navbar__button app-navbar__button--quiet" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link className="app-navbar__login" to="/login">Log in</Link>
            <Link className="app-navbar__button" to="/signup">Create account</Link>
          </>
        )}
      </div>
    </header>
  );
}
