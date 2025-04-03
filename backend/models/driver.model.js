import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const driverSchema = new mongoose.Schema({ 
    driverId: { type: Number },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    license: { type: String, required: true },
    plate: { type: String, required: true },
    password: { type: String, required: true },
    Phone: { 
        type: String, 
        required: true,
        match: [/^\d{11}$/, "Phone number must be exactly 11 digits"]
    },
    receivedBooking: [
        {
            from: { type: String, required: true },
            to: { type: String, required: true },
            fair: { type: String, required: false },
            message: { type: String, required: false, default: "Pending" },
            status: { type: String, required: false, default: "Pending" }, 
            createdAt: { type: Date, default: Date.now },
            }
    ],
    sessionToken: { type: String, required: false }
}, {
    timestamps: true,
});

driverSchema.plugin(AutoIncrement, { inc_field: "driverId" });

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;