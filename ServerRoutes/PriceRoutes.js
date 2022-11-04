import { Router } from "express";
import {
  getPriceInfoById,
  getAllPrices,
  getCategories,
  getBrands,
  editPriceXHR,
  deactivatePriceXHR,
  deletePriceXHR,
  activatePriceXHR,
  newPriceXHR,
  getStoreId,
  getXML,
  uploadXML,
} from "../Service/PriceService.js";

const router = new Router();

router.post("/", getAllPrices);
router.get("/price/:id", getPriceInfoById);
router.post("/new", newPriceXHR);
router.get("/brands", getBrands);
router.get("/categories", getCategories);
router.post("/edit", editPriceXHR);
router.post("/delete", deletePriceXHR);
router.post("/deactivate", deactivatePriceXHR);
router.post("/activate", activatePriceXHR);
router.get("/store", getStoreId);
router.get("/xml", getXML);
router.post("/upload", uploadXML);

export default router;
