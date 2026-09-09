const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getNotificationLogs, runTestCheck, runDelayTestCheck } = require('../controllers/notificationController');

router.get('/', protect, authorize('Admin', 'Super Admin'), getNotificationLogs);
router.post('/test-run', protect, authorize('Admin', 'Super Admin'), runTestCheck);
router.post('/test-run-delays', protect, authorize('Admin', 'Super Admin'), runDelayTestCheck);

module.exports = router;
