const { rateLimit, ipKeyGenerator } = require('express-rate-limit'); // Importação ajustada

const clientKeyGenerator = (req, res) => {
    return req.client?.apiKey || ipKeyGenerator(req, res);
};

const rollLimiter = rateLimit({
    windowMs: 10 * 1000,
    max: 120,
    keyGenerator: (req, res) => {
        // Substituído req.ip por ipKeyGenerator(req, res)
        return req.body?.usuarioId || req.client?.apiKey || ipKeyGenerator(req, res);
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Limite de rolagens excedido. Aguarde 10 segundos.'
    }
});

const guildSettingsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    keyGenerator: (req, res) => {
        // Substituído req.ip por ipKeyGenerator(req, res)
        return req.params?.guildId || req.client?.apiKey || ipKeyGenerator(req, res);
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Limite de atualizações de configuração excedido para este servidor.'
    }
});

const analyticsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 500,
    keyGenerator: clientKeyGenerator, // Este já estava correto pois usava o helper
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Limite de registros analíticos excedido.'
    }
});

module.exports = { rollLimiter, guildSettingsLimiter, analyticsLimiter };