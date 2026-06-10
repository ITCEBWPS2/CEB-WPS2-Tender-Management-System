const express = require('express');
const router = express.Router();


const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/userController');


router.get('/', protect, authorize('Admin'), ctrl.list);
router.post('/', protect, authorize('Admin'), ctrl.create);
router.get('/:id', protect, authorize('Admin'), ctrl.get);
router.put('/:id', protect, authorize('Admin'), ctrl.update);
router.delete('/:id', protect, authorize('Admin'), ctrl.remove);

module.exports = router;