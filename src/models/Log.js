const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    level: { 
        type: String, 
        enum: ['INFO', 'WARN', 'ERROR', 'FATAL', 'COMMAND', 'ANALYTICS', 'SYSTEM', 'SECURITY'], 
        required: true 
    },
    evento: { type: String, required: true, index: true },
    mensagem: { type: String, required: true },
    detalhes: { type: mongoose.Schema.Types.Mixed, default: {} },
    guildId: { type: String, index: true },
    usuarioId: { type: String, index: true },
    data: { type: Date, default: Date.now, expires: '60d' }
}, { timestamps: false, versionKey: false });

logSchema.index({ level: 1, data: -1 });

module.exports = mongoose.model('Log', logSchema);