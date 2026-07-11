const Log = require('../models/Log');
const { AppError } = require('../utils/AppError');

async function createLogEntry(fields) {
    await Log.create(fields);
}

function extractIdentifiers(details = {}) {
    return {
        guildId: details?.interaction?.guildId || details?.guildId || null,
        userId: details?.interaction?.userId || details?.userId || null
    };
}

async function recordEvent(req, res, next) {
    try {
        const { event, details } = req.body;
        const { guildId, userId } = extractIdentifiers(details);

        await createLogEntry({
            level: 'ANALYTICS',
            evento: event,
            mensagem: `Evento do Sistema: ${event}`,
            detalhes: details,
            guildId,
            usuarioId: userId
        });

        res.status(201).json({ success: true, message: 'Evento registrado com sucesso.' });
    } catch (error) {
        next(error);
    }
}

async function saveLog(req, res, next) {
    try {
        const { level, message, details } = req.body;
        const { guildId, userId } = extractIdentifiers(details);

        await createLogEntry({
            level,
            evento: 'SYSTEM_LOG',
            mensagem: message || 'Log de sistema recebido',
            detalhes: details,
            guildId,
            usuarioId: userId
        });

        res.status(201).json({ success: true, message: 'Log salvo com sucesso.' });
    } catch (error) {
        next(error);
    }
}

module.exports = { recordEvent, saveLog };