const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    res.status(200).json({ status: 'success', data: escalation });
  } catch (error) {
    console.error('Error updating escalation:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update escalation' });
  }
};
