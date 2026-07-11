const User = require('../models/User');
const Guild = require('../models/Guild');
const Rolagem = require('../models/Rolagem');
const Rped = require('../models/Rped');
const { AppError } = require('../utils/AppError');

async function getBotStats(req, res, next) {
    try {
        const totalJogadores = await User.countDocuments();
        const totalServidores = await Guild.countDocuments();
        const rolagensUltimos30Dias = await Rolagem.countDocuments();
        
        let rpedCore = await Rped.findOne({ systemId: 'GRINMORIO_CORE' });
        
        const statsBase = rpedCore ? rpedCore.grandeObservador : { 
            totalDadosSorteados: 0, 
            totalKarmasAplicados: 0,
            totalResgatesAplicados: 0
        };

        res.status(200).json({
            success: true,
            stats: {
                servidoresAtivos: totalServidores,
                jogadoresRegistrados: totalJogadores,
                dadosSorteadosHistorico: statsBase.totalDadosSorteados,
                rolagensRecentes: rolagensUltimos30Dias,
                intervencoesDoSistema: {
                    karma: statsBase.totalKarmasAplicados,
                    resgate: statsBase.totalResgatesAplicados
                }
            }
        });
    } catch (error) {
        next(error);
    }
}

async function getGuildStats(req, res, next) {
    try {
        const { guildId } = req.params;
        const guild = await Guild.findOne({ guildId });
        
        if (!guild) {
            throw new AppError('Servidor não encontrado no banco de dados.', 404);
        }

        let totalRolados = 0;
        let totalCriticos = 0;
        let totalFalhas = 0;

        guild.usuarios.forEach(jogador => {
            totalRolados += jogador.dadosRolados;
            totalCriticos += jogador.sucessosCriticos;
            totalFalhas += jogador.falhasCriticas;
        });

        res.status(200).json({
            success: true,
            stats: {
                totalJogadoresNaMesa: guild.usuarios.length,
                totalDadosRolados: totalRolados,
                sucessosCriticos: totalCriticos,
                falhasCriticas: totalFalhas,
                taxaCriticos: totalRolados > 0 ? ((totalCriticos / totalRolados) * 100).toFixed(2) + '%' : '0%'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function getUserStats(req, res, next) {
    try {
        const { userId } = req.params;
        
        const user = await User.findOne({ userId });
        const rolagensRecentes = await Rolagem.find({ usuarioId: userId }).sort({ data: -1 }).limit(10);

        if (!user && rolagensRecentes.length === 0) {
            throw new AppError('Usuário não encontrado ou sem atividade recente.', 404);
        }

        res.status(200).json({
            success: true,
            stats: {
                nivelAcesso: user ? user.permissaoBot : 'Desconhecido',
                mediaSorteGlobal: user ? user.mediaSorteGlobal.toFixed(2) : 10.50,
                comandosUtilizados: user ? user.comandosUsados : 0,
                historicoRecente: rolagensRecentes.map(r => ({
                    dado: `d${r.tipoDado}`,
                    resultado: r.faceExibida,
                    modificador: r.modificador,
                    total: r.totalFinal,
                    data: r.data
                }))
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getBotStats, getGuildStats, getUserStats };