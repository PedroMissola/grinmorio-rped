const mongoose = require('mongoose');

const guildMemberSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    dadosRolados: { type: Number, default: 0, min: 0 },
    mediaSorte: { type: Number, default: 10.5 },
    sucessosCriticos: { type: Number, default: 0, min: 0 },
    falhasCriticas: { type: Number, default: 0, min: 0 }
}, { _id: false });

const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    guildName: { type: String, required: true, default: 'Nome Desconhecido' },
    memberCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    leftAt: { type: Date, default: null },
    configs: {
        prefix: { type: String, default: '!', maxlength: 3 },
        rollChannels: { type: [String], default: ['all'] },
        logChannelId: { type: String, default: null },
        statsChannelId: { type: String, default: null }
    },
    roles: {
        adminRoleIds: [String],
        mestreRoleIds: [String]
    },
    usuarios: [guildMemberSchema]
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Guild', guildSchema);