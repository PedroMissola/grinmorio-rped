const Guild = require('../models/Guild');
const User = require('../models/User');
const { AppError } = require('../utils/AppError');

async function getGuildSettings(req, res, next) {
    try {
        const { guildId } = req.params;
        const guild = await Guild.findOne({ guildId });

        if (!guild) {
            // O bot trata 404 como "sem configurações", o que é o comportamento esperado.
            return res.status(404).json({ success: false, message: 'Servidor não encontrado.' });
        }

        res.status(200).json(guild.configs);
    } catch (error) {
        next(error);
    }
}

async function updateGuildSettings(req, res, next) {
    try {
        const { guildId } = req.params;
        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            throw new AppError('Objeto `settings` não fornecido ou inválido.', 400);
        }

        const updateData = {};
        const setOnInsertData = { guildId };

        // Mapeia os campos recebidos para o update
        if (settings.guildName !== undefined) {
            updateData.guildName = settings.guildName;
        }
        if (settings.memberCount !== undefined) updateData.memberCount = settings.memberCount;
        if (settings.isActive !== undefined) updateData.isActive = settings.isActive;
        if (settings.leftAt !== undefined) updateData.leftAt = settings.leftAt;
        if (settings.prefix !== undefined) updateData['configs.prefix'] = settings.prefix;
        if (settings.rollChannels !== undefined) updateData['configs.rollChannels'] = settings.rollChannels;
        if (settings.logChannelId !== undefined) updateData['configs.logChannelId'] = settings.logChannelId;
        if (settings.statsChannelId !== undefined) updateData['configs.statsChannelId'] = settings.statsChannelId;

        if (Object.keys(updateData).length === 0) {
            const existingGuild = await Guild.findOne({ guildId });
            if (existingGuild) {
                return res.status(200).json({ 
                    message: 'Nenhuma configuração válida para atualizar.', 
                    configs: existingGuild.configs 
                });
            }
        }
        
        const updatedGuild = await Guild.findOneAndUpdate(
            { guildId },
            { $set: updateData, $setOnInsert: setOnInsertData },
            { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ 
            message: 'Configurações da guilda atualizadas com sucesso.', 
            configs: updatedGuild.configs 
        });
    } catch (error) {
        next(error);
    }
}

async function syncGuildMembers(req, res, next) {
    try {
        const { guildId } = req.params;
        const { members } = req.body;

        if (!Array.isArray(members)) {
            throw new AppError('O campo `members` deve ser um array.', 400);
        }

        const guild = await Guild.findOne({ guildId });
        if (!guild) {
            throw new AppError('Guilda não encontrada para sincronização.', 404);
        }

        const userBulkOps = [];
        const guildMemberIds = new Set(guild.usuarios.map(u => u.userId));

        for (const member of members) {
            if (!member.userId) continue;

            // Prepara a operação para criar o usuário global se ele não existir
            userBulkOps.push({
                updateOne: {
                    filter: { userId: member.userId },
                    update: { $setOnInsert: { userId: member.userId } },
                    upsert: true
                }
            });

            // Adiciona o membro ao array da guilda apenas se ele não estiver lá
            if (!guildMemberIds.has(member.userId)) {
                guild.usuarios.push({ userId: member.userId });
            }
        }

        let userResult = { nUpserted: 0, nModified: 0 };
        if (userBulkOps.length > 0) {
            userResult = await User.bulkWrite(userBulkOps, { ordered: false });
        }

        await guild.save();
        
        res.status(200).json({
            success: true,
            message: 'Sincronização concluída.',
            usersCreated: userResult.nUpserted,
            membersAddedToGuild: guild.usuarios.length - guildMemberIds.size
        });

    } catch (error) {
        next(error);
    }
}


module.exports = { getGuildSettings, updateGuildSettings, syncGuildMembers };