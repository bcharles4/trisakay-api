import express from 'express';
import {
  registerPassenger,
  loginPassenger,
  createBooking,
  getAllDrivers
} from '../controller/passenger.controller.js';

const router = express.Router();

// Passenger authentication routes
router.post('/register', registerPassenger);
router.post('/login', loginPassenger);
router.post('/availableDrivers', getAllDrivers);



// Booking routes
router.post('/bookings', createBooking);

export default router;