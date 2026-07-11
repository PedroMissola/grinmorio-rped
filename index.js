require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const { connectMongo } = require('./src/config/mongo');
const { connectRedis, getRedisClient } = require('./src/config/redis');
const { authenticate } = require('./src/middlewares/authenticate');
const { sanitizeBody } = require('./src/middlewares/sanitize');
const { errorHandler } = require('./src/middlewares/errorHandler');
const { AppError } = require('./src/utils/AppError');
const { getQueueStats } = require('./src/utils/auditQueue');

const rollRoutes = require('./src/routes/rollRoutes');
const guildRoutes = require('./src/routes/guildRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const playerStatusRoutes = require('./src/routes/playerStatusRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 80;

const pingWithTimeout = (promise, ms = 3000) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout de verificação excedido')), ms)
        )
    ]);

const QUEUE_DEGRADED_THRESHOLD = parseInt(process.env.AUDIT_QUEUE_DEGRADED_THRESHOLD, 10) || 400;

app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Limite de requisições excedido. Tente novamente em 1 minuto.' }
});
app.use(globalLimiter);

app.use(express.json({ limit: '10kb' }));

app.use(sanitizeBody);

app.get('/health', async (req, res) => {
    const healthResult = {
        status: 'ONLINE',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        services: {
            api: 'ONLINE',
            mongodb: 'VERIFYING',
            redis: 'VERIFYING'
        },
        system: {
            auditQueue: getQueueStats(),
            memory: {
                rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
            }
        }
    };

    let isHealthy = true;

    try {
        if (mongoose.connection.readyState === 1) {
            await pingWithTimeout(mongoose.connection.db.command({ ping: 1 }));
            healthResult.services.mongodb = 'ONLINE';
        } else {
            healthResult.services.mongodb = 'OFFLINE';
            isHealthy = false;
        }
    } catch (error) {
        healthResult.services.mongodb = 'ERROR';
        healthResult.mongoError = 'Falha na conexão ou timeout de resposta'; 
        isHealthy = false;
        console.error('\x1b[31m[Health Check]\x1b[0m Erro interno MongoDB:', error.message);
    }

    try {
        const redis = getRedisClient();
        const pingResponse = await pingWithTimeout(redis.ping());
        
        if (pingResponse === 'PONG') {
            healthResult.services.redis = 'ONLINE';
        } else {
            healthResult.services.redis = 'OFFLINE';
            isHealthy = false;
        }
    } catch (error) {
        healthResult.services.redis = 'ERROR';
        healthResult.redisError = 'Falha na conexão ou timeout de resposta';
        isHealthy = false;
        console.error('\x1b[31m[Health Check]\x1b[0m Erro interno Redis:', error.message);
    }

    if (healthResult.system.auditQueue.pendente > QUEUE_DEGRADED_THRESHOLD) {
        healthResult.status = 'DEGRADED';
    }

    if (!isHealthy) {
        healthResult.status = 'OFFLINE';
    }

    res.status(isHealthy ? 200 : 503).json(healthResult);
});

app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));
app.use('/dashboard', dashboardRoutes);

app.use('/api', authenticate);
app.use('/api', rollRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api', analyticsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', playerStatusRoutes);

app.get('/', (req, res) => {
    res.redirect('/dashboard/');
});

app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

app.use((req, res, next) => {
    next(new AppError('A rota solicitada não foi encontrada neste servidor.', 404));
});

app.use(errorHandler);

app.use((err, req, res, next) => {
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }

    console.error('\x1b[31m[ERRO INESPERADO]\x1b[0m', err);

    res.status(500).json({
        success: false,
        error: 'Ocorreu um erro inesperado no servidor.'
    });
});

async function startServer() {
    try {
        console.log('\x1b[36m[RPED] Iniciando o Mestre de Jogo Digital...\x1b[0m');

        await connectMongo();
        await connectRedis();

        app.listen(PORT, () => {
            console.log(`\x1b[32m[RPED API] Servidor rodando na porta ${PORT}.\x1b[0m`);
            console.log('\x1b[32m[RPED API] Sistema pronto para processar rolagens.\x1b[0m');
        });

    } catch (error) {
        console.error('\x1b[31m[RPED API] Falha crítica na inicialização:\x1b[0m', error.message);
        process.exit(1);
    }
}

startServer();