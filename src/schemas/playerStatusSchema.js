const { z } = require('zod');

const playerStatusSchema = z.object({
    guildId: z
        .string({ required_error: 'guildId é obrigatório.' })
        .min(1, 'guildId não pode ser vazio.')
        .max(30, 'guildId fora do tamanho esperado.')
        .regex(/^\d+$/, 'guildId deve conter apenas dígitos.'),

    userId: z
        .string({ required_error: 'userId é obrigatório.' })
        .min(1, 'userId não pode ser vazio.')
        .max(30, 'userId fora do tamanho esperado.')
        .regex(/^\d+$/, 'userId deve conter apenas dígitos.')
});

module.exports = { playerStatusSchema };