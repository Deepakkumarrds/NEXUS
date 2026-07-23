const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new meeting
exports.createMeeting = async (req, res) => {
  try {
    const { client_id, meeting_title, meeting_date, attendees, agenda, discussion_points, action_items } = req.body;

    // Dummy user for created_by
    let user = await prisma.user.findFirst();

    const meeting = await prisma.meeting.create({
      data: {
        client_id,
        meeting_title,
        meeting_date: new Date(meeting_date),
        attendees,
        agenda,
        discussion_points,
        created_by: user.id,
        action_items: {
          create: action_items && Array.isArray(action_items) ? action_items.map(item => ({
            action_item: item.action_item,
            deadline: item.deadline ? new Date(item.deadline) : null,
            status: 'Pending'
          })) : []
        }
      },
      include: {
        action_items: true
      }
    });

    res.status(201).json({ status: 'success', data: meeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create meeting' });
  }
};

// Get all meetings
exports.getAllMeetings = async (req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      include: {
        client: { select: { company_name: true } },
        creator: { select: { name: true } },
        action_items: true
      },
      orderBy: { meeting_date: 'desc' }
    });
    res.status(200).json({ status: 'success', data: meetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch meetings' });
  }
};

// Get meeting by ID
exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        client: { select: { company_name: true } },
        action_items: true
      }
    });
    if (!meeting) return res.status(404).json({ status: 'error', message: 'Meeting not found' });
    res.status(200).json({ status: 'success', data: meeting });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch meeting' });
  }
};

// Update meeting
exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { client_id, meeting_title, meeting_date, attendees, agenda, discussion_points } = req.body;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        client_id,
        meeting_title,
        meeting_date: meeting_date ? new Date(meeting_date) : undefined,
        attendees,
        agenda,
        discussion_points
      }
    });
    res.status(200).json({ status: 'success', data: meeting });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update meeting' });
  }
};

// Delete meeting
exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    // Prisma will cascade delete action items if cascade is set, or we may need to delete them manually.
    await prisma.meetingActionItem.deleteMany({ where: { meeting_id: id } });
    await prisma.meeting.delete({ where: { id } });
    res.status(200).json({ status: 'success', message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete meeting' });
  }
};

// AI Extraction of MOM & Action Items from Transcript
exports.extractMomFromText = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Transcript text is required' });
    }

    const Groq = require('groq-sdk');
    if (!process.env.GROQ_API_KEY) {
      return res.status(400).json({ status: 'error', message: 'GROQ_API_KEY is not configured' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompt = `You are an expert AI Executive Assistant for RDS Digital agency.
Given a meeting speech transcript or rough notes, extract:
1. meeting_title: Short professional meeting title.
2. agenda: Key goal/purpose of the meeting.
3. discussion_points: Clean bullet-point summary of key discussions & decisions.
4. action_items: Array of action items, each containing:
   - action_item: Precise task description
   - assigned_to_name: Name of assignee if mentioned, otherwise ""
   - deadline: YYYY-MM-DD format if mentioned, otherwise ""

Return STRICT JSON only matching this format:
{
  "meeting_title": "String",
  "agenda": "String",
  "discussion_points": "String",
  "action_items": [
    { "action_item": "String", "assigned_to_name": "String", "deadline": "YYYY-MM-DD" }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcript:\n"${transcript}"` }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const parsedData = JSON.parse(completion.choices[0]?.message?.content || '{}');
    res.status(200).json({ status: 'success', data: parsedData });
  } catch (error) {
    console.error('Error extracting MOM:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to extract MOM' });
  }
};

