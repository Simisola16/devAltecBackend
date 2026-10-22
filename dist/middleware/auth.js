"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminAuth = void 0;
const requireAdminAuth = (req, res, next) => {
    const secretKey = process.env.ADMIN_SECRET_KEY || 'devaltec_admin_secret_2026';
    // Check header, query param, or Bearer token
    const headerKey = req.headers['x-admin-key'];
    const queryKey = req.query.key;
    const authHeader = req.headers.authorization;
    const bearerKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const providedKey = headerKey || queryKey || bearerKey;
    if (!providedKey || providedKey !== secretKey) {
        res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid or missing admin key',
        });
        return;
    }
    next();
};
exports.requireAdminAuth = requireAdminAuth;
