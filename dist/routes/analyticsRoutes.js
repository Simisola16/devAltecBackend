"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Visit_1 = require("../models/Visit");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply admin authentication to all analytics endpoints
router.use(auth_1.requireAdminAuth);
// GET /api/analytics/verify - Verify admin access token
router.get('/verify', (_req, res) => {
    res.json({ success: true, message: 'Admin authentication verified' });
});
// GET /api/analytics/stats - Overview metrics
router.get('/stats', async (_req, res) => {
    try {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalVisits, uniqueVisitorsArr, visits24h, visits7d, topCountries, topCities, topPages, devices, browsers, osList, recentActivity,] = await Promise.all([
            // Total visits
            Visit_1.Visit.countDocuments(),
            // Unique visitors count
            Visit_1.Visit.distinct('visitorId'),
            // Visits in last 24h
            Visit_1.Visit.countDocuments({ createdAt: { $gte: last24h } }),
            // Visits in last 7 days
            Visit_1.Visit.countDocuments({ createdAt: { $gte: last7d } }),
            // Top Countries
            Visit_1.Visit.aggregate([
                { $match: { country: { $ne: 'Unknown' } } },
                { $group: { _id: { country: '$country', code: '$countryCode' }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            // Top Cities
            Visit_1.Visit.aggregate([
                { $match: { city: { $ne: 'Unknown' } } },
                { $group: { _id: { city: '$city', country: '$country', region: '$region' }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            // Top Pages
            Visit_1.Visit.aggregate([
                { $group: { _id: '$page', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            // Device types
            Visit_1.Visit.aggregate([
                { $group: { _id: '$deviceType', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            // Browsers
            Visit_1.Visit.aggregate([
                { $group: { _id: '$browser', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 6 },
            ]),
            // Operating systems
            Visit_1.Visit.aggregate([
                { $group: { _id: '$os', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 6 },
            ]),
            // Timeline (Last 14 days)
            Visit_1.Visit.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);
        res.json({
            success: true,
            data: {
                totalVisits,
                uniqueVisitors: uniqueVisitorsArr.length,
                visits24h,
                visits7d,
                topCountries: topCountries.map((c) => ({
                    country: c._id.country,
                    countryCode: c._id.code,
                    count: c.count,
                })),
                topCities: topCities.map((c) => ({
                    city: c._id.city,
                    country: c._id.country,
                    region: c._id.region,
                    count: c.count,
                })),
                topPages: topPages.map((p) => ({ page: p._id, count: p.count })),
                devices: devices.map((d) => ({ device: d._id || 'Desktop', count: d.count })),
                browsers: browsers.map((b) => ({ browser: b._id, count: b.count })),
                osList: osList.map((o) => ({ os: o._id, count: o.count })),
                recentActivity: recentActivity.map((r) => ({ date: r._id, count: r.count })),
            },
        });
    }
    catch (error) {
        console.error('[Analytics Stats Error]:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve analytics stats' });
    }
});
// GET /api/analytics/visits - Paginated detailed visits log
router.get('/visits', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
        const skip = (page - 1) * limit;
        const { search, country, city, pagePath, device } = req.query;
        const filter = {};
        if (country) {
            filter.country = country;
        }
        if (city) {
            filter.city = city;
        }
        if (pagePath) {
            filter.page = pagePath;
        }
        if (device) {
            filter.deviceType = device;
        }
        if (search && typeof search === 'string') {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { city: regex },
                { country: regex },
                { ip: regex },
                { page: regex },
                { isp: regex },
                { browser: regex },
                { os: regex },
            ];
        }
        const [visits, total] = await Promise.all([
            Visit_1.Visit.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Visit_1.Visit.countDocuments(filter),
        ]);
        res.json({
            success: true,
            data: {
                visits,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    }
    catch (error) {
        console.error('[Analytics Visits Error]:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve visits log' });
    }
});
// DELETE /api/analytics/visits/:id - Delete a specific record
router.delete('/visits/:id', async (req, res) => {
    try {
        const deleted = await Visit_1.Visit.findByIdAndDelete(req.params.id);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Visit not found' });
            return;
        }
        res.json({ success: true, message: 'Visit record removed' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete visit' });
    }
});
exports.default = router;
