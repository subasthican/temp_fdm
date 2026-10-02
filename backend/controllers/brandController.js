import * as brandService from "../services/brandService.js";

// POST /api/brands
export const createBrand = async (req, res, next) => {
  try {
    const data = await brandService.createBrand(req.body);

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/brands/list
export const getBrands = async (req, res, next) => {
  try {
    const data = await brandService.getBrands(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/brands/:id
export const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await brandService.updateBrand(id, req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/brands/:id
export const softDeleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await brandService.softDeleteBrand(id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export default {
  createBrand,
  getBrands,
  updateBrand,
  softDeleteBrand,
};
