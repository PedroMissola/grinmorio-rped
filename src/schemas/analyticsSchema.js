const { z } = require('zod');

const VALID_LEVELS = ['INFO', 'WARN', 'ERROR', 'FATAL', 'COMMAND', 'ANALYTICS', 'SYSTEM', 'SECURITY'];

const recordEventSchema = z.object({
    event: z
        .string({ required_error: 'O nome do evento é obrigatório.' })
        .min(1, 'O nome do evento não pode ser vazio.')
        .max(100, 'Nome do evento muito longo.'),

    details: z
        .record(z.unknown())
        .optional()
        .default({})
});

const saveLogSchema = z.object({
    level: z
        .enum(VALID_LEVELS, {
            errorMap: () => ({ message: `level deve ser um de: ${VALID_LEVELS.join(', ')}.` })
        })
        .default('INFO'),

    message: z
        .string()
        .min(1, 'message não pode ser vazio.')
        .max(500, 'message muito longa.')
        .optional(),

    details: z
        .record(z.unknown())
        .optional()
        .default({})
});

module.exports = { recordEventSchema, saveLogSchema };