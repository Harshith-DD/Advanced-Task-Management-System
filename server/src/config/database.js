import mongoose from "mongoose";

export async function connectDatabase(){
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed", error);
        throw error;
    }
}