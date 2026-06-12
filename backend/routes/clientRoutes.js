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

module.exports = router;
