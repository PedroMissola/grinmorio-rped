const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { validate } = require('../middlewares/validate');
const { recordEventSchema, saveLogSchema } = require('../schemas/analyticsSchema');
const { analyticsLimiter } = require('../middlewares/rateLimiters');

router.post('/stats/record', analyticsLimiter, validate(recordEventSchema), analyticsController.recordEvent);
router.post('/logs', analyticsLimiter, validate(saveLogSchema), analyticsController.saveLog);

module.exports = router;