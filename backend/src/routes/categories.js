const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/categoryController');
const { validateCreateCategory, validateUpdateCategory } = require('../validators/categoryValidator');

// All authenticated core roles can view the categories list
router.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.list);

// CECOM given full administrative power to create categories as requested
router.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateCreateCategory, ctrl.create);

// Individual category lookup allowed for all system management roles
router.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.get);

//  CECOM authorized to modify existing category configurations
router.put('/:id', protect, authorize('Admin', 'Procurement', 'CECOM'), validateUpdateCategory, ctrl.update);

//  CECOM granted hard delete permissions for categories alongside Admin
router.delete('/:id', protect, authorize('Admin', 'CECOM'), ctrl.remove);

module.exports = router;