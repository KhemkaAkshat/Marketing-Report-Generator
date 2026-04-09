import express from "express";
import { generateReport } from "../controller/report.controller.js";
const router = express.Router()

router.post("/", generateReport)

export default router