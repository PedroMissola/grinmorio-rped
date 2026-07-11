const API_CLIENTS = {
    [process.env.BOT_API_KEY]: {
        name: 'grinmorio-bot',
        secret: process.env.BOT_API_SECRET
    }
};

// Suporte a múltiplos clientes internos no futuro:
// [process.env.DASHBOARD_API_KEY]: {
//     name: 'grinmorio-dashboard',
//     secret: process.env.DASHBOARD_API_SECRET
// }

function getClient(apiKey) {
    return API_CLIENTS[apiKey] || null;
}

module.exports = { getClient };