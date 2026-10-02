import * as reportService from "../services/reportService.js";

// POST /api/reports/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const data = await reportService.getDashboard(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export default { getDashboard };
