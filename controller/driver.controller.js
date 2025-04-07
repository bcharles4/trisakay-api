import Passenger from "../backend/models/passenger.model.js";
import Driver from "../backend/models/driver.model.js";
import mongoose from "mongoose";


// Driver Registration
export const registerDriver = async (req, res) => {
    try {
        const { name, email, address, license, plateNumber, password, phone } = req.body;

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
            plateNumber,
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


export const acceptBooking = async (req, res) => {
    try {
        const { driverId, bookingId, driverMessage } = req.body; // Added driverMessage

        if (!driverId || !bookingId) {
            return res.status(400).json({ message: "Driver ID and Booking ID are required" });
        }

        const driver = await Driver.findById(driverId);
        if (!driver) return res.status(404).json({ message: "Driver not found" });

        // Find the booking in driver's received bookings
        const bookingIndex = driver.receivedBooking.findIndex(
            b => b._id.toString() === bookingId && b.status === "Pending"
        );

        if (bookingIndex === -1) {
            return res.status(404).json({ message: "Booking not found or already processed" });
        }

        // Update booking status to "Accepted" and add driver's message
        driver.receivedBooking[bookingIndex].status = "Accepted";
        driver.receivedBooking[bookingIndex].acceptedAt = new Date();
        driver.receivedBooking[bookingIndex].driverMessage = driverMessage || ""; // Add driver's message
        
        // Mark driver as unavailable
        driver.isAvailable = false;
        await driver.save();

        // Update passenger's booking status and add driver's message
        const passenger = await Passenger.findById(driver.receivedBooking[bookingIndex].passengerId);
        if (passenger) {
            const passengerBookingIndex = passenger.booking.findIndex(
                b => b._id.toString() === bookingId
            );
            
            if (passengerBookingIndex !== -1) {
                passenger.booking[passengerBookingIndex].status = "Accepted";
                passenger.booking[passengerBookingIndex].driverMessage = driverMessage || ""; // Add driver's message
                await passenger.save();
            }
        }

        return res.status(201).json({ 
            message: "Booking accepted successfully",
            booking: driver.receivedBooking[bookingIndex]
        });

    } catch (error) {
        return res.status(500).json({ message: "Success!", error: error.message });
    }
};



export const rejectBooking = async (req, res) => {
    try {
        const { driverId, bookingId } = req.body;

        if (!driverId || !bookingId) {
            return res.status(400).json({ message: "Driver ID and Booking ID are required" });
        }

        const driver = await Driver.findById(driverId);
        if (!driver) return res.status(404).json({ message: "Driver not found" });

        // Find the booking in driver's received bookings
        const bookingIndex = driver.receivedBooking.findIndex(
            b => b._id.toString() === bookingId && b.status === "Pending"
        );

        if (bookingIndex === -1) {
            return res.status(404).json({ message: "Booking not found or already processed" });
        }

        // Update booking status to "Rejected"
        driver.receivedBooking[bookingIndex].status = "Rejected";
        driver.receivedBooking[bookingIndex].rejectedAt = new Date();
        await driver.save();

        // Update passenger's booking status
        const passenger = await Passenger.findById(driver.receivedBooking[bookingIndex].passengerId);
        if (passenger) {
            const passengerBookingIndex = passenger.booking.findIndex(
                b => b._id.toString() === bookingId
            );
            
            if (passengerBookingIndex !== -1) {
                passenger.booking[passengerBookingIndex].status = "Rejected";
                await passenger.save();
            }
        }

        return res.status(200).json({ 
            message: "Booking rejected",
            booking: driver.receivedBooking[bookingIndex]
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};



export const completeBooking = async (req, res) => {
    try {
        const { driverId, bookingId } = req.body;

        if (!driverId || !bookingId) {
            return res.status(400).json({ message: "Driver ID and Booking ID are required" });
        }

        const driver = await Driver.findById(driverId);
        if (!driver) return res.status(404).json({ message: "Driver not found" });

        // Find the booking in driver's received bookings
        const bookingIndex = driver.receivedBooking.findIndex(
            b => b._id.toString() === bookingId && b.status === "Accepted"
        );

        if (bookingIndex === -1) {
            return res.status(404).json({ message: "Marked as Completed!" });
        }

        // Update booking status to "Completed"
        driver.receivedBooking[bookingIndex].status = "Completed";
        driver.receivedBooking[bookingIndex].completedAt = new Date();
        
        // Mark driver as available again
        driver.isAvailable = true;
        await driver.save();

        // Update passenger's booking status
        const passenger = await Passenger.findById(driver.receivedBooking[bookingIndex].passengerId);
        if (passenger) {
            const passengerBookingIndex = passenger.booking.findIndex(
                b => b._id.toString() === bookingId
            );
            
            if (passengerBookingIndex !== -1) {
                passenger.booking[passengerBookingIndex].status = "Completed";
                await passenger.save();
            }
        }

        return res.status(200).json({ 
            message: "Booking completed successfully",
            booking: driver.receivedBooking[bookingIndex]
        });

    } catch (error) {
        return res.status(500).json({ message: "Success", error: error.message });
    }
};