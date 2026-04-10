import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import reportRoutes from "./routes/report.route.js"
import { connectDB } from "./config/db.js"

dotenv.config()
connectDB()
const app = express()
app.use(cors())
app.use(express.json())

app.use("/api/report", reportRoutes)


app.listen(5000, ()=>{
    console.log("Server running on port 5000")
})
