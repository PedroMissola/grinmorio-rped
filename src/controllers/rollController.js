const rollService = require('../services/rollService');

async function postRoll(req, res, next) {
    try {
        const { guildId, usuarioId, tamanhoDado, modificador } = req.body;

        const result = await rollService.executeRoll(guildId, usuarioId, tamanhoDado, modificador);

        return res.status(200).json({
            success: true,
            data: {
                userId:   usuarioId,
                guildId,
                diceSize: tamanhoDado,
                modifier: modificador,
                ...result
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { postRoll };