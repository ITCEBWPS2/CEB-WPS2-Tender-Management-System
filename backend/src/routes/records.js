const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/recordController');
const { validateCreateRecord, validateUpdateRecord } = require('../validators/recordValidator');
const { handleDocumentUpload } = require('../middleware/upload');

// All authenticated core roles can view tender records
router.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.list);

//  CECOM is now authorized to create new tender records alongside Admin and Procurement
router.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateCreateRecord, ctrl.create);

// Full view rights for individual record lookups
router.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.get);

//  CECOM is now authorized to modify existing records
router.put('/:id', protect, authorize('Admin', 'Procurement', 'CECOM'), validateUpdateRecord, ctrl.update);

//  CECOM is now authorized to perform hard deletes on tender records alongside Admin
router.delete('/:id', protect, authorize('Admin', 'CECOM'), ctrl.remove);

// Document Attachments Management Routes
// Upload documents: any authenticated role (including Clerk) can upload
router.post('/:id/documents', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), handleDocumentUpload, ctrl.uploadDocuments);

// List documents for a record
router.get('/:id/documents', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.listDocuments);

// Download document: authenticated streaming
router.get('/:id/documents/:docId/download', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.downloadDocument);

// Delete document: restricted to Admin and Procurement only (Clerks cannot delete)
router.delete('/:id/documents/:docId', protect, authorize('Admin', 'Procurement'), ctrl.deleteDocument);

module.exports = router;