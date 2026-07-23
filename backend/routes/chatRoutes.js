const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const sowPredictorService = require('../services/sowPredictorService');
const { protect } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma');


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

    // 0.4 Direct DB Action Handler: Natural Language Task Creation via Cliq Bot
    if (q.includes('create task') || q.includes('add task') || q.includes('new task')) {
      const taskController = require('../controllers/taskController');
      
      let brandName = '';
      let title = '';
      let assigneeName = '';
      let dueDateStr = '';

      const brandMatch = userQuery.match(/for\s+([^:\n,]+)/i) || userQuery.match(/brand\s+([^:\n,]+)/i);
      if (brandMatch) {
        brandName = brandMatch[1].split(/assigned|due|title|task/i)[0].trim();
      }

      const assigneeMatch = userQuery.match(/assigned\s+(?:to\s+)?([^:\n,]+)/i) || userQuery.match(/assignee\s+([^:\n,]+)/i);
      if (assigneeMatch) {
        assigneeName = assigneeMatch[1].split(/due|task|for/i)[0].trim();
      }

      const dueMatch = userQuery.match(/due\s+(?:on\s+)?([^:\n,]+)/i) || userQuery.match(/deadline\s+([^:\n,]+)/i);
      if (dueMatch) {
        dueDateStr = dueMatch[1].trim();
        // If year is omitted (e.g. "July 28"), append current year
        if (!/\d{4}/.test(dueDateStr)) {
          dueDateStr += ` ${new Date().getFullYear()}`;
        }
      }

      if (userQuery.includes(':')) {
        const parts = userQuery.split(':');
        title = parts[1].split(/assigned|due/i)[0].trim();
      } else {
        title = userQuery.replace(/create task|add task|new task/gi, '').split(/for|assigned|due/i)[0].trim();
      }

      req.body = {
        brand_name: brandName,
        title: title || 'New Bot Task',
        assigned_to_name: assigneeName,
        due_date: dueDateStr
      };

      return taskController.createTaskFromBot(req, res);
    }

    // 0.45 Direct DB Action Handler: Natural Language Task Deletion via Cliq Bot
    if (q.includes('delete task') || q.includes('remove task') || q.includes('cancel task')) {
      const taskController = require('../controllers/taskController');
      
      let brandName = '';
      let title = '';

      const brandMatch = userQuery.match(/for\s+([^:\n,]+)/i) || userQuery.match(/brand\s+([^:\n,]+)/i);
      if (brandMatch) {
        brandName = brandMatch[1].split(/title|task/i)[0].trim();
      }

      if (userQuery.includes(':')) {
        title = userQuery.split(':')[1].trim();
      } else {
        title = userQuery.replace(/delete task|remove task|cancel task/gi, '').split(/for|brand/i)[0].trim();
      }

      req.body = {
        brand_name: brandName,
        title: title
      };

      return taskController.deleteTaskFromBot(req, res);
    }

    // 0.5 Direct DB Query Handler: SOW Scope & Deliverables Tracker
    if (q.includes('sow') || q.includes('scope')) {
      let clientQuery = q.replace(/\b(sows|sow|scope|breach|alert|report|status|for|of|the|about|details)\b/gi, '').trim();
      const sowReport = await sowPredictorService.getSowBreachReport(clientQuery || null);
      return res.json({ text: sowReport });
    }

    // 0.6 Direct DB Query Handler: Campaign & Ad Performance (Prevents AI Hallucinations)
    if (q.includes('campaign') || q.includes('ad spend') || q.includes('ads') || q.includes('conversion')) {
      return res.json({ text: "📢 *CAMPAIGNS & ADS:* Marketing campaign tracking is currently unlinked for this account. No active ad campaign performance results are logged in the database." });
    }

    // 0. Direct DB Query Handler: Daily Summary & Brand Work Logs

    if (q.includes('summary') || q.includes('daily summary') || q.includes('client summary') || q.includes('clients summary') || q.includes('cleints summary') || q.includes('each client')) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const activeClients = await prisma.client.findMany({
        where: { client_status: 'Active' },
        include: {
          daily_trackers: {
            where: { date: todayStart }
          }
        },
        orderBy: { company_name: 'asc' }
      });


      if (activeClients.length === 0) {
        return res.json({ text: "🏢 *DAILY SUMMARY:* No active clients found." });
      }

      const updatedClients = [];
      const unupdatedClients = [];

      activeClients.forEach((c) => {
        const name = c.brand_name || c.company_name;
        const trackers = (c.daily_trackers || []).filter(t => t.summary_text && t.summary_text.trim() !== '');

        if (trackers.length > 0) {
          updatedClients.push({ name, trackers });
        } else {
          unupdatedClients.push(name);
        }
      });

      const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      let reply = `📊 *TRACKING HUB DAILY SUMMARY* • ${formattedDate}\n=========================================\n\n`;

      if (updatedClients.length > 0) {
        reply += `📝 *TODAY'S UPDATED BRANDS (${updatedClients.length}):*\n\n`;
        updatedClients.forEach((item, idx) => {
          reply += `${idx + 1}. 🏢 *${item.name}*\n`;
          item.trackers.forEach((t) => {
            reply += `   └ *[${t.department || 'General'}]:* ${t.summary_text}\n`;
          });
          reply += `\n`;
        });
      }

      if (unupdatedClients.length > 0) {
        reply += `🔴 *UNUPDATED BRANDS TODAY (${unupdatedClients.length}):*\n`;
        unupdatedClients.forEach(name => {
          reply += `  • ${name}\n`;
        });
        reply += `\n`;
      }

      reply += `🔗 *Update Tracking Hub:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/tracker`;
      return res.json({ text: reply });
    }



    // 1. Direct DB Query Handler: Active Clients

    if (q.includes('active client') || q.includes('client list') || q.includes('clients list') || q.includes('what client')) {
      const clients = await prisma.client.findMany({
        where: { client_status: 'Active' },
        select: { company_name: true, brand_name: true, service_type: true },
        orderBy: { company_name: 'asc' }
      });
      if (clients.length === 0) {
        return res.json({ text: "🏢 *ACTIVE CLIENTS:* No active clients found." });
      }
      let reply = `🏢 *ALL ACTIVE CLIENTS (${clients.length})*\n-----------------------------------------\n`;
      clients.forEach((c, idx) => {
        reply += `${idx + 1}. *${c.brand_name || c.company_name}* (${c.service_type || 'General'})\n`;
      });
      reply += `\n🔗 *Open Dashboard:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}`;
      return res.json({ text: reply });
    }

    // 2. Direct DB Query Handler: Overdue / Pending Tasks
    if ((q.includes('overdue task') || q.includes('pending task') || q.includes('task') || q.includes('my task')) && !q.includes('create task') && !q.includes('add task') && !q.includes('new task')) {
      const now = new Date();
      const tasks = await prisma.task.findMany({
        where: { status: { in: ['Pending', 'In Progress', 'Review'] } },
        include: {
          client: { select: { company_name: true, brand_name: true } },
          assignee: { select: { name: true } }
        },
        orderBy: { due_date: 'asc' }
      });
      if (tasks.length === 0) {
        return res.json({ text: "✨ *TASKS:* No pending tasks found!" });
      }
      let reply = `📋 *ALL ACTIVE & OVERDUE TASKS (${tasks.length})*\n-----------------------------------------\n`;
      tasks.forEach((t, idx) => {
        const brand = t.client?.brand_name || t.client?.company_name || 'General';
        const assignee = t.assignee?.name || 'Unassigned';
        const isOverdue = t.due_date && new Date(t.due_date) < now;
        const statusTag = isOverdue ? '🚨 *OVERDUE*' : `[${t.status}]`;
        const dueDateStr = t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date';
        reply += `${idx + 1}. *${t.title}*\n   └ Brand: ${brand} | Owner: ${assignee} | Due: ${dueDateStr} ${statusTag}\n`;
      });
      reply += `\n🔗 *Open Dashboard:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}`;
      return res.json({ text: reply });
    }


    // 3. Direct DB Query Handler: Escalations
    if (q.includes('escalation') || q.includes('issue')) {
      const escalations = await prisma.escalation.findMany({
        where: { status: 'Open' },
        include: { client: { select: { company_name: true, brand_name: true } } }
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

    // 4. Direct DB Query Handler: Status of Specific Brand (handles spaces like "dezine pro" vs "dezinepro")
    if (q.includes('status')) {
      let brandQuery = q.replace('status of', '').replace('status for', '').replace('status', '').trim();
      if (brandQuery.endsWith('?')) brandQuery = brandQuery.slice(0, -1).trim();

      if (brandQuery && brandQuery.length > 1) {
        const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const targetNorm = normalize(brandQuery);

        const allClients = await prisma.client.findMany({
          where: { client_status: 'Active' },
          include: {
            tasks: { where: { status: { in: ['Pending', 'In Progress', 'Review'] } } },
            escalations: { where: { status: 'Open' } },
            daily_trackers: { orderBy: { date: 'desc' }, take: 3 }
          }
        });

        const client = allClients.find(c => {
          const compNorm = normalize(c.company_name);
          const brandNorm = normalize(c.brand_name);
          return compNorm.includes(targetNorm) || targetNorm.includes(compNorm) || (brandNorm && (brandNorm.includes(targetNorm) || targetNorm.includes(brandNorm)));
        });

        if (client) {
          const brandName = client.brand_name || client.company_name;
          const healthIcon = client.health_status === 'Red' ? '🔴' : client.health_status === 'Yellow' ? '🟡' : '🟢';

          let reply = `🏢 *${brandName.toUpperCase()} BRAND STATUS*\n-----------------------------------------\n`;
          reply += `• *Account Status:* ${client.client_status} ${healthIcon}\n`;
          reply += `• *Service Type:* ${client.service_type || 'Retainer'}\n`;
          reply += `• *Active Tasks:* ${client.tasks.length} pending\n`;
          reply += `• *Open Escalations:* ${client.escalations.length}\n`;

          if (client.renewal_date) {
            const renewalStr = new Date(client.renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            reply += `• *Contract Renewal:* ${renewalStr}\n`;
          }

          if (client.daily_trackers && client.daily_trackers.length > 0) {
            reply += `\n📝 *DAILY TRACKER LOGS (Date-wise):*\n`;
            const seen = new Set();
            client.daily_trackers.forEach(t => {
              const dateStr = t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today';
              const key = `${dateStr}-${t.department}-${t.summary_text}`;
              if (!seen.has(key)) {
                seen.add(key);
                reply += `   └ *${dateStr} [${t.department || 'General'}]:* ${t.summary_text || 'In Progress'}\n`;
              }
            });
          } else {
            reply += `\n📝 *DAILY TRACKER LOGS:* No updates logged today yet.\n`;
          }


          reply += `\n🔗 *Open Brand in Dashboard:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}`;
          return res.json({ text: reply });
        }
      }
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
