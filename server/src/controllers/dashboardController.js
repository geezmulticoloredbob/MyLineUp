const asyncHandler = require('../utils/asyncHandler');
const { buildDashboard } = require('../services/dashboardService');
const { getTeamHistory } = require('../services/snapshotService');

const getDashboard = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const dashboard = await buildDashboard(req.user, { page, limit });
  res.json(dashboard);
});

const getTeamTrend = asyncHandler(async (req, res) => {
  const { league, teamId } = req.params;
  const history = await getTeamHistory(league, teamId);
  res.json({ history });
});

module.exports = {
  getDashboard,
  getTeamTrend,
};
