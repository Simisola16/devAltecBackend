import { Router, Request, Response } from 'express';
import { Visit } from '../models/Visit';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

// Apply admin authentication to all analytics endpoints
router.use(requireAdminAuth);

// GET /api/analytics/verify - Verify admin access token
router.get('/verify', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Admin authentication verified' });
});

// GET /api/analytics/stats - Overview metrics
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalVisits,
      uniqueVisitorsArr,
      visits24h,
      visits7d,
      topCountries,
      topCities,
      topPages,
      devices,
      browsers,
      osList,
      recentActivity,
    ] = await Promise.all([
      // Total visits
      Visit.countDocuments(),

      // Unique visitors count
      Visit.distinct('visitorId'),

      // Visits in last 24h
      Visit.countDocuments({ createdAt: { $gte: last24h } }),

      // Visits in last 7 days
      Visit.countDocuments({ createdAt: { $gte: last7d } }),

      // Top Countries
      Visit.aggregate([
        { $match: { country: { $ne: 'Unknown' } } },
        { $group: { _id: { country: '$country', code: '$countryCode' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Top Cities
      Visit.aggregate([
        { $match: { city: { $ne: 'Unknown' } } },
        { $group: { _id: { city: '$city', country: '$country', region: '$region' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Top Pages
      Visit.aggregate([
        { $group: { _id: '$page', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Device types
      Visit.aggregate([
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Browsers
      Visit.aggregate([
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),

      // Operating systems
      Visit.aggregate([
        { $group: { _id: '$os', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),

      // Timeline (Last 14 days)
      Visit.aggregate([
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
  } catch (error) {
    console.error('[Analytics Stats Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve analytics stats' });
  }
});

// GET /api/analytics/visits - Paginated detailed visits log
router.get('/visits', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const skip = (page - 1) * limit;

    const { search, country, city, pagePath, device } = req.query;

    const filter: Record<string, any> = {};

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
      Visit.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Visit.countDocuments(filter),
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
  } catch (error) {
    console.error('[Analytics Visits Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve visits log' });
  }
});

// DELETE /api/analytics/visits/:id - Delete a specific record
router.delete('/visits/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Visit.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Visit not found' });
      return;
    }
    res.json({ success: true, message: 'Visit record removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete visit' });
  }
});

export default router;
