const crypto = require('crypto');
const { getClient } = require('../config/apiKeys');

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

function authenticate(req, res, next) {
    const apiKey    = req.headers['x-api-key'];
    const timestamp = req.headers['x-timestamp'];
    const signature = req.headers['x-signature'];

    if (!apiKey || !timestamp || !signature) {
        return res.status(401).json({
            success: false,
            error: 'Autenticação necessária. Headers ausentes.'
        });
    }

    const client = getClient(apiKey);
    if (!client) {
        return res.status(401).json({
            success: false,
            error: 'API Key inválida.'
        });
    }

    const requestTime = parseInt(timestamp, 10);
    const now = Date.now();

    if (isNaN(requestTime) || Math.abs(now - requestTime) > TIMESTAMP_TOLERANCE_MS) {
        return res.status(401).json({
            success: false,
            error: 'Requisição expirada ou com timestamp inválido.'
        });
    }

    const rawBody = JSON.stringify(req.body) || '';
    const expectedSignature = crypto
        .createHmac('sha256', client.secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

    const signaturesMatch = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );

    if (!signaturesMatch) {
        return res.status(401).json({
            success: false,
            error: 'Assinatura inválida.'
        });
    }

    req.client = { name: client.name, apiKey };
    next();
}

module.exports = { authenticate };