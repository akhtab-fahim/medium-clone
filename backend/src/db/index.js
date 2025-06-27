import mongoose, { mongo } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async()=>{
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URL);
        // console.log(connectionInstance);
        
        console.log("Connected to Database :: ",connectionInstance.connection.host);
        
    } catch (error) {
        console.log("failed to connect :: ",error);
    }
}

