import Passenger from "../backend/models/passenger.model.js";
import Driver from "../backend/models/driver.model.js";
import mongoose from "mongoose";

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



// Create Booking
// This function creates a booking for a passenger and assigns it to an available driver.
export const createBooking = async (req, res) => {
    try {
        const { passengerId, name, from, to, fare, message } = req.body;

        // 1. Find passenger
        const passenger = await Passenger.findOne({ passengerId: Number(passengerId) });
        if (!passenger) {
            return res.status(404).json({ message: "Passenger not found" });
        }

        // 2. Find available driver (NOT currently having a pending booking)
        const driver = await Driver.findOne({
            $or: [
                { receiveBooking: { $exists: false } }, // No bookings at all
                { receiveBooking: { $size: 0 } }, // Empty bookings array
                { 
                    "receiveBooking.status": { 
                        $not: { $eq: "Pending" } 
                    } 
                }
            ]
        });

        if (!driver) {
            return res.status(404).json({ message: "All drivers are currently busy" });
        }

        // 3. Create booking
        const newBooking = {
            name: name || passenger.name,
            from,
            to,
            fare: fare || 0,
            message: message || "",
            status: "Pending",
            driverId: driver._id,
            createdAt: new Date() // Track when booking was created
        };

        // 4. Update records
        passenger.bookings.push(newBooking);
        await passenger.save();

        driver.receiveBooking.push({
            ...newBooking,
            passengerId: passenger.passengerId,
            passengerName: passenger.name,
            passengerPhone: passenger.phone
        });
        await driver.save();

        return res.status(201).json({ 
            message: "Booking request sent to driver",
            booking: newBooking,
            driver: {
                name: driver.name,
                phone: driver.phone,
                plate: driver.plate
            }
        });

    } catch (error) {
        console.error("Booking error:", error);
        return res.status(500).json({ 
            message: "Server error",
            error: error.message 
        });
    }
};