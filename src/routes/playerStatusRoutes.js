const express = require('express');
const router = express.Router();
const { getPlayerStatus } = require('../controllers/playerStatusController');
const { validateQuery } = require('../middlewares/validateQuery');
const { playerStatusSchema } = require('../schemas/playerStatusSchema');

// GET /api/player-status?guildId=123&userId=456
router.get('/player-status', validateQuery(playerStatusSchema), getPlayerStatus);

module.exports = router;