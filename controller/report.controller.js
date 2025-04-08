// controllers/report.controller.js
import Report from "../backend/models/report.model.js";
import Passenger from "../backend/models/passenger.model.js";

// Submit incident report
export const reportIncident = async (req, res) => {
    try {
        const { passengerId, name, plateNumber, message, imageUrl } = req.body;

        // Validate required fields
        if (!passengerId || !name || !plateNumber || !message) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Ensure passenger exists
        const passenger = await Passenger.findById(passengerId);
        if (!passenger) {
            return res.status(404).json({ message: "Passenger not found." });
        }

        // Save report
        const newReport = new Report({
            passengerId,
            name,
            plateNumber,
            message,
            imageUrl: imageUrl || null
        });

        await newReport.save();

        res.status(201).json({
            message: "Incident report submitted successfully",
            report: newReport
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
