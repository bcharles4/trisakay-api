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
// Create Booking
// Create Booking based on Passenger Name
export const createBooking = async (req, res) => {
    try {
        const { name, from, to, fare, message } = req.body;

        // Validate required fields
        if (!name || !from || !to) {
            return res.status(400).json({ 
                message: "Name, from, and to are required fields" 
            });
        }

        // 1. Find passenger by name (case insensitive)
        const passenger = await Passenger.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (!passenger) {
            return res.status(404).json({ 
                message: "Passenger not found. Please check the name or register first." 
            });
        }

        // 2. Find available driver (not currently handling any pending bookings)
        const driver = await Driver.findOne({
            $or: [
                { receiveBooking: { $size: 0 } },
                { receiveBooking: { $not: { $elemMatch: { status: "Pending" } } } }
            ]
        }).sort({ receiveBooking: 1 }); // Prefer drivers with fewer bookings

        if (!driver) {
            return res.status(404).json({ 
                message: "No available drivers at the moment. Please try again later." 
            });
        }

        // 3. Create booking with auto-incremented ID
        const bookingCount = passenger.bookings.length;
        const newBooking = {
            bookingId: bookingCount + 1,
            name: passenger.name, // Always use registered passenger name
            from,
            to,
            fare: fare || 0,
            message: message || "",
            status: "Pending",
            driverId: driver._id,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 4. Update records in a transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Add to passenger's bookings
            passenger.bookings.push(newBooking);
            await passenger.save({ session });

            // Add to driver's received bookings
            driver.receiveBooking.push({
                ...newBooking,
                passengerId: passenger._id,
                passengerName: passenger.name,
                passengerPhone: passenger.phone
            });
            await driver.save({ session });

            await session.commitTransaction();

            return res.status(201).json({ 
                message: "Booking created successfully",
                booking: {
                    ...newBooking,
                    bookingId: passenger.passengerId * 1000 + newBooking.bookingId // Generate unique ID
                },
                passenger: {
                    name: passenger.name,
                    phone: passenger.phone,
                    email: passenger.email
                },
                driver: {
                    name: driver.name,
                    phone: driver.phone,
                    vehicle: driver.plate
                }
            });

        } catch (transactionError) {
            await session.abortTransaction();
            throw transactionError;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error("Booking error:", error);
        return res.status(500).json({ 
            message: "Failed to create booking",
            error: error.message 
        });
    }
};
