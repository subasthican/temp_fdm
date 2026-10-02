import * as saleService from "../services/saleService.js";

// POST /api/sales/lookup
export const lookupItem = async (req, res, next) => {
  try {
    const data = await saleService.lookupItem(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/sales
export const completeSale = async (req, res, next) => {
  try {
    const data = await saleService.completeSale(req.body, req.user.id);

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// GET /api/sales/:id
export const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await saleService.getSaleById(id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export default { lookupItem, completeSale, getSaleById };
