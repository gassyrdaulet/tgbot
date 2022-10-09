import { Router } from "express";
import {
  getPriceInfoById,
  getAllPrices,
  getCategories,
  getBrands,
} from "../Service/PriceService.js";

const router = new Router();

router.post("/", getAllPrices);
router.get("/price/:id", getPriceInfoById);
router.get("/brands", getBrands);
router.get("/categories", getCategories);

export default router;
