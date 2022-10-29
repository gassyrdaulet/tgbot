import { Router } from "express";
import { registration } from "../Service/AuthService.js";

const router = new Router();

router.post("/registration/", registration);

export default router;
