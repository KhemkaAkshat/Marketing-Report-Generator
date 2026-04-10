import mongoose from "mongoose"
export const connectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("MongoDb connected ")
        
    } catch (error) {
        console.log("MongoDB error:", error)
        process.exit(1)
    }
}