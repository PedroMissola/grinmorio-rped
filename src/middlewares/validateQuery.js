function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            const erros = result.error.errors.map(e => ({
                campo: e.path.join('.'),
                mensagem: e.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Parâmetros de query inválidos.',
                detalhes: erros
            });
        }

        req.query = result.data;
        next();
    };
}

module.exports = { validateQuery };