const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const ctrl = require('../controllers/committeeController');
const { validateCreateCommittee, validateUpdateCommittee } = require('../validators/committeeValidator');

router.get('/', protect, authorize(...PERMISSIONS.view), ctrl.list);
router.post('/', protect, authorize(...PERMISSIONS.add), validateCreateCommittee, ctrl.create);
router.get('/:id', protect, authorize(...PERMISSIONS.view), ctrl.get);
router.put('/:id', protect, authorize(...PERMISSIONS.edit), validateUpdateCommittee, ctrl.update);
router.delete('/:id', protect, authorize(...PERMISSIONS.delete), ctrl.remove);

module.exports = router;