function sanitizeParams(req, res, next) {
    const DANGEROUS_CHARS = /[\$\{\}\[\]]/;

    for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string' && DANGEROUS_CHARS.test(value)) {
            return res.status(400).json({
                success: false,
                error: `Parâmetro inválido: ${key}.`
            });
        }
    }

    next();
}

function deepSanitize(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) return obj.map(deepSanitize);

    return Object.fromEntries(
        Object.entries(obj)
            .filter(([key]) => !key.startsWith('$'))
            .map(([key, value]) => [key, deepSanitize(value)])
    );
}

function sanitizeBody(req, res, next) {
    req.body = deepSanitize(req.body);
    next();
}

module.exports = { sanitizeParams, sanitizeBody };