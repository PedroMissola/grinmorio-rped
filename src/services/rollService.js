const { getRedisClient } = require('../config/redis');
const {
    LUCK_TTL_SECONDS,
    LUCK_MIN,
    LUCK_MAX,
    RESCUE_ACTIVATION_THRESHOLD,
    RESCUE_DEACTIVATION_THRESHOLD,
    KARMA_DELTA_THRESHOLD,
    KARMA_HIGH_ROLL_THRESHOLD,
    KARMA_PENALTY_RATE,
    RESCUE_MAX_BONUS_RATE,
    RESCUE_MIN_BONUS,
    HISTORY_DEFAULT_AVERAGE
} = require('../config/rpedConstants');

const { clamp, rollWeightedDice, generateLuck } = require('../utils/mathUtils');
const rpedService = require('./rpedService');

async function getDailyLuck(userId) {
    const redis = getRedisClient();
    const cacheKey = `rped:user:${userId}:luck`;

    const cached = await redis.get(cacheKey);
    if (cached !== null) return Number(cached);

    const luck = generateLuck(LUCK_MIN, LUCK_MAX);
    await redis.set(cacheKey, luck, 'EX', LUCK_TTL_SECONDS);
    return luck;
}

async function updateRescueHysteresis(guildId, globalAverage) {
    const redis = getRedisClient();
    const rescueKey = `rped:guild:${guildId}:rescue_active`;

    let isRescueActive = (await redis.get(rescueKey)) === 'true';

    if (globalAverage < RESCUE_ACTIVATION_THRESHOLD && !isRescueActive) {
        await redis.set(rescueKey, 'true');
        isRescueActive = true;
    } else if (globalAverage > RESCUE_DEACTIVATION_THRESHOLD && isRescueActive) {
        await redis.set(rescueKey, 'false');
        isRescueActive = false;
    }

    return isRescueActive;
}

async function executeRoll(guildId, userId, diceSize = 20, modifier = 0) {
    const luckLevel = await getDailyLuck(userId);
    const { individualAverage, globalAverage } = await rpedService.getAverages(guildId, userId);

    let rolledFace = rollWeightedDice(luckLevel, diceSize);
    let adjustedFace = rolledFace;
    let systemAction = 'Nenhuma';

    const isRescueActive = await updateRescueHysteresis(guildId, globalAverage);

    if (
        individualAverage > globalAverage + KARMA_DELTA_THRESHOLD &&
        rolledFace >= diceSize * KARMA_HIGH_ROLL_THRESHOLD
    ) {
        // Penalidade proporcional ao resultado — quem tirou mais alto perde mais
        const penalty = Math.floor(rolledFace * KARMA_PENALTY_RATE);
        adjustedFace -= penalty;
        systemAction = 'Karma';
    }

    else if (isRescueActive) {
        const maxBonus = Math.floor(diceSize * RESCUE_MAX_BONUS_RATE);
        const rescueBonus = Math.max(RESCUE_MIN_BONUS, Math.floor((luckLevel / LUCK_MAX) * maxBonus));
        adjustedFace += rescueBonus;
        systemAction = 'Resgate';
    }

    const displayFace = clamp(Math.round(adjustedFace), 1, diceSize);
    const finalTotal = displayFace + modifier;

    await rpedService.recordRollRedis(guildId, userId, displayFace, diceSize);
    rpedService.saveRollLog({
        guildId,
        userId,
        diceSize,
        displayFace,
        modifier,
        finalTotal,
        stats: {
            individualAverage,
            globalAverage,
            luckLevel,
            systemAction
        }
    });

    return {
        displayFace,
        finalTotal,
        systemAction,
        stats: {
            individualAverage: Number(individualAverage.toFixed(3)),
            globalAverage: Number(globalAverage.toFixed(3)),
            luckLevel
        }
    };
}

module.exports = { executeRoll, getDailyLuck };