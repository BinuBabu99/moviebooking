import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import API from '../services/api';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await API.post('/auth/register', { name, email, password });
      navigate('/login', { state: { message: 'Your account is ready. Log in to continue.' } });
    } catch (requestError) {
      console.error('Unable to create account:', requestError);
      if (!requestError.response) {
        setError('We can’t reach the booking server. Make sure the backend is running and its MongoDB connection is configured.');
      } else if (requestError.response.status >= 500) {
        setError('The server couldn’t create your account. Check the backend logs and MongoDB connection, then try again.');
      } else {
        setError(requestError.response.data?.error || 'We couldn’t create your account. Please check your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-eyebrow">WELCOME TO THE SHOW</p>
        <h1>Create your account</h1>
        <p className="auth-description">Save your bookings and get ready for your next movie night.</p>
        <form className="auth-form" onSubmit={handleSignup}>
          <label htmlFor="signup-name">Your name</label>
          <input
            id="signup-name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <label htmlFor="signup-email">Email address</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </section>
    </main>
  );
}
