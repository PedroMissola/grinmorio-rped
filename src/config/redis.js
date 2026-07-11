const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

let redisClient;

async function connectRedis() {
    // Verificar se os certificados existem ANTES de tentar conectar
    const certsDir = path.join(process.cwd(), 'certs', 'redis');

    console.log(`\x1b[35m[Redis]\x1b[0m Procurando certificados em: ${certsDir}`);

    // Listar arquivos para debug
    if (fs.existsSync(certsDir)) {
        const files = fs.readdirSync(certsDir);
        console.log(`\x1b[35m[Redis]\x1b[0m Arquivos encontrados: ${files.join(', ')}`);
    } else {
        console.error(`\x1b[35m[Redis]\x1b[0m Diretório de certificados não encontrado: ${certsDir}`);
    }

    const getCertBuffer = (filename) => {
        const filePath = path.join(certsDir, filename);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Certificado Redis não encontrado: ${filePath}`);
        }
        return fs.readFileSync(filePath);
    };

    const tlsConfig = {
        ca: getCertBuffer('ca-certificate.crt'),
        cert: getCertBuffer('certificate.pem'),
        key: getCertBuffer('private-key.key'),
        rejectUnauthorized: true,
        checkServerIdentity: () => undefined
    };

    const redisOptions = {
        tls: tlsConfig,
        maxRetriesPerRequest: 20,
        enableReadyCheck: true,
        connectTimeout: 15000,
        lazyConnect: true,
        // 👇 ESSENCIAL: Keep-alive para evitar quedas
        keepAlive: 30000,           // 30 segundos
        keepAliveInitialDelay: 5000, // 5 segundos iniciais
        retryStrategy(times) {
            if (times > 10) {
                console.error('\x1b[35m[Redis]\x1b[0m Limite de tentativas atingido. Encerrando retries.');
                return null;
            }
            const delay = Math.min(times * 1000, 10000); // Backoff mais agressivo
            console.log(`\x1b[35m[Redis]\x1b[0m Reconexão ${times}/10 em ${delay}ms...`);
            return delay;
        },
        // 👇 Monitorar health check
        connectionName: 'rped-api',
    };

    redisClient = new Redis(process.env.REDIS_URI, redisOptions);

    redisClient.on('error', (err) => {
        console.error(`\x1b[35m[Redis]\x1b[0m Erro: ${err.message} (código: ${err.code})`);
    });

    redisClient.on('reconnecting', () => {
        console.log('\x1b[35m[Redis]\x1b[0m Reconectando...');
    });

    redisClient.on('close', () => {
        console.log('\x1b[35m[Redis]\x1b[0m Conexão fechada.');
    });

    redisClient.on('end', () => {
        console.log('\x1b[35m[Redis]\x1b[0m Conexão encerrada pelo servidor.');
    });

    await redisClient.connect();
    console.log('\x1b[35m[Redis]\x1b[0m \x1b[32mConectado via TLS.\x1b[0m');

    // 👇 Fazer um ping para manter a conexão viva
    setInterval(async () => {
        try {
            if (redisClient && redisClient.status === 'ready') {
                await redisClient.ping();
            }
        } catch (err) {
            console.error('\x1b[35m[Redis]\x1b[0m Erro no ping:', err.message);
        }
    }, 60000); // A cada 1 minuto
}

function getRedisClient() {
    if (!redisClient) throw new Error('Redis não inicializado. Chame connectRedis() primeiro.');
    return redisClient;
}

module.exports = { connectRedis, getRedisClient };