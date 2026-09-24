const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const ctrl = require('../controllers/staffController');
const { validateCreateStaff, validateUpdateStaff } = require('../validators/staffValidator');

router.get('/', protect, authorize(...PERMISSIONS.view), ctrl.list);
router.post('/', protect, authorize(...PERMISSIONS.add), validateCreateStaff, ctrl.create);
router.get('/:id', protect, authorize(...PERMISSIONS.view), ctrl.get);
router.put('/:id', protect, authorize(...PERMISSIONS.edit), validateUpdateStaff, ctrl.update);
router.delete('/:id', protect, authorize(...PERMISSIONS.delete), ctrl.remove);

module.exports = router;