// Create Meeting and Auto-Create Tasks in Task Manager + Send or Schedule MOM
exports.createMeetingWithTasks = async (req, res) => {
  try {
    const { client_id, meeting_title, meeting_date, attendees, agenda, discussion_points, action_items, recipient_emails, send_mode } = req.body;

    const prisma = require('../config/prisma');
    let user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    const isInstant = send_mode === 'instant';
    const scheduledSendAt = isInstant ? null : new Date(Date.now() + 30 * 60 * 1000); // 30 mins grace period

    // 1. Create Meeting Record
    const meeting = await prisma.meeting.create({
      data: {
        client_id,
        meeting_title,
        meeting_date: meeting_date ? new Date(meeting_date) : new Date(),
        attendees,
        agenda,
        discussion_points,
        recipient_emails: recipient_emails || null,
        scheduled_send_at: scheduledSendAt,
        is_sent: isInstant,
        sent_at: isInstant ? new Date() : null,
        created_by: user.id,
        action_items: {
          create: action_items && Array.isArray(action_items) ? action_items.map(item => ({
            action_item: item.action_item,
            assigned_to: item.assigned_to || null,
            deadline: item.deadline ? new Date(item.deadline) : null,
            status: 'Pending'
          })) : []
        }
      },
      include: {
        client: { select: { company_name: true, brand_name: true } },
        action_items: { include: { assignee: { select: { name: true, email: true } } } }
      }
    });

    // 2. Auto-Create Tasks in Task Table for each Action Item
    let createdTasksCount = 0;
    if (action_items && Array.isArray(action_items)) {
      for (const item of action_items) {
        if (item.action_item && item.action_item.trim() !== '') {
          await prisma.task.create({
            data: {
              client_id: client_id,
              title: item.action_item,
              description: `Auto-generated from Meeting MOM: "${meeting_title}"`,
              assigned_to: item.assigned_to || null,
              assigned_by: user.id,
              priority: 'High',
              status: 'Pending',
              due_date: item.deadline ? new Date(item.deadline) : null
            }
          });
          createdTasksCount++;
        }
      }
    }

    // 3. Dispatch MOM Summary immediately if send_mode === 'instant'
    if (isInstant) {
      try {
        const { sendCliqNotification } = require('../services/cliqService');
        const emailService = require('../services/emailService');
        const brandName = meeting.client?.brand_name || meeting.client?.company_name || 'Client';

        let cliqMsg = `📝 *NEW MEETING MINUTES (MOM) LOGGED*\n`;
        cliqMsg += `=========================================\n`;
        cliqMsg += `• *Meeting:* "${meeting_title}"\n`;
        cliqMsg += `• *Brand:* ${brandName}\n`;
        cliqMsg += `• *Date:* ${new Date(meeting.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n`;
        if (attendees) cliqMsg += `• *Attendees:* ${attendees}\n`;
        if (recipient_emails) cliqMsg += `• *Recipients:* ${recipient_emails}\n`;
        cliqMsg += `\n📌 *KEY DISCUSSION POINTS:*\n${discussion_points || 'No discussion points logged'}\n\n`;

        if (meeting.action_items.length > 0) {
          cliqMsg += `📋 *ASSIGNED ACTION ITEMS (${createdTasksCount} Tasks Created):*\n`;
          meeting.action_items.forEach((item, idx) => {
            const assigneeName = item.assignee?.name ? `@${item.assignee.name}` : 'Unassigned';
            const dueStr = item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date';
            cliqMsg += `${idx + 1}. *${item.action_item}*\n   └ Owner: ${assigneeName} | Due: ${dueStr}\n`;
          });
        }

        cliqMsg += `\n🔗 *Open Meetings Dashboard:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/meetings`;
        await sendCliqNotification(cliqMsg);

        // Send Email to recipient_emails if provided
        if (recipient_emails) {
          const emails = recipient_emails.split(',').map(e => e.trim()).filter(Boolean);
          for (const email of emails) {
            await emailService.sendDeadlineReminder(
              email,
              `Minutes of Meeting (MOM): ${meeting_title}`,
              `${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/meetings/${meeting.id}`
            );
          }
        }
      } catch (e) {
        console.error('Error posting MOM to Cliq/Email:', e);
      }
    }

    res.status(201).json({ status: 'success', data: meeting, tasks_created: createdTasksCount });
  } catch (error) {
    console.error('Error creating meeting with tasks:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to create meeting' });
  }
};

// Update action item status
exports.updateActionItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const prisma = require('../config/prisma');
    const updatedItem = await prisma.meetingActionItem.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({ status: 'success', data: updatedItem });
  } catch (error) {
    console.error('Error updating action item:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update action item status' });
  }
};
