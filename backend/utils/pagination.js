import { PAGINATION } from "../config/constants.js";

// Normalizes page/limit before they reach mongoose-paginate-v2 so the
// default and maximum limits always apply.
const getPagination = ({ page, limit } = {}) => {
  const safePage = Math.max(Number(page) || PAGINATION.DEFAULT_PAGE, 1);

  const safeLimit = Math.min(
    Math.max(Number(limit) || PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT,
  );

  return { page: safePage, limit: safeLimit };
};

export default getPagination;
