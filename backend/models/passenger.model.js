import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const passengerSchema = new mongoose.Schema({
    passengerId: { type: Number },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: {
        type: String,
        required: true,
        match: [/^\d{11}$/, "Phone number must be exactly 11 digits"]
    },
    password: { type: String, required: true },
    bookings: [{
        name: { type: String, required: true },
        from: { type: String, required: true },
        to: { type: String, required: true },
        fare: { type: Number, required: false, default: 0 },
        message: { type: String, required: false, default: "" },
        status: { type: String, required: true, default: "Pending" },
        createdAt: { type: Date, default: Date.now },
        driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" }
    }]
}, {
    timestamps: true,
});

// Add indexes for better performance
passengerSchema.index({ "bookings.status": 1 });
passengerSchema.index({ email: 1 }, { unique: true });
passengerSchema.index({ phone: 1 }, { unique: true });

passengerSchema.plugin(AutoIncrement, { 
    inc_field: "passengerId",
    start_seq: 1000  // Starting passenger ID
});

const Passenger = mongoose.model("Passenger", passengerSchema);
export default Passenger;