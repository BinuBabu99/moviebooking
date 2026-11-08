import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/home';
import Login from './pages/login';
import MyBookings from './pages/mybookings';
import SeatSelection from './pages/SeatSelection';
import ShowtimeSelection from './pages/ShowtimeSelection';
import Signup from './pages/signup';
import Success from './pages/Success';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:movieId" element={<ShowtimeSelection />} />
        <Route path="/showtime/:showtimeId/seats" element={<SeatSelection />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/success" element={<Success />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
