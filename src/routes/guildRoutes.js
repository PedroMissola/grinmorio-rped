const express = require('express');
const router = express.Router();
const guildController = require('../controllers/guildController');
const { validate } = require('../middlewares/validate');
const { sanitizeParams } = require('../middlewares/sanitize');
const { updateGuildSettingsSchema } = require('../schemas/guildSchema');
const { guildSettingsLimiter } = require('../middlewares/rateLimiters');

router.get('/:guildId/settings', sanitizeParams, guildController.getGuildSettings);
router.put('/:guildId/settings', guildSettingsLimiter, sanitizeParams, validate(updateGuildSettingsSchema), guildController.updateGuildSettings);
router.post('/:guildId/sync-members', sanitizeParams, guildController.syncGuildMembers);

module.exports = router;