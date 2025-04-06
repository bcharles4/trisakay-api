import Driver from '../backend/models/driver.model.js';

// Driver Registration
export const registerDriver = async (req, res) => {
    try {
        const { name, email, address, license, plate, password, phone } = req.body;

        // Check if driver already exists
        const existingDriver = await Driver.findOne({ email });
        if (existingDriver) {
            return res.status(400).json({ message: "Driver already exists" });
        }

        // Create new driver (password stored in plain text - not recommended for production)
        const newDriver = new Driver({
            name,
            email,
            address,
            license,
            plate,
            password,
            phone
        });

        await newDriver.save();
        res.status(201).json({ message: "Driver registered successfully", driver: newDriver });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Driver Login
export const loginDriver = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Find driver by email
        const driver = await Driver.findOne({ phone });
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Check password (plain text comparison - not secure)
        if (driver.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Successful login
        res.status(200).json({ 
            message: "Login successful", 
            driver: {
                _id: driver._id,
                name: driver.name,
                email: driver.email,
                address: driver.address,
                license: driver.license,
                plate: driver.plate,
                phone: driver.phone
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Driver's Received Bookings
export const getDriverBookings = async (req, res) => {
    try {
        const { driverId } = req.params;

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.status(200).json({ bookings: driver.receivedBooking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Booking Status
export const updateBookingStatus = async (req, res) => {
    try {
        const { driverId, bookingId } = req.params;
        const { status } = req.body;

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Find the booking
        const booking = driver.receivedBooking.id(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Update status
        booking.status = status;
        await driver.save();

        res.status(200).json({ message: "Booking status updated", booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// Get All Drivers
// Get Available Drivers
export const getAvailableDrivers = async (req, res) => {
    try {
        // Find drivers who don't have any pending bookings
        const drivers = await Driver.find({
            "receivedBooking.status": { $ne: "Pending" }
        }).select('-password');
        
        res.status(200).json({ drivers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};