const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get the latest health scores for all active clients
const getHealthScores = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { client_status: 'Active' },
      select: {
        id: true,
        company_name: true,
        brand_name: true,
        health_scores: {
          orderBy: { calculated_at: 'desc' }
        }
      }
    });

    const formattedData = clients.map(client => {
      const monthly_scores = {};
      
      client.health_scores.forEach(score => {
        const date = new Date(score.calculated_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Since it's ordered by desc, we just keep the first one we see per month (the latest)
        if (!monthly_scores[monthKey]) {
          monthly_scores[monthKey] = score;
        }
      });

      const latestScore = client.health_scores[0] || {
        overall_score: null,
        risk_level: 'Unrated',
        feedback: ''
      };

      return {
        client_id: client.id,
        company_name: client.company_name,
        brand_name: client.brand_name,
        monthly_scores,
        ...latestScore
      };
    });

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching health scores:', error);
    res.status(500).json({ error: 'Failed to fetch health scores' });
  }
};

// Create a new health score
const createHealthScore = async (req, res) => {
  try {
    const { client_id, overall_score, feedback } = req.body;

    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    // Ensure score is number 1-10
    const score = parseInt(overall_score) || 0;

    let risk_level = 'Stable';
    if (score >= 9) risk_level = 'Excellent';
    else if (score >= 7) risk_level = 'Stable';
    else if (score >= 5) risk_level = 'Risk';
    else risk_level = 'Critical';

    const newScore = await prisma.clientHealthScore.create({
      data: {
        client_id,
        overall_score: score,
        risk_level,
        feedback: feedback || ''
      }
    });

    res.status(201).json(newScore);
  } catch (error) {
    console.error('Error creating health score:', error);
    res.status(500).json({ error: 'Failed to create health score' });
  }
};

// Get the historical trend for a specific client
const getClientHealthHistory = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const history = await prisma.clientHealthScore.findMany({
      where: { client_id: clientId },
      orderBy: { calculated_at: 'asc' } // Oldest to newest for graphing
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching client health history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

module.exports = {
  getHealthScores,
  createHealthScore,
  getClientHealthHistory
};
