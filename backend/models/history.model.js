import mongoose from "mongoose"

const historySchema = new mongoose.Schema({
    query:{type:String, rquired:true},
    results:{type:Array, required: true},
    createdAt:{type:Date, default: Date.now}
})

export default mongoose.model("History", historySchema);