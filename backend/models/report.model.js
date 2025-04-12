import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Passenger', required: true },
    name: { type: String, required: true },
    plateNumber: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);
export default Report;
