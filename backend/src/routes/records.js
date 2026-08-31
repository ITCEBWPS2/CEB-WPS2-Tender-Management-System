const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/recordController');
const { validateCreateRecord, validateUpdateRecord } = require('../validators/recordValidator');

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

module.exports = router;