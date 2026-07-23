const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const { protect } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/chat
router.post('/', protect, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ status: 'error', message: 'Invalid messages array' });
    }
    const responseMessage = await chatService.handleChat(messages);
    res.json({ status: 'success', data: responseMessage });
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

    const q = (userQuery || '').toLowerCase().trim();

    if (!q) {
      return res.json({ text: "Hi! Ask me anything about clients, tasks, or escalations." });
    }

    // 1. Direct DB Query Handler: Active Clients
    if (q.includes('active client') || q.includes('client list') || q.includes('clients list') || q.includes('what client')) {
      const clients = await prisma.client.findMany({
        where: { client_status: 'Active' },
        select: { company_name: true, brand_name: true, service_type: true },
        take: 10
      });
      if (clients.length === 0) {
        return res.json({ text: "🏢 *ACTIVE CLIENTS:* No active clients found." });
      }
      let reply = `🏢 *ACTIVE CLIENTS (${clients.length} shown)*\n-----------------------------------------\n`;
      clients.forEach((c, idx) => {
        reply += `${idx + 1}. *${c.brand_name || c.company_name}* (${c.service_type || 'General'})\n`;
      });
      reply += `\n🔗 *View all:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}`;
      return res.json({ text: reply });
    }

    // 2. Direct DB Query Handler: Overdue / Pending Tasks
    if (q.includes('overdue task') || q.includes('pending task') || q.includes('task') || q.includes('my task')) {
      const now = new Date();
      const tasks = await prisma.task.findMany({
        where: { status: { in: ['Pending', 'In Progress', 'Review'] } },
        include: {
          client: { select: { company_name: true, brand_name: true } },
          assignee: { select: { name: true } }
        },
        orderBy: { due_date: 'asc' },
        take: 10
      });
      if (tasks.length === 0) {
        return res.json({ text: "✨ *TASKS:* No pending tasks found!" });
      }
      let reply = `📋 *ACTIVE & OVERDUE TASKS (${tasks.length} shown)*\n-----------------------------------------\n`;
      tasks.forEach((t, idx) => {
        const brand = t.client?.brand_name || t.client?.company_name || 'General';
        const assignee = t.assignee?.name || 'Unassigned';
        const isOverdue = t.due_date && new Date(t.due_date) < now;
        const statusTag = isOverdue ? '🚨 *OVERDUE*' : `[${t.status}]`;
        const dueDateStr = t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date';
        reply += `${idx + 1}. *${t.title}*\n   └ Brand: ${brand} | Owner: ${assignee} | Due: ${dueDateStr} ${statusTag}\n`;
      });
      reply += `\n🔗 *View all tasks:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}`;
      return res.json({ text: reply });
    }

    // 3. Direct DB Query Handler: Escalations
    if (q.includes('escalation') || q.includes('issue')) {
      const escalations = await prisma.escalation.findMany({
        where: { status: 'Open' },
        include: { client: { select: { company_name: true, brand_name: true } } },
        take: 5
      });
      if (escalations.length === 0) {
        return res.json({ text: "🟢 *ESCALATIONS:* No open escalations! All clear." });
      }
      let reply = `⚠️ *OPEN ESCALATIONS (${escalations.length})*\n-----------------------------------------\n`;
      escalations.forEach((e, idx) => {
        const brand = e.client?.brand_name || e.client?.company_name || 'General';
        reply += `${idx + 1}. *${e.title}* [${e.severity}]\n   └ Brand: ${brand} | Status: ${e.status}\n`;
      });
      return res.json({ text: reply });
    }

    // Fallback to Groq AI Assistant if available
    if (process.env.GROQ_API_KEY) {
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
      return res.json({ text: replyText });
    }

    return res.json({ text: "🤖 I can answer queries about: *active clients*, *overdue tasks*, *open escalations*, or *daily summary*. Try asking one of those!" });

  } catch (error) {
    console.error('Zoho Chat API Error:', error);
    res.json({ text: "⚠️ Error: " + (error.message || 'Unable to fetch response') });
  }
});

module.exports = router;
