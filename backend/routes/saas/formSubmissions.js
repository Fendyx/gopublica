const express = require('express');
const router = express.Router();
const JobApplication = require('../../models/hr/JobApplication');
const TenantSettings = require('../../models/TenantSettings');
const authTenant = require('../../middleware/auth/tenant');

// ============================================================
// Dynamic Form Submissions (SaaS admin)
//
// Reuses the JobApplication collection. Only submissions that
// originated from a BranchSection (sourceSectionId present) are
// returned here - regular job applications are excluded.
// ============================================================

// GET /api/saas/forms/submissions
// Fetches dynamic form submissions for the current tenant.
// Supports optional filters: ?branchId=, ?page=, ?status=
router.get('/', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { page = 1, limit = 20, branchId, pageSlug, status } = req.query;

    // Verify the tenant has the forms module enabled
    const tenant = await TenantSettings.findOne({ tenantId }).select('features');
    if (!tenant || !tenant.features?.hasJobApplications) {
      return res.status(403).json({ error: 'Модуль форм отключён' });
    }

    // Only submissions that came from a BranchSection (dynamic_form)
    const query = {
      tenantId,
      sourceSectionId: { $exists: true, $ne: null },
    };

    if (branchId) query.branchId = branchId;
    if (status) query.status = status;

    // Optional filter by the page the form lives on (e.g. 'partners')
    if (pageSlug) {
      const BranchSection = require('../../models/BranchSection');
      const matchingSections = await BranchSection.find({
        tenantId,
        page: pageSlug,
        type: 'dynamic_form',
      }).select('_id');
      const sectionIds = matchingSections.map(s => s._id);
      if (sectionIds.length === 0) {
        return res.json({
          data: [],
          pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, totalPages: 0 },
        });
      }
      query.sourceSectionId = { $in: sectionIds };
    }

    const total = await JobApplication.countDocuments(query);
    const applications = await JobApplication.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate({
        path: 'sourceSectionId',
        select: 'page settings.title settings.description branchId',
      })
      .lean();

    res.json({
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Error fetching form submissions:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/saas/forms/submissions/:id
// Fetch a single submission by id (tenant-scoped)
router.get('/:id', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const application = await JobApplication.findOne({
      _id: req.params.id,
      tenantId,
      sourceSectionId: { $exists: true, $ne: null },
    })
      .populate({
        path: 'sourceSectionId',
        select: 'page settings.title settings.description branchId',
      })
      .lean();

    if (!application) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    res.json(application);
  } catch (err) {
    console.error('Error fetching form submission:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;