const { AppError } = require('../utils/AppError');

function normalizeError(err) {
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return new AppError(`Dados inválidos: ${messages.join('. ')}`, 400);
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'campo';
        return new AppError(`Valor duplicado no campo: ${field}.`, 409);
    }

    if (err.name === 'CastError') {
        return new AppError(`Formato inválido para o campo: ${err.path}.`, 400);
    }

    if (err.type === 'entity.parse.failed') {
        return new AppError('Body da requisição com JSON inválido.', 400);
    }

    if (err.type === 'entity.too.large') {
        return new AppError('Body da requisição excede o tamanho permitido.', 413);
    }

    return err;
}

function errorHandler(err, req, res, next) {
    const normalizedErr = normalizeError(err);

    const statusCode = normalizedErr.statusCode || 500;
    const isOperational = normalizedErr.isOperational || false;

    if (isOperational) {
        console.warn(
            `\x1b[33m[API Warn]\x1b[0m ${req.method} ${req.path} → ${statusCode}: ${normalizedErr.message}`
        );
    } else {
        console.error(
            `\x1b[31m[API Error]\x1b[0m ${req.method} ${req.path} → Stack:\n${normalizedErr.stack}`
        );
    }

    res.status(statusCode).json({
        success: false,
        error: isOperational
            ? normalizedErr.message
            : 'Erro interno no servidor. Verifique os logs.'
    });
}

module.exports = { errorHandler };