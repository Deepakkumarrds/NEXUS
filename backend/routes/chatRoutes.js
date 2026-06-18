const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
// Use the same auth middleware used in other routes if available. Let's assume authMiddleware.protect
const { protect } = require('../middleware/authMiddleware');

// POST /api/chat
router.post('/', protect, async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ status: 'error', message: 'Invalid messages array' });
    }

    const responseMessage = await chatService.handleChat(messages);
    
    res.json({
      status: 'success',
      data: responseMessage
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process chat message' });
  }
});

module.exports = router;
