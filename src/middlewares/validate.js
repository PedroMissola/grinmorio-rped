const { ZodError } = require('zod');

function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const erros = result.error.errors.map(e => ({
                campo: e.path.join('.'),
                mensagem: e.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Dados de entrada inválidos.',
                detalhes: erros
            });
        }

        req.body = result.data;
        next();
    };
}

module.exports = { validate };