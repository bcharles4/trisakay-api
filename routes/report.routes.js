// routes/report.routes.js
import express from "express";
import { reportIncident } from "../controller/report.controller.js";

const router = express.Router();

router.post("/report-incident", reportIncident);

export default router;
