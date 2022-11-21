import { Router } from "express";
import { registration, setting, getUser } from "../Service/AuthService.js";

const router = new Router();

router.post("/registration/", registration);
router.post("/setting/", setting);
router.post("/users/", getUser);

export default router;
