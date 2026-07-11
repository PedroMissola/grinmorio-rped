const crypto = require('crypto');

const STATIC_EXTENSIONS = /\.(html|css|js|ico|png|jpg|svg|woff2?)$/i;

function dashboardAuth(req, res, next) {
    const path = req.path;

    if (STATIC_EXTENSIONS.test(path)) return next();
    if (path === '/login' || path === '/login.html') return next();
    if (!path.startsWith('/api')) return next();

    const secret = process.env.DASHBOARD_SECRET;

    if (!secret) {
        console.error('\x1b[31m[Dashboard]\x1b[0m DASHBOARD_SECRET não definido no .env.');
        return res.status(503).json({ success: false, message: 'Serviço não configurado.' });
    }

    const token = req.headers['x-dashboard-token'];

    if (!token) {
        const isApiFetch = req.headers['accept']?.includes('application/json') || req.xhr;
        if (isApiFetch) {
            return res.status(401).json({ success: false, message: 'Token ausente.' });
        }
        return res.redirect('/dashboard/login.html');
    }

    const tokenBuf  = Buffer.alloc(128);
    const secretBuf = Buffer.alloc(128);
    tokenBuf.write(token);
    secretBuf.write(secret);

    const isValid = crypto.timingSafeEqual(tokenBuf, secretBuf);

    if (!isValid) {
        return res.status(401).json({ success: false, message: 'Token inválido.' });
    }

    next();
}

module.exports = { dashboardAuth };