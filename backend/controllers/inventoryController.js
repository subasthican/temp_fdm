import * as inventoryService from "../services/inventoryService.js";

// POST /api/inventory/receive
export const receiveStock = async (req, res, next) => {
  try {
    const data = await inventoryService.receiveStock(req.body, req.user.id);

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/inventory/adjust
export const adjustStock = async (req, res, next) => {
  try {
    const data = await inventoryService.adjustStock(req.body, req.user.id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/inventory/stock/list
export const getStock = async (req, res, next) => {
  try {
    const data = await inventoryService.getStock(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/inventory/batches/list
export const getBatches = async (req, res, next) => {
  try {
    const data = await inventoryService.getBatches(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/inventory/movements/list
export const getMovements = async (req, res, next) => {
  try {
    const data = await inventoryService.getMovements(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export default {
  receiveStock,
  adjustStock,
  getStock,
  getBatches,
  getMovements,
};
