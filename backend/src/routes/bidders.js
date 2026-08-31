const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/bidderController');
const { validateCreateBidder, validateUpdateBidder } = require('../validators/bidderValidator');

router.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.list);

router.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateCreateBidder, ctrl.create);

router.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.get);

router.put('/:id', protect, authorize('Admin', 'Procurement', 'CECOM'), validateUpdateBidder, ctrl.update);

router.delete('/:id', protect, authorize('Admin', 'CECOM'), ctrl.remove);

module.exports = router;