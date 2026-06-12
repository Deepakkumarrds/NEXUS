const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new client
exports.createClient = async (req, res) => {
  try {
    const { company_name, email, service_type, retainer_value } = req.body;
    
    // In a real app, you'd validate the input here
    const client = await prisma.client.create({
      data: {
        company_name,
        email,
        service_type,
        retainer_value: retainer_value ? parseFloat(retainer_value) : null,
      },
    });

    res.status(201).json({ status: 'success', data: client });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create client' });
  }
};

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ status: 'success', data: clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch clients' });
  }
};

// Get a single client by ID
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contacts: true,
        spocs: true,
        tasks: { orderBy: { created_at: 'desc' }, take: 5 },
        sows: { orderBy: { created_at: 'desc' }, take: 5 },
        meetings: { orderBy: { meeting_date: 'desc' }, take: 5 },
        health_scores: { orderBy: { calculated_at: 'desc' }, take: 1 }
      }
    });

    if (!client) {
      return res.status(404).json({ status: 'error', message: 'Client not found' });
    }

    res.status(200).json({ status: 'success', data: client });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch client' });
  }
};

// Update a client
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ status: 'success', data: client });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update client' });
  }
};

// Delete a client
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.client.delete({
      where: { id },
    });

    res.status(200).json({ status: 'success', message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete client' });
  }
};

// Add a contact to a client
exports.addContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { contact_name, title, email, phone, is_primary } = req.body;

    const contact = await prisma.clientContact.create({
      data: {
        client_id: id,
        contact_name,
        title,
        email,
        phone,
        is_primary: is_primary || false
      }
    });

    res.status(201).json({ status: 'success', data: contact });
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add contact' });
  }
};

// Add an internal SPOC to a client
exports.addSpoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, responsibility } = req.body;

    const spoc = await prisma.clientSpoc.create({
      data: {
        client_id: id,
        user_id,
        responsibility
      }
    });

    res.status(201).json({ status: 'success', data: spoc });
  } catch (error) {
    console.error('Error adding SPOC:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add SPOC' });
  }
};
