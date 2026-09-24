const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const ctrl = require('../controllers/departmentController');
const { validateCreateDepartment, validateUpdateDepartment } = require('../validators/departmentValidator');

router.get('/', protect, authorize(...PERMISSIONS.view), ctrl.list);
router.post('/', protect, authorize(...PERMISSIONS.add), validateCreateDepartment, ctrl.create);
router.get('/:id', protect, authorize(...PERMISSIONS.view), ctrl.get);
router.put('/:id', protect, authorize(...PERMISSIONS.edit), validateUpdateDepartment, ctrl.update);
router.delete('/:id', protect, authorize(...PERMISSIONS.delete), ctrl.remove);

module.exports = router;