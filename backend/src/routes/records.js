const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const ctrl = require('../controllers/recordController');
const { validateCreateRecord, validateUpdateRecord } = require('../validators/recordValidator');
const { handleDocumentUpload } = require('../middleware/upload');

// All roles in PERMISSIONS.view can view tender records
router.get('/', protect, authorize(...PERMISSIONS.view), ctrl.list);

// Roles in PERMISSIONS.add can create records
router.post('/', protect, authorize(...PERMISSIONS.add), validateCreateRecord, ctrl.create);

// Individual record lookups
router.get('/:id', protect, authorize(...PERMISSIONS.view), ctrl.get);

// Roles in PERMISSIONS.edit can update records
router.put('/:id', protect, authorize(...PERMISSIONS.edit), validateUpdateRecord, ctrl.update);

// Roles in PERMISSIONS.delete (Admin / Super Admin only) can delete records
router.delete('/:id', protect, authorize(...PERMISSIONS.delete), ctrl.remove);

// Document Attachments Management Routes
// Document upload follows Add/Edit permissions (Admin, Super Admin, Procurement, Clerk)
router.post('/:id/documents', protect, authorize(...PERMISSIONS.add), handleDocumentUpload, ctrl.uploadDocuments);

// List documents for a record (open to all view roles)
router.get('/:id/documents', protect, authorize(...PERMISSIONS.view), ctrl.listDocuments);

// Download document: authenticated streaming (open to all view roles)
router.get('/:id/documents/:docId/download', protect, authorize(...PERMISSIONS.view), ctrl.downloadDocument);

// Delete document: Admin / Super Admin only
router.delete('/:id/documents/:docId', protect, authorize(...PERMISSIONS.delete), ctrl.deleteDocument);

module.exports = router;