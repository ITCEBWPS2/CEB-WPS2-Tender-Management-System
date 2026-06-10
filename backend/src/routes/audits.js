const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/auditController');

router.get('/', protect, authorize('Admin'), ctrl.list);

router.get('/:id', protect, authorize('Admin'), ctrl.get);

module.exports = router;