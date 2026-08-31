const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/userController');
const { validateCreateUser, validateUpdateUser } = require('../validators/userValidator');

router.get('/', protect, authorize('Admin'), ctrl.list);
router.post('/', protect, authorize('Admin'), validateCreateUser, ctrl.create);
router.get('/:id', protect, authorize('Admin'), ctrl.get);
router.put('/:id', protect, authorize('Admin'), validateUpdateUser, ctrl.update);
router.delete('/:id', protect, authorize('Admin'), ctrl.remove);

module.exports = router;