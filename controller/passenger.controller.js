import Passenger from "../backend/models/passenger.model.js";
import Driver from "../backend/models/driver.model.js";

// Passenger Registration
export const registerPassenger = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Check if passenger already exists
        const existingPassenger = await Passenger.findOne({ email });
        if (existingPassenger) {
            return res.status(400).json({ message: "Passenger already exists" });
        }

        // Create new passenger (password stored in plain text - not recommended for production)
        const newPassenger = new Passenger({
            name,
            email,
            phone,
            password 
        });

        await newPassenger.save();
        res.status(201).json({ message: "Passenger registered successfully", passenger: newPassenger });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Passenger Login
export const loginPassenger = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Find passenger by email
        const passenger = await Passenger.findOne({ phone });
        if (!passenger) {
            return res.status(404).json({ message: "Passenger not found" });
        }

        // Check password (plain text comparison - not secure)
        if (passenger.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Successful login
        res.status(200).json({ 
            message: "Login successful", 
            passenger: {
                _id: passenger._id,
                name: passenger.name,
                email: passenger.email,
                phone: passenger.phone
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create Booking and Send to Driver
export const createBooking = async (req, res) => {
    try {
        const { passengerId, driverId, name, from, to, fair, message } = req.body;

        // Find passenger and driver
        const passenger = await Passenger.findById(passengerId);
        const driver = await Driver.findById(driverId);

        if (!passenger || !driver) {
            return res.status(404).json({ message: "Passenger or Driver not found" });
        }

        // Create booking object
        const booking = {
            name,
            from,
            to,
            fair,
            message,
            status: "Pending"
        };

        // Add booking to passenger's bookings
        passenger.booking.push(booking);
        await passenger.save();

        // Add booking to driver's received bookings
        driver.receivedBooking.push({
            from,
            to,
            fair,
            message,
            status: "Pending"
        });
        await driver.save();

        res.status(201).json({ message: "Booking created and sent to driver successfully", booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};