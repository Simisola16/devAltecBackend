"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ua_parser_js_1 = require("ua-parser-js");
const Visit_1 = require("../models/Visit");
const geoService_1 = require("../services/geoService");
const router = (0, express_1.Router)();
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const list = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        if (list)
            return list.trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (realIp && typeof realIp === 'string')
        return realIp.trim();
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp && typeof cfIp === 'string')
        return cfIp.trim();
    return req.socket.remoteAddress || '127.0.0.1';
};
// POST /api/track - Ingests a new page view event
router.post('/', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        const { visitorId, sessionId, page, fullUrl, referrer, screenResolution, language, isFirstVisit, clientGeo, // Optional client-side high-precision coordinates if allowed
         } = req.body;
        // Parse User Agent
        const rawUa = req.headers['user-agent'] || '';
        const parser = new ua_parser_js_1.UAParser(rawUa);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = parser.getDevice();
        const browserStr = browser.name ? `${browser.name} ${browser.version || ''}`.trim() : 'Unknown Browser';
        const osStr = os.name ? `${os.name} ${os.version || ''}`.trim() : 'Unknown OS';
        const deviceType = device.type ? device.type.charAt(0).toUpperCase() + device.type.slice(1) : 'Desktop';
        // Fetch IP Geolocation
        const geo = await (0, geoService_1.lookupIpGeo)(clientIp);
        // If client supplied verified GPS latitude/longitude, prioritize for extra accuracy
        const finalLat = clientGeo?.latitude ?? geo.latitude;
        const finalLon = clientGeo?.longitude ?? geo.longitude;
        const visit = await Visit_1.Visit.create({
            visitorId: visitorId || `anon_${Date.now()}`,
            sessionId: sessionId || `sess_${Date.now()}`,
            ip: geo.ip || clientIp,
            country: geo.country,
            countryCode: geo.countryCode,
            region: geo.region,
            city: geo.city,
            postalCode: geo.postalCode,
            latitude: finalLat,
            longitude: finalLon,
            timezone: geo.timezone,
            isp: geo.isp,
            org: geo.org,
            page: page || '/',
            fullUrl: fullUrl || '',
            referrer: referrer || 'Direct',
            browser: browserStr,
            os: osStr,
            deviceType: deviceType,
            screenResolution: screenResolution || 'Unknown',
            language: language || 'en',
            isFirstVisit: Boolean(isFirstVisit),
        });
        res.status(201).json({
            success: true,
            visitId: visit._id,
            location: {
                city: visit.city,
                region: visit.region,
                country: visit.country,
                countryCode: visit.countryCode,
            },
        });
    }
    catch (error) {
        console.error('[Track Error]:', error);
        res.status(500).json({ success: false, message: 'Failed to record visit' });
    }
});
// POST /api/track/duration - Updates session reading duration
router.post('/duration', async (req, res) => {
    try {
        const { visitId, durationSeconds } = req.body;
        if (visitId && typeof durationSeconds === 'number') {
            await Visit_1.Visit.findByIdAndUpdate(visitId, { durationSeconds });
        }
        res.status(200).json({ success: true });
    }
    catch (err) {
        res.status(200).json({ success: true }); // Silent fail for unload beacons
    }
});
exports.default = router;
