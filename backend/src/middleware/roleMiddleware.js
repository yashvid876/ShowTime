const roleMiddleware = (permittedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const role = req.user.role;

    if (permittedRoles.includes(role)) next();
    else return res.status(403).json({ message: "Forbidden access" });
  };
};

export { roleMiddleware };
