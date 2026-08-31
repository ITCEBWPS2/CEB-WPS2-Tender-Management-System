const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/departmentController');
const { validateCreateDepartment, validateUpdateDepartment } = require('../validators/departmentValidator');

// All authenticated core roles can view the units/departments list
router.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.list);

// CECOM given full administrative power to create units alongside Admin and Procurement
router.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateCreateDepartment, ctrl.create);

// Individual unit lookup allowed for all system management roles
router.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.get);

// CECOM authorized to modify existing unit configurations
router.put('/:id', protect, authorize('Admin', 'Procurement', 'CECOM'), validateUpdateDepartment, ctrl.update);

// CECOM granted hard delete permissions for units alongside Admin
router.delete('/:id', protect, authorize('Admin', 'CECOM'), ctrl.remove);

module.exports = router;