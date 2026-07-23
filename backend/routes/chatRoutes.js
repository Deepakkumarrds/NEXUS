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
    res.status(500).json({ status: 'error', message: error.message || 'Failed to process chat message' });
  }
});

// POST /api/chat/zoho (2-way Zoho Cliq Bot integration)
router.post('/zoho', async (req, res) => {
  try {
    let userQuery = '';
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        userQuery = parsed.text || parsed.query || req.body;
      } catch (e) {
        userQuery = req.body;
      }
    } else if (req.body && typeof req.body === 'object') {
      userQuery = req.body.text || req.body.query || req.body.message || '';
    }

    if (!userQuery || userQuery.trim() === '') {
      return res.json({ text: "Hi! Ask me anything about clients, tasks, or escalations." });
    }

    const userName = req.body?.user_name || 'Team Member';
    const messages = [
      {
        role: 'system',
        content: `You are TaskAlerts, the internal AI Ops Assistant for RDS Digital. You are chatting with ${userName}. Keep your answers concise, direct, helpful, and formatted in clean markdown.`
      },
      { role: 'user', content: userQuery }
    ];

    const responseMessage = await chatService.handleChat(messages);
    const replyText = responseMessage.content || "I couldn't process your request.";

    res.json({ text: replyText });
  } catch (error) {
    console.error('Zoho Chat API Error:', error);
    res.json({ text: "⚠️ Error: " + (error.message || 'Unable to fetch response') });
  }
});

module.exports = router;


