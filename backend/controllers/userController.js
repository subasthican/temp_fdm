import * as userService from "../services/userService.js";

// POST /api/users
export const createUser = async (req, res, next) => {
  try {
    const data = await userService.createUser(req.body);

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/users/list
export const getUsers = async (req, res, next) => {
  try {
    const data = await userService.getUsers(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await userService.getUserById(id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await userService.updateUser(id, req.body, req.user.id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/users/:id/reset-password
export const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const data = await userService.resetPassword(id, newPassword);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id
export const softDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await userService.softDeleteUser(id, req.user.id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export default {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  resetPassword,
  softDeleteUser,
};
