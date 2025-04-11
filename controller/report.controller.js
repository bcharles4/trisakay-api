// controllers/report.controller.js
import Report from "../backend/models/report.model.js"; // Fixed path (removed backend/)
import Passenger from "../backend/models/passenger.model.js"; // Fixed path

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
            imageUrl: imageUrl || null,
            status: "Pending" // Added default status
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

// Get all reports or filter by passengerId
export const getReports = async (req, res) => {
    try {
        const { passengerId } = req.query;

        let query = {};
        if (passengerId) {
            query.passengerId = passengerId;
        }

        // Changed from ReportIncident to Report to match your import
        const reports = await Report.find(query).sort({ createdAt: -1 });

        if (reports.length === 0) {
            return res.status(404).json({ 
                message: "No reports found",
                suggestions: [
                    "Check if the passengerId is correct",
                    "Ensure reports exist in the database",
                    "Verify your query parameters"
                ]
            });
        }

        res.status(200).json({
            message: "Reports retrieved successfully",
            total: reports.length,
            reports
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ 
            message: "Failed to retrieve reports", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};