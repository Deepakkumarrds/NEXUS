const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all holidays
exports.getAllHolidays = async (req, res) => {
  try {
    const holidays = await prisma.holiday.findMany({
      orderBy: { holiday_date: 'asc' }
    });
    res.status(200).json({ status: 'success', data: holidays });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch holidays' });
  }
};

// Create a new holiday
exports.createHoliday = async (req, res) => {
  try {
    const { holiday_name, holiday_date, is_national } = req.body;
    const holiday = await prisma.holiday.create({
      data: {
        holiday_name,
        holiday_date: new Date(holiday_date),
        is_national: is_national !== undefined ? is_national : true
      }
    });
    res.status(201).json({ status: 'success', data: holiday });
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create holiday' });
  }
};
