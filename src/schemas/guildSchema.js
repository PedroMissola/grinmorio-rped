const { z } = require('zod');

const updateGuildSettingsSchema = z.object({
    settings: z
        .object({
            // Campos que o bot envia na sincronização
            guildName: z.string().optional(),
            memberCount: z.number().int().positive().optional(),
            isActive: z.boolean().optional(),
            leftAt: z.date().nullable().optional(),

            // Campos de configuração real
            prefix: z
                .string()
                .min(1, 'Prefix não pode ser vazio.')
                .max(3, 'Prefix deve ter no máximo 3 caracteres.')
                .optional(),

            rollChannels: z
                .array(
                    z.string().min(1).max(30)
                )
                .max(50, 'Limite de 50 canais permitidos.')
                .optional(),

            logChannelId: z
                .string()
                .max(30)
                .regex(/^\d+$/, 'logChannelId deve conter apenas dígitos.')
                .nullable()
                .optional(),

            statsChannelId: z
                .string()
                .max(30)
                .regex(/^\d+$/, 'statsChannelId deve conter apenas dígitos.')
                .nullable()
                .optional()
        })
        .strict()
});

module.exports = { updateGuildSettingsSchema };