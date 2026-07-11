const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

async function connectMongo() {
    const certsDir = path.join(process.cwd(), 'certs', 'mongo');

    const caFile = path.join(certsDir, 'ca-certificate.crt');
    const certFile = path.join(certsDir, 'certificate.pem');
    const keyFile = path.join(certsDir, 'private-key.key');

    [caFile, certFile, keyFile].forEach(file => {
        if (!fs.existsSync(file)) throw new Error(`[MongoDB] Certificado não encontrado: ${file}`);
    });

    const options = {
        tls: true,
        tlsCAFile: caFile,
        tlsCertificateKeyFile: certFile,
        tlsAllowInvalidCertificates: false,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        family: 4,

        maxPoolSize: 10,
        minPoolSize: 2,

        maxIdleTimeMS: 30000,

        heartbeatFrequencyMS: 10000
    };

    mongoose.connection.on('disconnected', () => {
        console.warn('\x1b[34m[MongoDB]\x1b[0m \x1b[33mDesconectado. Mongoose tentará reconectar automaticamente.\x1b[0m');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('\x1b[34m[MongoDB]\x1b[0m \x1b[32mReconectado com sucesso.\x1b[0m');
    });

    const maxRetries = 5;
    const retryDelay = 3000;

    for (let i = 1; i <= maxRetries; i++) {
        try {
            console.log(`\x1b[34m[MongoDB]\x1b[0m Tentativa de conexão ${i}/${maxRetries}...`);
            await mongoose.connect(process.env.MONGO_URI, options);
            console.log('\x1b[34m[MongoDB]\x1b[0m \x1b[32mConectado com sucesso.\x1b[0m');
            return;
        } catch (error) {
            console.error(`\x1b[34m[MongoDB]\x1b[0m \x1b[33mFalha na tentativa ${i}:\x1b[0m ${error.message}`);
            if (i === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

module.exports = { connectMongo };