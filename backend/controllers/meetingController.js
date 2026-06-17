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

// Update action item status
exports.updateActionItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

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
