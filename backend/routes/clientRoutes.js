const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// GET all clients
router.get('/', clientController.getAllClients);

// POST a new client
router.post('/', clientController.createClient);

// GET a single client
router.get('/:id', clientController.getClientById);

// PUT (update) a client
router.put('/:id', clientController.updateClient);

// DELETE a client
router.delete('/:id', clientController.deleteClient);

// POST a contact
router.post('/:id/contacts', clientController.addContact);

// POST a spoc
router.post('/:id/spocs', clientController.addSpoc);

// Onboarding Checklist
router.get('/:id/onboarding', clientController.getOnboardingChecklist);
router.post('/:id/onboarding', clientController.addOnboardingItem);
router.put('/onboarding/:itemId', clientController.updateOnboardingItem);
router.delete('/onboarding/:itemId', clientController.deleteOnboardingItem);

// Social Media Handles
router.get('/:id/socials', clientController.getSocialHandles);
router.post('/:id/socials', clientController.addSocialHandle);
router.delete('/socials/:handleId', clientController.deleteSocialHandle);

module.exports = router;

