import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const driverSchema = new mongoose.Schema({ 
    driverId: { type: Number },
    name: { type: String, required: true },
    email: { type: String, required: false, unique: true },
    address: { type: String, required: true },
    license: { type: String, required: true },
    plateNumber: { type: String, required: true },
    password: { type: String, required: true },
    phone: { 
        type: String, 
        required: true,
        match: [/^\d{11}$/, "Phone number must be exactly 11 digits"]
    },
    isAvailable: { type: Boolean, default: true }, // Add this field
    receivedBooking: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId }, // Add this line
          bookingId: { type: String, required: true },
          passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Passenger' },
          passengerName: { type: String, required: true },
          passengerPhone: { type: String, required: true },
          from: { type: String, required: true },
          to: { type: String, required: true },
          fare: { type: String, required: false },
          message: { type: String, default: "Pending" },
          status: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected", "Completed"],
            default: "Pending"
          },
          createdAt: { type: Date, default: Date.now },
          acceptedAt: { type: Date },
          rejectedAt: { type: Date },
          completedAt: { type: Date }
        }
      ],      
    sessionToken: { type: String }
}, {
    timestamps: true,
});
driverSchema.plugin(AutoIncrement, { inc_field: "driverId" });

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;