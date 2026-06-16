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
