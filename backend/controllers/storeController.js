import * as storeService from "../services/storeService.js";

// POST /api/stores
export const createStore = async (req, res, next) => {
  try {
    const data = await storeService.createStore(req.body);

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/stores/list
export const getStores = async (req, res, next) => {
  try {
    const data = await storeService.getStores(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// GET /api/stores/:id
export const getStoreById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await storeService.getStoreById(id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/stores/:id
export const updateStore = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await storeService.updateStore(id, req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/stores/:id
export const deactivateStore = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await storeService.deactivateStore(id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export default {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deactivateStore,
};
