const mongoose = require('mongoose');

const rolagemSchema = new mongoose.Schema({
    usuarioId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    tipoDado: { type: Number, required: true, min: 2, max: 1000 },
    faceExibida: { type: Number, required: true },
    modificador: { type: Number, required: true },
    totalFinal: { type: Number, required: true },
    estatisticas: {
        mediaIndividual: Number,
        mediaGlobal: Number,
        nivelSorte: Number,
        acaoSistema: { type: String, enum: ['Nenhuma', 'Karma', 'Resgate'], default: 'Nenhuma' }
    },
    data: { type: Date, default: Date.now, expires: '30d' }
}, { timestamps: false, versionKey: false });

rolagemSchema.index({ guildId: 1, usuarioId: 1 });

module.exports = mongoose.model('Rolagem', rolagemSchema);