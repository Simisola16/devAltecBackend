"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const trackRoutes_1 = __importDefault(require("./routes/trackRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const inquiryRoutes_1 = __importDefault(require("./routes/inquiryRoutes"));
// Resolve .env robustly across working directories
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), 'backend/.env') });
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Connect to MongoDB Atlas
(0, db_1.connectDB)();
// Middleware
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server) or localhost
        if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
            callback(null, true);
            return;
        }
        callback(null, true); // Permissive for client tracking across domains
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Trust proxy headers (crucial for accurate visitor IP behind Nginx/Vercel/Render)
app.set('trust proxy', true);
// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        status: 'online',
        service: 'devAltec Analytics & Project Intake Engine',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            track: '/api/track',
            analytics: '/api/analytics/summary',
            inquiries: '/api/inquiries',
        },
    });
});
// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'online',
        service: 'devAltec Analytics & Tracking Engine',
        timestamp: new Date().toISOString(),
    });
});
// Routes
app.use('/api/track', trackRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/inquiries', inquiryRoutes_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});
// Start Server
const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[devAltec Backend] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[devAltec Backend] MongoDB connected to cluster: devaltecv.zhhbtid.mongodb.net`);
});
// Handle graceful termination
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => process.exit(0));
});
exports.default = app;
