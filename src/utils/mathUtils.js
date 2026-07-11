function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function generateLuck(min = 0, max = 10) {
    const SAMPLES = 12;
    const raw = Array.from({ length: SAMPLES }, () => Math.random())
        .reduce((sum, val) => sum + val, 0);

    const normalized = (raw / SAMPLES) * (max - min) + min;
    return clamp(Math.round(normalized), min, max);
}

function rollWeightedDice(luckLevel, diceSize) {
    const { DICE_MIN_SIZE, DICE_MAX_SIZE, LUCK_MIN, LUCK_MAX } = require('../config/rpedConstants');

    const size = clamp(Math.floor(diceSize), DICE_MIN_SIZE, DICE_MAX_SIZE);
    const luck = clamp(Math.floor(luckLevel), LUCK_MIN, LUCK_MAX);

    const weights = new Float32Array(size).fill(1.0);

    if (luck <= 2) {
        const limit = Math.ceil(size * 0.25);
        for (let i = 0; i < limit; i++) weights[i] *= 2.5;
    } else if (luck <= 6) {
        const start = Math.floor(size * 0.5);
        for (let i = start; i < size; i++) weights[i] *= 1.2;
    } else if (luck <= 8) {
        const start = Math.floor(size * 0.55);
        const end   = Math.floor(size * 0.9);
        for (let i = start; i < end; i++) weights[i] *= 2.0;
    } else {
        weights[size - 1] *= 4.0;
        if (size > 1) weights[size - 2] *= 3.0;
        weights[0] = 0.1;
        if (size > 1) weights[1] = 0.1;
    }

    let totalWeight = 0;
    for (let i = 0; i < size; i++) totalWeight += weights[i];

    let random = Math.random() * totalWeight;
    for (let i = 0; i < size; i++) {
        if (random < weights[i]) return i + 1;
        random -= weights[i];
    }

    return size;
}

module.exports = { clamp, rollWeightedDice, generateLuck };