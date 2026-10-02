import * as taxClassService from "../services/taxClassService.js";

// POST /api/tax-classes
export const createTaxClass = async (req, res, next) => {
  try {
    const data = await taxClassService.createTaxClass(req.body);

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/tax-classes/list
export const getTaxClasses = async (req, res, next) => {
  try {
    const data = await taxClassService.getTaxClasses(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tax-classes/:id
export const updateTaxClass = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await taxClassService.updateTaxClass(id, req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tax-classes/:id
export const softDeleteTaxClass = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await taxClassService.softDeleteTaxClass(id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export default {
  createTaxClass,
  getTaxClasses,
  updateTaxClass,
  softDeleteTaxClass,
};
