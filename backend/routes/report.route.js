import express from "express";
import { generateReport, getHistory } from "../controller/report.controller.js";
const router = express.Router()

router.post("/", generateReport)
router.get("/history",getHistory)

export default router