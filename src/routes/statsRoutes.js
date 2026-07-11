const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/bot', statsController.getBotStats);
router.get('/guild/:guildId', statsController.getGuildStats);
router.get('/user/:userId', statsController.getUserStats);

module.exports = router;