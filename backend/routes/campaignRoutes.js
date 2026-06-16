const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

router.get('/', campaignController.getAllCampaigns);
router.post('/', campaignController.logCampaignPerformance);
router.delete('/:id', campaignController.deleteCampaignLog);

module.exports = router;
