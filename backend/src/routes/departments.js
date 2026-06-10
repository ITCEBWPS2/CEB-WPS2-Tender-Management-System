const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/departmentController');

router.get('/', protect, authorize('Admin', 'Procurement', 'c.com user', 'commercial user'), ctrl.list);

router.post('/', protect, authorize('Admin', 'Procurement'), ctrl.create);

router.get('/:id', protect, authorize('Admin', 'Procurement', 'c.com user', 'commercial user'), ctrl.get);

router.put('/:id', protect, authorize('Admin', 'Procurement'), ctrl.update);

router.delete('/:id', protect, authorize('Admin'), ctrl.remove);

module.exports = router;