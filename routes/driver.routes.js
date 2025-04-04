import express from 'express';
import {
  registerDriver,
  loginDriver,
  getDriverBookings,
  updateBookingStatus,
  getAllDrivers
} from '../controller/driver.controller.js';

const router = express.Router();

// Driver authentication routes
router.post('/register', registerDriver);
router.post('/login', loginDriver);
router.post('/availableDrivers', getAllDrivers);


// Booking management routes
router.get('/:driverId/bookings', getDriverBookings);
router.patch('/:driverId/bookings/:bookingId', updateBookingStatus);

export default router;