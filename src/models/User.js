const mongoose = require('mongoose');

const punicaoSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['ban', 'warn'], required: true },
    motivo: { type: String, default: 'Não especificado' },
    data: { type: Date, default: Date.now },
    expiraEm: { type: Date, default: null }
}, { _id: false });

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    comandosUsados: { type: Number, default: 0, min: 0 },
    mediaSorteGlobal: { type: Number, default: 10.5 },
    punicoes: [punicaoSchema],
    permissaoBot: { 
        type: String, 
        default: 'jogador', 
        enum: ['jogador', 'suporte', 'desenvolvedor']
    }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('User', userSchema);