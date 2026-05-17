const asyncHandler = require('../utils/asyncHandler');
const { buildDashboard } = require('../services/dashboardService');

const getDashboard = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const dashboard = await buildDashboard(req.user, { page, limit });
  res.json(dashboard);
});

module.exports = {
  getDashboard,
};
