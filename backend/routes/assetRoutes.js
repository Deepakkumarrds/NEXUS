const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

// Asset management (link-based, no multi-part upload middleware needed)
router.post('/', assetController.createAsset);
router.get('/', assetController.getAllAssets);
router.get('/client/:clientId', assetController.getClientAssets);
router.get('/:id', assetController.getAssetDetails);

// Workflows & Versions
router.post('/:id/versions', assetController.addAssetVersion);
router.patch('/:id/internal-status', assetController.updateInternalStatus);
router.patch('/:id/client-status', assetController.updateClientStatus);

// Annotations
router.post('/versions/:versionId/annotations', assetController.addAnnotation);

module.exports = router;
