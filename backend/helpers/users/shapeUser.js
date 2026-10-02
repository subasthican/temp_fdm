// Shapes a user document into the standard API response — never exposes
// password or refreshToken. Handles both populated and raw `stores`.
export const shapeUser = (user) => ({
  id: user._id,
  username: user.username,
  fullName: user.fullName,
  role: user.role,
  email: user.email,
  phone: user.phone,
  stores: (user.stores || []).map((store) =>
    store && store._id
      ? { id: store._id, name: store.name, code: store.code }
      : store,
  ),
  isActive: user.isActive,
});

export default shapeUser;
