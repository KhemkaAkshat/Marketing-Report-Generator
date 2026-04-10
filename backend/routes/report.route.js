import express from "express";
import {
  generateReport,
  getChatById,
  getHistory,
} from "../controller/report.controller.js";

const router = express.Router();

router.post("/", generateReport);
router.get("/history", getHistory);
router.get("/history/:chatId", getChatById);

export default router;
