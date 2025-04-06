import express from 'express';
import {
  registerDriver,
  loginDriver,
  getDriverBookings,
  updateBookingStatus,
  getAvailableDrivers,
  acceptBooking,
  rejectBooking,
  completeBooking
} from '../controller/driver.controller.js';

const router = express.Router();

// Driver authentication routes
router.post('/register', registerDriver);
router.post('/login', loginDriver);
router.get('/available', getAvailableDrivers); // Changed to GET as it's more RESTful

// Booking management routes
router.get('/:driverId/bookings', getDriverBookings);
router.patch('/:driverId/bookings/:bookingId', updateBookingStatus); // General status update (keep if needed)

// New booking action routes
router.post('/:driverId/bookings/:bookingId/accept', acceptBooking);
router.post('/:driverId/bookings/:bookingId/reject', rejectBooking);
router.post('/:driverId/bookings/:bookingId/complete', completeBooking);

export default router;