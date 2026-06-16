const express = require('express');
const router = express.Router();
const { getGlobalSettings, updateGlobalSettings, triggerWeeklyReports, previewWeeklyReport, getDeliveryLogs } = require('../controllers/settingsController');

router.get('/', getGlobalSettings);
router.put('/', updateGlobalSettings);
router.post('/trigger-report', triggerWeeklyReports);
router.get('/preview-report/:clientId', previewWeeklyReport);
router.get('/delivery-logs', getDeliveryLogs);

module.exports = router;
