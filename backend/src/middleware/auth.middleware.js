// Session-based authentication middleware (replaces JWT verification)
export const protectRoute = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized - Please log in" });
};
