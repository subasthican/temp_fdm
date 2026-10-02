import * as authService from "../services/authService.js";

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const data = await authService.login(username, password);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    const data = await authService.logout(req.user.id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    const data = await authService.refreshToken(token);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const data = await authService.getMe(req.user.id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/me
export const updateProfile = async (req, res, next) => {
  try {
    const data = await authService.updateProfile(req.user.id, req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const data = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword,
    );

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
};
