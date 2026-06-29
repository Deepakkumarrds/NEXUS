const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('../utils/notificationHelper');
const { sendMessage } = require('../services/whatsappService');

exports.createEscalation = async (req, res) => {
  try {
    const { client_id, title, issue_description, severity, assigned_to } = req.body;
    
    const escalation = await prisma.escalation.create({
      data: {
        client_id,
        title,
        issue_description,
        severity: severity || 'Medium',
        assigned_to: assigned_to || null,
        status: 'Open'
      }
    });

    await createNotification(`Escalation: ${severity}`, `Issue: ${title}`);

    if (severity === 'Critical' || severity === 'High') {
      const client = await prisma.client.findUnique({ where: { id: client_id }, select: { company_name: true }});
      
      // Add as many numbers as you want here
      const targetNumbers = ['918919907186', '916363696732', '919535305049']; 
      
      const message = `🚨 *${severity.toUpperCase()} ESCALATION* 🚨\n\n*Client:* ${client ? client.company_name : 'Unknown'}\n*Issue:* ${title}\n*Details:* ${issue_description || 'No details provided'}\n\nPlease check the RDS Dashboard immediately.`;
      
      // We don't await this so it doesn't block the API response
      targetNumbers.forEach(num => {
        sendMessage(num, message).catch(err => console.error(`WhatsApp Send Error for ${num}:`, err));
      });
    }

    res.status(201).json({ status: 'success', data: escalation });
  } catch (error) {
    console.error('Error creating escalation:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create escalation' });
  }
};

exports.getAllEscalations = async (req, res) => {
  try {
    const escalations = await prisma.escalation.findMany({
      include: {
        client: { select: { company_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ status: 'success', data: escalations });
  } catch (error) {
    console.error('Error fetching escalations:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch escalations' });
  }
};

exports.updateEscalationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    const data = { status };
    if (resolution_notes) data.resolution_notes = resolution_notes;
    if (status === 'Resolved') data.resolved_at = new Date();

    const escalation = await prisma.escalation.update({
      where: { id },
      data
    });

    if (status === 'Resolved') {
      await createNotification('Escalation Resolved', `Issue: ${escalation.title} has been resolved.`);
    }

    res.status(200).json({ status: 'success', data: escalation });
  } catch (error) {
    console.error('Error updating escalation:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update escalation' });
  }
};

exports.deleteEscalation = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.escalation.delete({
      where: { id }
    });
    res.status(200).json({ status: 'success', message: 'Escalation deleted successfully' });
  } catch (error) {
    console.error('Error deleting escalation:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete escalation' });
  }
};
