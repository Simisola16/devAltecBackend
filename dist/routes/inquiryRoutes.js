"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Inquiry_1 = require("../models/Inquiry");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/inquiries - Public endpoint to submit a project inquiry
router.post('/', async (req, res) => {
    try {
        const { name, email, company, projectType, budget, timeline, description } = req.body;
        if (!name || !email || !description) {
            res.status(400).json({ success: false, message: 'Name, email, and description are required.' });
            return;
        }
        const inquiryId = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const inquiry = await Inquiry_1.Inquiry.create({
            inquiryId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            company: company ? company.trim() : '',
            projectType: projectType || 'General Full-Stack Project',
            budget: budget || 'Not specified',
            timeline: timeline || 'Flexible',
            description: description.trim(),
            status: 'New',
        });
        res.status(201).json({
            success: true,
            message: 'Inquiry received successfully',
            inquiryId: inquiry.inquiryId,
            receivedAt: inquiry.createdAt,
        });
    }
    catch (error) {
        console.error('[Inquiry Submission Error]:', error);
        res.status(500).json({ success: false, message: 'Failed to record inquiry' });
    }
});
// Admin routes below
router.use(auth_1.requireAdminAuth);
// GET /api/inquiries/stats - Summary counts for admin dashboard
router.get('/stats', async (_req, res) => {
    try {
        const [total, newCount, reviewedCount, contactedCount, archivedCount] = await Promise.all([
            Inquiry_1.Inquiry.countDocuments(),
            Inquiry_1.Inquiry.countDocuments({ status: 'New' }),
            Inquiry_1.Inquiry.countDocuments({ status: 'Reviewed' }),
            Inquiry_1.Inquiry.countDocuments({ status: 'Contacted' }),
            Inquiry_1.Inquiry.countDocuments({ status: 'Archived' }),
        ]);
        res.json({
            success: true,
            data: {
                total,
                new: newCount,
                reviewed: reviewedCount,
                contacted: contactedCount,
                archived: archivedCount,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch inquiry stats' });
    }
});
// GET /api/inquiries - Paginated inquiries with filters
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const { status, search } = req.query;
        const filter = {};
        if (status && status !== 'All') {
            filter.status = status;
        }
        if (search && typeof search === 'string') {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { name: regex },
                { email: regex },
                { company: regex },
                { projectType: regex },
                { description: regex },
                { inquiryId: regex },
            ];
        }
        const [inquiries, total] = await Promise.all([
            Inquiry_1.Inquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Inquiry_1.Inquiry.countDocuments(filter),
        ]);
        res.json({
            success: true,
            data: {
                inquiries,
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
        console.error('[Fetch Inquiries Error]:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve inquiries' });
    }
});
// PATCH /api/inquiries/:id/status - Update status of an inquiry
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, notes } = req.body;
        const updatePayload = {};
        if (status)
            updatePayload.status = status;
        if (typeof notes === 'string')
            updatePayload.notes = notes;
        const updated = await Inquiry_1.Inquiry.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
        if (!updated) {
            res.status(404).json({ success: false, message: 'Inquiry not found' });
            return;
        }
        res.json({ success: true, data: updated });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update inquiry status' });
    }
});
// DELETE /api/inquiries/:id - Remove an inquiry
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Inquiry_1.Inquiry.findByIdAndDelete(req.params.id);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Inquiry not found' });
            return;
        }
        res.json({ success: true, message: 'Inquiry removed' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete inquiry' });
    }
});
exports.default = router;
