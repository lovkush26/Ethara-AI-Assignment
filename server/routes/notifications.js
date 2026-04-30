const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getNotifications, markAsRead, clearAll } = require('../controllers/notificationController');

// All routes require authentication
router.use(auth);

router.get('/', getNotifications);
router.put('/read', markAsRead);
router.delete('/clear', clearAll);

module.exports = router;
