const { getRedisClient } = require('../config/redis');
const Rolagem = require('../models/Rolagem');
const Rped = require('../models/Rped');
const User = require('../models/User');
const Guild = require('../models/Guild');
const { enqueue } = require('../utils/auditQueue');
const {
    HISTORY_USER_SIZE,
    HISTORY_GUILD_SIZE,
    HISTORY_DEFAULT_AVERAGE
} = require('../config/rpedConstants');

async function recordRollRedis(guildId, userId, displayFace, diceSize) {
    const redis = getRedisClient();
    const userKey  = `rped:guild:${guildId}:user:${userId}:hist`;
    const guildKey = `rped:guild:${guildId}:hist`;
    const normalizedValue = displayFace / diceSize;

    const pipeline = redis.pipeline();
    pipeline.lpush(userKey,  normalizedValue);
    pipeline.ltrim(userKey,  0, HISTORY_USER_SIZE - 1);
    pipeline.lpush(guildKey, normalizedValue);
    pipeline.ltrim(guildKey, 0, HISTORY_GUILD_SIZE - 1);

    await pipeline.exec().catch(err =>
        console.error('\x1b[35m[Redis]\x1b[0m \x1b[33mFalha no Pipeline de Histórico:\x1b[0m', err.message)
    );
}

function weightedAverage(arr, decay = 0.85) {
    if (!arr || arr.length === 0) return HISTORY_DEFAULT_AVERAGE;

    let weightedSum = 0;
    let totalWeight = 0;
    let currentWeight = 1.0;

    for (const val of arr) {
        weightedSum += Number(val) * currentWeight;
        totalWeight += currentWeight;
        currentWeight *= decay;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : HISTORY_DEFAULT_AVERAGE;
}

async function getAverages(guildId, userId) {
    const redis = getRedisClient();
    const userKey = `rped:guild:${guildId}:user:${userId}:hist`;
    const guildKey = `rped:guild:${guildId}:hist`;

    const [userHistory, guildHistory] = await Promise.all([
        redis.lrange(userKey, 0, -1),
        redis.lrange(guildKey, 0, -1)
    ]);

    return {
        individualAverage: weightedAverage(userHistory),
        globalAverage:     weightedAverage(guildHistory)
    };
}

function isKarmaActive(individualAverage, globalAverage, karmaThreshold) {
    return individualAverage > globalAverage + karmaThreshold;
}

function saveRollLog(rollData) {
    const { userId, guildId, diceSize, displayFace, stats } = rollData;
    const { systemAction, individualAverage, globalAverage } = stats;

    const isCritSuccess = displayFace === diceSize;
    const isCritFailure = displayFace === 1;

    // Prepara os documentos e operações
    const rolagemDocument = {
        usuarioId: userId,
        guildId: guildId,
        tipoDado: diceSize,
        faceExibida: displayFace,
        modificador: rollData.modifier,
        totalFinal: rollData.finalTotal,
        estatisticas: {
            mediaIndividual: individualAverage,
            mediaGlobal: globalAverage,
            nivelSorte: stats.luckLevel,
            acaoSistema: systemAction
        }
    };
    
    // Operação para o modelo User
    const userUpdate = User.findOneAndUpdate(
        { userId },
        { 
            $inc: { comandosUsados: 1 },
            // A média global de sorte do usuário será uma média entre a antiga e a nova
            $set: { mediaSorteGlobal: globalAverage } 
        },
        { upsert: true, new: true }
    );

    // Operação para o modelo Guild
    const guildUpdate = Guild.findOneAndUpdate(
        { guildId, 'usuarios.userId': userId },
        {
            $inc: {
                'usuarios.$.dadosRolados': 1,
                'usuarios.$.sucessosCriticos': isCritSuccess ? 1 : 0,
                'usuarios.$.falhasCriticas': isCritFailure ? 1 : 0,
            },
            $set: {
                'usuarios.$.mediaSorte': individualAverage
            }
        }
    ).then(result => {
        // Se o usuário não foi encontrado no array, adiciona-o
        if (!result) {
            return Guild.findOneAndUpdate(
                { guildId },
                { 
                    $addToSet: { 
                        usuarios: { 
                            userId,
                            dadosRolados: 1,
                            sucessosCriticos: isCritSuccess ? 1 : 0,
                            falhasCriticas: isCritFailure ? 1 : 0,
                            mediaSorte: individualAverage
                        } 
                    }
                },
                { upsert: true }
            );
        }
        return result;
    });

    // Operação para as estatísticas globais do RPED
    const rpedUpdate = Rped.findOneAndUpdate(
        { systemId: 'GRINMORIO_CORE' },
        {
            $inc: {
                'grandeObservador.totalDadosSorteados': 1,
                'grandeObservador.totalKarmasAplicados': systemAction === 'Karma' ? 1 : 0,
                'grandeObservador.totalResgatesAplicados': systemAction === 'Resgate' ? 1 : 0
            }
        },
        { upsert: true }
    );
    
    // Função que executa todas as escritas no banco
    const persist = async () => {
        await Promise.all([
            Rolagem.create(rolagemDocument),
            userUpdate,
            guildUpdate,
            rpedUpdate
        ]);
    };

    // Tenta executar e enfileira em caso de falha
    persist().catch((err) => {
        console.error('\x1b[34m[MongoDB]\x1b[0m \x1b[33mErro na auditoria, enfileirando:\x1b[0m', err.message);
        enqueue(persist, {}); // Os dados já estão no escopo da função persist
    });
}

module.exports = { recordRollRedis, getAverages, saveRollLog, isKarmaActive, weightedAverage };