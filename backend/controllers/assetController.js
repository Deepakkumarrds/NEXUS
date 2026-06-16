const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');
const prisma = new PrismaClient();

// Create a new creative asset with its first version (V1)
exports.createAsset = async (req, res) => {
  try {
    const { client_id, task_id, title, description, uploaded_by, due_date, file_url, file_type } = req.body;
    
    if (!file_url) {
      return res.status(400).json({ status: 'error', message: 'No asset link provided' });
    }

    // Automatically determine platform type if not explicitly set
    let detected_type = file_type || 'Other Link';
    if (file_url.includes('figma.com')) {
      detected_type = 'Figma';
    } else if (file_url.includes('drive.google.com') || file_url.includes('docs.google.com')) {
      detected_type = 'Google Drive';
    } else if (file_url.includes('canva.com')) {
      detected_type = 'Canva';
    }

    const asset = await prisma.creativeAsset.create({
      data: {
        client_id,
        task_id: task_id || null,
        title,
        description,
        internal_status: 'Draft',
        client_status: 'Pending',
        due_date: due_date ? new Date(due_date) : null,
        versions: {
          create: {
            file_url,
            file_type: detected_type,
            uploaded_by,
            version_number: 1
          }
        }
      },
      include: {
        versions: true
      }
    });

    res.status(201).json({ status: 'success', data: asset });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create asset' });
  }
};

// Add a new version (V2, V3, etc.)
exports.addAssetVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { uploaded_by, file_url, file_type } = req.body;

    if (!file_url) {
      return res.status(400).json({ status: 'error', message: 'No asset link provided' });
    }

    // Automatically determine platform type if not explicitly set
    let detected_type = file_type || 'Other Link';
    if (file_url.includes('figma.com')) {
      detected_type = 'Figma';
    } else if (file_url.includes('drive.google.com') || file_url.includes('docs.google.com')) {
      detected_type = 'Google Drive';
    } else if (file_url.includes('canva.com')) {
      detected_type = 'Canva';
    }

    // Get current versions to find the next version number
    const currentAsset = await prisma.creativeAsset.findUnique({
      where: { id },
      include: { versions: { orderBy: { version_number: 'desc' }, take: 1 } }
    });

    if (!currentAsset) return res.status(404).json({ status: 'error', message: 'Asset not found' });

    const nextVersion = (currentAsset.versions[0]?.version_number || 0) + 1;

    const newVersion = await prisma.creativeAssetVersion.create({
      data: {
        asset_id: id,
        version_number: nextVersion,
        file_url,
        file_type: detected_type,
        uploaded_by
      }
    });

    // Reset statuses when a new version is uploaded
    await prisma.creativeAsset.update({
      where: { id },
      data: {
        internal_status: 'Draft',
        client_status: 'Pending'
      }
    });

    res.status(201).json({ status: 'success', data: newVersion });
  } catch (error) {
    console.error('Error adding version:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add version' });
  }
};

// Get all assets
exports.getAllAssets = async (req, res) => {
  try {
    const assets = await prisma.creativeAsset.findMany({
      include: {
        client: { select: { company_name: true } },
        task: { select: { title: true } },
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1,
          include: { uploader: { select: { name: true } } }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ status: 'success', data: assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch assets' });
  }
};

// Get assets for a specific client (only those ready for client)
exports.getClientAssets = async (req, res) => {
  try {
    const { clientId } = req.params;
    const assets = await prisma.creativeAsset.findMany({
      where: { 
        client_id: clientId,
        internal_status: 'Client Review' // Only show to client if internal team says it's ready
      },
      include: {
        task: { select: { title: true } },
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ status: 'success', data: assets });
  } catch (error) {
    console.error('Error fetching client assets:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch client assets' });
  }
};

// Get single asset details (with all versions and annotations)
exports.getAssetDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await prisma.creativeAsset.findUnique({
      where: { id },
      include: {
        client: { select: { company_name: true } },
        task: { select: { title: true } },
        versions: {
          orderBy: { version_number: 'desc' },
          include: {
            uploader: { select: { name: true } },
            annotations: {
              orderBy: { created_at: 'asc' }
            }
          }
        }
      }
    });

    if (!asset) return res.status(404).json({ status: 'error', message: 'Asset not found' });
    res.status(200).json({ status: 'success', data: asset });
  } catch (error) {
    console.error('Error fetching asset details:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch asset details' });
  }
};

// Update internal status (e.g. Draft -> Client Review)
exports.updateInternalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { internal_status } = req.body;

    const updatedAsset = await prisma.creativeAsset.update({
      where: { id },
      data: { internal_status },
      include: { client: { include: { client_users: true } } }
    });

    // If sent to client, send email
    if (internal_status === 'Client Review') {
      const portalLink = 'http://localhost:3000/portal/login'; // Env var in prod
      for (const user of updatedAsset.client.client_users) {
        await emailService.notifyClientAssetReady(user.email, updatedAsset.title, portalLink);
      }
    }

    res.status(200).json({ status: 'success', data: updatedAsset });
  } catch (error) {
    console.error('Error updating internal status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update internal status' });
  }
};

// Update client status (e.g. Pending -> Approved/Rejected)
exports.updateClientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { client_status, feedback } = req.body; // Actually we handle feedback via annotations now, but we can still keep a top level string if we want

    const updatedAsset = await prisma.creativeAsset.update({
      where: { id },
      data: { client_status }
    });

    // In a real app, find the agency account manager to notify.
    // For now, mock emailing the generic agency address.
    const agencyEmail = 'team@agency.com';
    if (client_status === 'Approved') {
      await emailService.notifyAgencyAssetApproved(agencyEmail, updatedAsset.title, feedback);
    } else if (client_status === 'Rejected') {
      await emailService.notifyAgencyAssetRejected(agencyEmail, updatedAsset.title, feedback);
    }

    res.status(200).json({ status: 'success', data: updatedAsset });
  } catch (error) {
    console.error('Error updating client status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update client status' });
  }
};

// Add an annotation pin to a specific version
exports.addAnnotation = async (req, res) => {
  try {
    const { versionId } = req.params;
    const { x_percent, y_percent, comment, user_id, client_user_id, created_by_name } = req.body;

    const annotation = await prisma.assetAnnotation.create({
      data: {
        version_id: versionId,
        x_percent: parseFloat(x_percent),
        y_percent: parseFloat(y_percent),
        comment,
        user_id: user_id || null,
        client_user_id: client_user_id || null,
        created_by_name
      }
    });

    res.status(201).json({ status: 'success', data: annotation });
  } catch (error) {
    console.error('Error adding annotation:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add annotation' });
  }
};
