/**
 * POS test-data seeder — populates a store, register, users, catalog
 * masters, and a spread of grocery products with stock + batches designed
 * to exercise every checkout path (batch-wise MRP, FEFO overflow, mixed
 * pricing modes, tax, weighed items, multi-barcode scan).
 *
 * Run from the backend folder:
 *   node scripts/seedPos.js          # upsert test data (keeps other data)
 *   node scripts/seedPos.js --fresh  # wipe the collections below first
 *
 * Idempotent: re-running upserts by natural key (code/sku/username), so
 * stock/batches are reset to the seeded quantities each run.
 */
import mongoose from "mongoose";

import config from "../config/env.js";
import connectDB from "../config/db.js";
import { hashPassword } from "../helpers/auth/hashPassword.js";
import { PRICING_MODES, SELL_TYPES, USER_ROLES } from "../config/constants.js";

import Store from "../models/Store.js";
import Register from "../models/Register.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";
import TaxClass from "../models/TaxClass.js";
import Product from "../models/Product.js";
import ProductStorePrice from "../models/ProductStorePrice.js";
import Stock from "../models/Stock.js";
import Batch from "../models/Batch.js";

const FRESH = process.argv.includes("--fresh");

// Days-from-now → Date, for readable expiry dates.
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const upsert = async (Model, filter, doc) => {
  const found = await Model.findOneAndUpdate(
    filter,
    { $set: doc },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return found;
};

/**
 * Product blueprints. `batches` drive both Batch rows and the Stock
 * balance (Stock.quantity = sum of batch quantities). For PRODUCT-priced
 * items the till price is `sellPrice`; batches still carry cost/expiry.
 */
const CATALOG = [
  // ── BATCH-priced: two batches at different MRP → FEFO + overflow ──────
  {
    name: "Coca-Cola 1.5L",
    sku: "COKE15L",
    barcodes: ["5449000000996"], // real-world EAN on the bottle
    category: "Beverages",
    brand: "Coca-Cola",
    tax: "Standard 15%",
    pricingMode: PRICING_MODES.BATCH,
    batches: [
      { batchNo: "COKE15L-B001", sellPrice: 380, cost: 300, quantity: 8, expiry: 40 },
      { batchNo: "COKE15L-B002", sellPrice: 400, cost: 320, quantity: 50, expiry: 90 },
    ],
    // Test: sell qty 10 → 8 × 380 + 2 × 400 = 3,840 (FEFO overflow split).
  },
  {
    name: "Anchor Milk Powder 400g",
    sku: "ANCHOR400",
    barcodes: ["4792085001234"],
    category: "Dairy",
    brand: "Anchor",
    tax: null, // exempt
    pricingMode: PRICING_MODES.BATCH,
    batches: [
      { batchNo: "ANCHOR400-B001", sellPrice: 1250, cost: 1050, quantity: 3, expiry: 20 },
      { batchNo: "ANCHOR400-B002", sellPrice: 1290, cost: 1080, quantity: 40, expiry: 120 },
    ],
    // Test: near-expiry batch (20 days) sells first.
  },
  {
    name: "Maliban Cream Cracker 190g",
    sku: "MALCRK190",
    barcodes: ["4792055010015"],
    category: "Biscuits",
    brand: "Maliban",
    tax: null,
    pricingMode: PRICING_MODES.BATCH,
    batches: [
      { batchNo: "MALCRK190-B001", sellPrice: 210, cost: 170, quantity: 60, expiry: 180 },
    ],
  },

  // ── PRODUCT-priced (each): single fixed till price ──────────────────
  {
    name: "Signal Toothpaste 120g",
    sku: "SIGNAL120",
    barcodes: ["8901030700123"],
    category: "Personal Care",
    brand: "Signal",
    tax: "Standard 15%",
    pricingMode: PRICING_MODES.PRODUCT,
    sellPrice: 450,
    cost: 360,
    batches: [
      { batchNo: "SIGNAL120-B001", cost: 360, quantity: 35, expiry: 400 },
    ],
  },
  {
    name: "Sunlight Soap 110g",
    sku: "SUNLIGHT110",
    barcodes: ["6001085001010", "6001085001027"], // multi-barcode (repack)
    category: "Household",
    brand: "Unilever",
    tax: "Standard 15%",
    pricingMode: PRICING_MODES.PRODUCT,
    sellPrice: 130,
    cost: 95,
    batches: [
      { batchNo: "SUNLIGHT110-B001", cost: 95, quantity: 120, expiry: 700 },
    ],
    // Test: scanning EITHER barcode resolves the same product.
  },

  // ── PRODUCT-priced (weighed): loose produce priced per kg ────────────
  {
    name: "Sugar (loose)",
    sku: "SUGARKG",
    barcodes: [],
    category: "Grocery",
    brand: null,
    tax: null,
    pricingMode: PRICING_MODES.PRODUCT,
    sellType: SELL_TYPES.WEIGHED,
    baseUnit: "kg",
    sellPrice: 240, // per kg
    cost: 205,
    batches: [
      { batchNo: "SUGARKG-B001", cost: 205, quantity: 200, expiry: 300 },
    ],
    // Test: weighed item — enter a decimal quantity (e.g. 1.5 kg).
  },
  {
    name: "Rice - Nadu (loose)",
    sku: "RICENADU",
    barcodes: [],
    category: "Grocery",
    brand: null,
    tax: null,
    pricingMode: PRICING_MODES.PRODUCT,
    sellType: SELL_TYPES.WEIGHED,
    baseUnit: "kg",
    sellPrice: 220,
    cost: 185,
    batches: [
      { batchNo: "RICENADU-B001", cost: 185, quantity: 500, expiry: 250 },
    ],
  },

  // ── Edge cases ───────────────────────────────────────────────────────
  {
    name: "Lifebuoy Handwash 200ml (LOW STOCK)",
    sku: "LIFEBUOY200",
    barcodes: ["8901030612345"],
    category: "Personal Care",
    brand: "Unilever",
    tax: "Standard 15%",
    pricingMode: PRICING_MODES.BATCH,
    batches: [
      { batchNo: "LIFEBUOY200-B001", sellPrice: 520, cost: 410, quantity: 2, expiry: 150 },
    ],
    // Test: try to sell qty 5 → capped at 2 (out-of-stock toast).
  },
  {
    name: "Milo 400g (OUT OF STOCK)",
    sku: "MILO400",
    barcodes: ["4792024001112"],
    category: "Beverages",
    brand: "Nestle",
    tax: null,
    pricingMode: PRICING_MODES.BATCH,
    batches: [], // no stock — should not be sellable
    // Test: appears in catalog but cannot be added (no in-stock batch).
  },
];

const run = async () => {
  await connectDB();

  if (FRESH) {
    await Promise.all(
      [Batch, Stock, ProductStorePrice, Product, TaxClass, Brand, Category].map(
        (M) => M.deleteMany({}),
      ),
    );
    console.log("🧹 Wiped catalog/inventory collections (--fresh).");
  }

  // ── Store + register ──────────────────────────────────────────────────
  const store = await upsert(
    Store,
    { code: "MB" },
    {
      name: "Main Branch",
      code: "MB",
      address: "123 Galle Road, Colombo 03",
      phone: "011-2345678",
      currency: "Rs.",
      isActive: true,
    },
  );

  await upsert(
    Register,
    { receiptPrefix: "MB01" },
    {
      storeId: store._id,
      code: "REG01",
      name: "Front Till",
      receiptPrefix: "MB01",
      isActive: true,
    },
  );

  // ── Users (admin / manager / cashier) — password: "password123" ──────
  const pwd = await hashPassword("password123");
  for (const u of [
    { username: "admin", fullName: "Store Admin", role: USER_ROLES.ADMIN },
    { username: "manager", fullName: "Nimal Silva", role: USER_ROLES.MANAGER },
    { username: "cashier", fullName: "Kamala Perera", role: USER_ROLES.CASHIER },
  ]) {
    await upsert(
      User,
      { username: u.username },
      {
        ...u,
        password: pwd,
        stores: [store._id],
        isActive: true,
        isDeleted: false,
      },
    );
  }

  // ── Masters (categories / brands / tax) ──────────────────────────────
  const catNames = [...new Set(CATALOG.map((p) => p.category))];
  const brandNames = [...new Set(CATALOG.map((p) => p.brand).filter(Boolean))];

  const categories = {};
  for (const name of catNames) {
    const c = await upsert(Category, { name }, { name, isActive: true, isDeleted: false });
    categories[name] = c._id;
  }

  const brands = {};
  for (const name of brandNames) {
    const b = await upsert(Brand, { name }, { name, isActive: true, isDeleted: false });
    brands[name] = b._id;
  }

  const standardTax = await upsert(
    TaxClass,
    { name: "Standard 15%" },
    { name: "Standard 15%", rate: 15, isInclusiveDefault: true, isActive: true, isDeleted: false },
  );
  const taxes = { "Standard 15%": standardTax._id };

  // ── Products + prices + stock + batches ──────────────────────────────
  for (const p of CATALOG) {
    const product = await upsert(
      Product,
      { sku: p.sku },
      {
        name: p.name,
        sku: p.sku,
        barcodes: p.barcodes,
        categoryId: categories[p.category] || null,
        brandId: p.brand ? brands[p.brand] : null,
        taxClassId: p.tax ? taxes[p.tax] : null,
        sellType: p.sellType || SELL_TYPES.EACH,
        pricingMode: p.pricingMode,
        baseUnit: p.baseUnit || "pcs",
        isActive: true,
        isDeleted: false,
      },
    );

    await upsert(
      ProductStorePrice,
      { productId: product._id, storeId: store._id },
      {
        productId: product._id,
        storeId: store._id,
        cost: p.cost || 0,
        sellPrice: p.sellPrice || 0, // fallback for batch-priced items
        reorderLevel: 5,
      },
    );

    // Reset batches for this product/store so re-runs are deterministic.
    await Batch.deleteMany({ productId: product._id, storeId: store._id });

    let onHand = 0;
    for (const b of p.batches) {
      await Batch.create({
        productId: product._id,
        storeId: store._id,
        batchNo: b.batchNo,
        expiryDate: b.expiry ? daysFromNow(b.expiry) : undefined,
        cost: b.cost || 0,
        sellPrice: b.sellPrice || 0,
        quantity: b.quantity,
        isActive: true,
      });
      onHand += b.quantity;
    }

    await upsert(
      Stock,
      { productId: product._id, storeId: store._id },
      { productId: product._id, storeId: store._id, quantity: onHand },
    );

    console.log(`  ✔ ${p.sku.padEnd(13)} ${p.name}  (on-hand ${onHand})`);
  }

  console.log("\n✅ Seed complete.");
  console.log("   Store: Main Branch (MB)   Register: REG01 (receipts MB01-…)");
  console.log("   Logins (password: password123): admin / manager / cashier");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
