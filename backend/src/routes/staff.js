const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/staffController');
const { validateCreateStaff, validateUpdateStaff } = require('../validators/staffValidator');

// Clerk role added to allow fetching and viewing the TEC staff list natively
router.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.list);

// Staff registration strictly restricted to Admin and CECOM management as per frontend specifications
router.post('/', protect, authorize('Admin', 'CECOM'), validateCreateStaff, ctrl.create);

// Individual profile view permissions enabled for all internal workspace roles
router.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.get);

// Staff record adjustments restricted to authorized administrative nodes
router.put('/:id', protect, authorize('Admin', 'CECOM'), validateUpdateStaff, ctrl.update);

// Hard deletion of staff member profiles restricted to Admin and CECOM profiles
router.delete('/:id', protect, authorize('Admin', 'CECOM'), ctrl.remove);

module.exports = router;