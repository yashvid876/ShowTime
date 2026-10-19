const getAdminDashboard = (req, res) => {
  return res
    .status(200)
    .json({ message: "Admin route accessed", user: req.user });
};

export { getAdminDashboard };
