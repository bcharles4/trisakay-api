import express from 'express';
import passengerRoutes from '../routes/passenger.routes.js';
import driverRoutes from '../routes/driver.routes.js';
import { connectDB } from './config/db.js';

const app = express();
app.use(express.json());
connectDB();


// Routes
app.use('/api/passengers', passengerRoutes);
app.use('/api/drivers', driverRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Ride Sharing API');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});