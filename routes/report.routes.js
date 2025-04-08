// routes/report.routes.js
import express from "express";
import { reportIncident, getReports } from "../controller/report.controller.js";

const router = express.Router();

router.post("/report-incident", reportIncident);

router.get("/report-incident", getReports);

export default router;
