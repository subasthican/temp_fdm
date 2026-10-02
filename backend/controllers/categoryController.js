import * as categoryService from "../services/categoryService.js";

// POST /api/categories
export const createCategory = async (req, res, next) => {
  try {
    const data = await categoryService.createCategory(req.body);

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/categories/list
export const getCategories = async (req, res, next) => {
  try {
    const data = await categoryService.getCategories(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/categories/:id
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await categoryService.updateCategory(id, req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
export const softDeleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await categoryService.softDeleteCategory(id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export default {
  createCategory,
  getCategories,
  updateCategory,
  softDeleteCategory,
};
