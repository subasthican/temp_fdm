import express from "express";

import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import storeRoutes from "./storeRoutes.js";
import registerRoutes from "./registerRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import brandRoutes from "./brandRoutes.js";
import taxClassRoutes from "./taxClassRoutes.js";
import productRoutes from "./productRoutes.js";
import inventoryRoutes from "./inventoryRoutes.js";
import saleRoutes from "./saleRoutes.js";
import reportRoutes from "./reportRoutes.js";

const router = express.Router();

// /api/auth
router.use("/auth", authRoutes);

// /api/users
router.use("/users", userRoutes);

// /api/stores
router.use("/stores", storeRoutes);

// /api/registers
router.use("/registers", registerRoutes);

// /api/categories
router.use("/categories", categoryRoutes);

// /api/brands
router.use("/brands", brandRoutes);

// /api/tax-classes
router.use("/tax-classes", taxClassRoutes);

// /api/products
router.use("/products", productRoutes);

// /api/inventory
router.use("/inventory", inventoryRoutes);

// /api/sales
router.use("/sales", saleRoutes);

// /api/reports
router.use("/reports", reportRoutes);

export default router;
