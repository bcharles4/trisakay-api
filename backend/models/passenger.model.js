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
    booking: [
        {   name: { type: String, required: true },
            from: { type: String, required: true },
            to: { type: String, required: true },
            fair: { type: String, required: false },
            message: { type: String, required: false, default: "Pending" },
            status: { type: String, required: false, default: "Pending" },
            createdAt: { type: Date, default: Date.now }
        }
    ],
}, {
    timestamps: true,
});

passengerSchema.plugin(AutoIncrement, { inc_field: "passengerId" });

const Passenger = mongoose.model("Passenger", passengerSchema);
export default Passenger;
