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
// Updated createBooking function with proper field names


export const createBooking = async (req, res) => {
    console.log('\n=== NEW BOOKING REQUEST STARTED ===');
    console.log('Request body:', req.body);

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        console.log('Transaction started');

        const { name, from, to, fare, message } = req.body;

        // 1. Input Validation
        if (!name || !from || !to) {
            console.log('Validation failed - missing required fields');
            await session.abortTransaction();
            return res.status(400).json({ 
                message: "Name, from, and to are required fields",
                received: { name, from, to }
            });
        }

        // 2. Find Passenger
        console.log(`Searching for passenger: ${name}`);
        const passenger = await Passenger.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        }).session(session);

        if (!passenger) {
            console.log('Passenger not found');
            await session.abortTransaction();
            return res.status(404).json({ 
                message: "Passenger not found",
                searchedName: name
            });
        }

        // Clean up any invalid bookings before proceeding
        if (passenger.bookings && passenger.bookings.some(b => !b.name)) {
            console.log('Cleaning up invalid bookings...');
            passenger.bookings = passenger.bookings.filter(b => b.name);
            await passenger.save({ session, validateBeforeSave: false });
        }

        console.log(`Found passenger: ${passenger.name} (ID: ${passenger._id})`);

        // 3. Find Available Driver
        console.log('\nChecking driver availability...');
        
        const driverQuery = {
            $or: [
                { isAvailable: true },
                { isAvailable: { $exists: false } }
            ],
            $and: [
                {
                    $or: [
                        { receivedBooking: { $exists: false } },
                        { receivedBooking: { $size: 0 } },
                        { 
                            receivedBooking: {
                                $not: { $elemMatch: { status: { $in: ["Pending", "Accepted"] } } }
                            }
                        }
                    ]
                }
            ]
        };

        const driver = await Driver.findOne(driverQuery)
            .sort({ receivedBooking: 1 })
            .session(session);

        if (!driver) {
            console.log('NO AVAILABLE DRIVERS FOUND');
            await session.abortTransaction();
            return res.status(404).json({
                message: "No available drivers",
                diagnostics: {
                    totalDrivers: await Driver.countDocuments({}).session(session),
                    availableDrivers: await Driver.countDocuments({ isAvailable: true }).session(session)
                }
            });
        }

        console.log(`Found available driver: ${driver.name} (ID: ${driver._id})`);

        // 4. Create Booking Objects
        const bookingId = new mongoose.Types.ObjectId();
        console.log(`Creating booking with ID: ${bookingId}`);

        const newBooking = {
            _id: bookingId,
            bookingId: passenger.bookings.length + 1,
            name: passenger.name, // Required by schema
            passengerName: passenger.name,
            from,
            to,
            fare: fare || "0",
            message: message || "Pending",
            status: "Pending",
            driverId: driver._id,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const driverBooking = {
            _id: bookingId,
            bookingId: newBooking.bookingId.toString(),
            passengerId: passenger._id,
            passengerName: passenger.name,
            passengerPhone: passenger.phone,
            from,
            to,
            fare: fare ? fare.toString() : "0",
            message: message || "Pending",
            status: "Pending",
            createdAt: new Date()
        };

        // 5. Update Passenger
        console.log(`Updating passenger ${passenger.name} with new booking`);
        passenger.bookings.push(newBooking);
        await passenger.save({ session });
        console.log('Passenger updated successfully');

        // 6. Update Driver
        console.log(`Updating driver ${driver.name} with new booking`);
        if (!driver.receivedBooking) {
            driver.receivedBooking = [];
        }
        driver.receivedBooking.push(driverBooking);
        driver.isAvailable = false;
        
        await driver.save({ session });
        console.log('Driver updated successfully');

        // 7. Commit Transaction
        await session.commitTransaction();
        console.log('Transaction committed successfully');

        return res.status(201).json({
            message: "Booking created successfully",
            booking: {
                id: bookingId,
                passenger: passenger.name,
                driver: driver.name,
                from,
                to,
                status: "Pending"
            },
            driver: {
                name: driver.name,
                availability: false,
                currentBookings: driver.receivedBooking.length
            }
        });

    } catch (error) {
        console.error('\n!!! BOOKING ERROR !!!', error);
        await session.abortTransaction();
        return res.status(500).json({
            message: "Booking failed",
            error: error.message
        });
    } finally {
        session.endSession();
        console.log('=== BOOKING PROCESS COMPLETED ===\n');
    }
};