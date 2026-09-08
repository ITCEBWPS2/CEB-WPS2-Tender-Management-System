const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getNotificationLogs, runTestCheck } = require('../controllers/notificationController');

router.get('/', protect, authorize('Admin', 'Super Admin'), getNotificationLogs);
router.post('/test-run', protect, authorize('Admin', 'Super Admin'), runTestCheck);

module.exports = router;
