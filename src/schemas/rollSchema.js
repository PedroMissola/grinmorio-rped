const { z } = require('zod');

const rollSchema = z.object({
    guildId: z
        .string({ required_error: 'guildId é obrigatório.' })
        .min(1, 'guildId não pode ser vazio.')
        .max(30, 'guildId fora do tamanho esperado.')
        .regex(/^\d+$/, 'guildId deve conter apenas dígitos.'),

    usuarioId: z
        .string({ required_error: 'usuarioId é obrigatório.' })
        .min(1, 'usuarioId não pode ser vazio.')
        .max(30, 'usuarioId fora do tamanho esperado.')
        .regex(/^\d+$/, 'usuarioId deve conter apenas dígitos.'),

    tamanhoDado: z
        .number()
        .int('tamanhoDado deve ser um número inteiro.')
        .min(4, 'Dado mínimo permitido: d4.')
        .max(1000, 'Dado máximo permitido: d1000.')
        .default(20),

    modificador: z
        .number()
        .int('modificador deve ser um número inteiro.')
        .min(-100, 'Modificador muito baixo.')
        .max(100, 'Modificador muito alto.')
        .default(0)
});

module.exports = { rollSchema };