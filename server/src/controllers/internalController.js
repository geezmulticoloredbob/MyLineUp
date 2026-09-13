const asyncHandler = require('../utils/asyncHandler');
const { captureSnapshots } = require('../services/snapshotService');

const refreshSnapshots = asyncHandler(async (req, res) => {
  const result = await captureSnapshots();
  res.json(result);
});

module.exports = {
  refreshSnapshots,
};
