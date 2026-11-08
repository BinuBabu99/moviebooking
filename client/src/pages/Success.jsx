import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../services/api';

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing your booking...');

  useEffect(() => {
    if (sessionId) {
      API.post('/bookings/confirm-booking', { sessionId })
        .then(({ data }) => {
          setStatus(data.emailSent
            ? 'Payment successful! Your tickets have been booked and emailed to you.'
            : 'Payment successful! Your booking is confirmed, but the confirmation email could not be sent. Refresh this page to retry.');
        })
        .catch(err => {
          console.error(err);
          setStatus('Error confirming booking, but payment was received.');
        });
    }
  }, [sessionId]);

  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Arial' }}>
      <h2>🎉 {status}</h2>
      <button 
        onClick={() => navigate('/my-bookings')} 
        style={{ background: '#e50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
      >
        View My Bookings
      </button>
    </div>
  );
}