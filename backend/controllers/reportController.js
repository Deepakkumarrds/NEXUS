const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createReport = async (req, res) => {
  try {
    const { client_id, report_name, report_type, file_path, report_month } = req.body;
    let user = await prisma.user.findFirst();

    const report = await prisma.report.create({
      data: {
        client_id,
        report_name,
        report_type,
        file_path: file_path || 'dummy/path/to/file.pdf', // Using dummy path since we haven't set up actual file uploads
        report_month,
        uploaded_by: user.id
      }
    });

    res.status(201).json({ status: 'success', data: report });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create report' });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        client: { select: { company_name: true } },
        uploader: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ status: 'success', data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch reports' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.report.delete({
      where: { id }
    });
    res.status(200).json({ status: 'success', message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete report' });
  }
};
