const { getDailyLuck } = require('../services/rollService');
const { getAverages, isKarmaActive } = require('../services/rpedService');
const { getRedisClient } = require('../config/redis');
const { AppError } = require('../utils/AppError');
const {
    KARMA_DELTA_THRESHOLD,
    RESCUE_ACTIVATION_THRESHOLD,
    RESCUE_DEACTIVATION_THRESHOLD
} = require('../config/rpedConstants');

async function getPlayerStatus(req, res, next) {
    try {
        const { guildId, userId } = req.query;

        if (!guildId || !userId) {
            throw new AppError('guildId e userId são obrigatórios.', 400);
        }

        const redis = getRedisClient();

        const [luckLevel, averages, rescueRaw] = await Promise.all([
            getDailyLuck(userId),
            getAverages(guildId, userId),
            redis.get(`rped:guild:${guildId}:rescue_active`)
        ]);

        const { individualAverage, globalAverage } = averages;

        const karmaActive = isKarmaActive(individualAverage, globalAverage, KARMA_DELTA_THRESHOLD);
        const rescueActive = rescueRaw === 'true';

        res.status(200).json({
            success: true,
            jogador: {
                sorte: luckLevel,
                mediaIndividual: Number(individualAverage.toFixed(3)),
                karmaAtivo: karmaActive,
                // Distância da média global — positivo = acima da média
                deltaMedia: Number((individualAverage - globalAverage).toFixed(3))
            },
            guild: {
                mediaGlobal: Number(globalAverage.toFixed(3)),
                resgateAtivo: rescueActive,
                thresholds: {
                    ativacaoResgate: RESCUE_ACTIVATION_THRESHOLD,
                    desativacaoResgate: RESCUE_DEACTIVATION_THRESHOLD,
                    deltaKarma: KARMA_DELTA_THRESHOLD
                }
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getPlayerStatus };