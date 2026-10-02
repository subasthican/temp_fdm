import * as registerService from "../services/registerService.js";

// POST /api/registers
export const createRegister = async (req, res, next) => {
  try {
    const data = await registerService.createRegister(req.body);

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/registers/list
export const getRegisters = async (req, res, next) => {
  try {
    const data = await registerService.getRegisters(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// GET /api/registers/:id
export const getRegisterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await registerService.getRegisterById(id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/registers/:id
export const updateRegister = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await registerService.updateRegister(id, req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/registers/:id
export const deactivateRegister = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await registerService.deactivateRegister(id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export default {
  createRegister,
  getRegisters,
  getRegisterById,
  updateRegister,
  deactivateRegister,
};
