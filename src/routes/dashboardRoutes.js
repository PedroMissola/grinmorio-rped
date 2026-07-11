const express = require('express');
const path    = require('path');
const User    = require('../models/User');
const Guild   = require('../models/Guild');
const router  = express.Router();

const PAGE_SIZE = 50;

// ── Páginas HTML ──────────────────────────────────────────────────────────────
// Arquivos estáticos já são servidos pelo express.static no index.js.
// Estas rotas existem para que URLs como /dashboard/user/123 não retornem 404.

router.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dashboard', 'index.html'));
});

router.get('/user/:userId', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dashboard', 'user.html'));
});

// ── API: listagem global de usuários (com paginação) ─────────────────────────
// GET /dashboard/api/users?page=1
router.get('/api/users', async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page) || 1);
        const skip  = (page - 1) * PAGE_SIZE;

        const [users, total] = await Promise.all([
            User.find({}, 'userId mediaSorteGlobal comandosUsados permissaoBot createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(PAGE_SIZE)
                .lean(),
            User.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            pagination: {
                page,
                pageSize: PAGE_SIZE,
                total,
                totalPages: Math.ceil(total / PAGE_SIZE)
            },
            data: users
        });
    } catch (error) {
        console.error('[Dashboard] Erro em /api/users:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao carregar usuários.' });
    }
});

// ── API: detalhes de um usuário ───────────────────────────────────────────────
// GET /dashboard/api/users/:userId
//
// Retorna:
//   - dados globais do usuário (User)
//   - lista das guildas onde ele está, com APENAS os dados dele dentro de cada
//     guilda — sem expor dados de outros membros ou configs internas.
router.get('/api/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne(
            { userId },
            'userId mediaSorteGlobal comandosUsados permissaoBot createdAt'
        ).lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        // $elemMatch garante que o array `usuarios` retornado contenha
        // somente o subdocumento do usuário em questão — sem vazar dados
        // de outros membros da mesma guilda.
        const guilds = await Guild.find(
            { 'usuarios.userId': userId },
            {
                guildId:  1,
                guildName: 1,
                usuarios: { $elemMatch: { userId } }
            }
        ).lean();

        // Achata a estrutura: em vez de guild.usuarios[0], expõe guild.memberData
        const guildsFormatted = guilds.map(g => ({
            guildId:    g.guildId,
            guildName:  g.guildName,
            memberData: g.usuarios?.[0] ?? null
        }));

        res.status(200).json({ success: true, data: { user, guilds: guildsFormatted } });
    } catch (error) {
        console.error(`[Dashboard] Erro em /api/users/${req.params.userId}:`, error);
        res.status(500).json({ success: false, message: 'Erro interno ao carregar detalhes do usuário.' });
    }
});

router.get('/api/guilds/:guildId/users', async (req, res) => {
    try {
        const { guildId } = req.params;

        const guild = await Guild.findOne({ guildId }, 'guildId usuarios').lean();

        if (!guild) {
            return res.status(404).json({ success: false, message: 'Guilda não encontrada.' });
        }

        res.status(200).json({
            success: true,
            count: guild.usuarios.length,
            data:  guild.usuarios
        });
    } catch (error) {
        console.error(`[Dashboard] Erro em /api/guilds/${req.params.guildId}/users:`, error);
        res.status(500).json({ success: false, message: 'Erro interno ao carregar usuários da guilda.' });
    }
});

module.exports = router;