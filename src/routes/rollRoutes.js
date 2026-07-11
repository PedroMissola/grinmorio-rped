const express = require('express');
const router = express.Router();
const rollController = require('../controllers/rollController');
const { validate } = require('../middlewares/validate');
const { rollSchema } = require('../schemas/rollSchema');
const { rollLimiter } = require('../middlewares/rateLimiters');

router.post('/roll', rollLimiter, validate(rollSchema), rollController.postRoll);

module.exports = router;