const mongoose = require('mongoose');

const rpedSchema = new mongoose.Schema({
    systemId: { 
        type: String, 
        default: 'GRINMORIO_CORE', 
        unique: true, 
        required: true 
    },
    grandeObservador: {
        totalDadosSorteados: { type: Number, default: 0, min: 0 },
        totalKarmasAplicados: { type: Number, default: 0, min: 0 },
        totalResgatesAplicados: { type: Number, default: 0, min: 0 }
    },
    sorteGlobal: {
        modificadorAtual: { type: Number, default: 0 },
        ultimaMudanca: { type: Date, default: Date.now }
    }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Rped', rpedSchema);