import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();
console.log("MongoDB URI:", process.env.MONGO_URI);  // Debugging step

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
