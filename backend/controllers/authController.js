const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET || 'supersecretjwtkey12345', {
    expiresIn: '90d'
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ status: 'error', message: 'Incorrect email or password' });
    }

    if (user.status !== 'Active') {
      return res.status(401).json({ status: 'error', message: 'Your account is inactive' });
    }

    // Log the login
    await prisma.loginLog.create({
      data: {
        user_id: user.id,
        ip_address: req.ip,
        device_info: req.headers['user-agent']
      }
    });

    const token = signToken(user.id, user.email);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.role_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.clientLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
    }

    const clientUser = await prisma.clientUser.findUnique({
      where: { email },
      include: { client: true }
    });

    // Check if user exists and password is correct (assuming simple plain text for now if hashed wasn't used for clients, but we should use bcrypt)
    // We'll use bcrypt just like the regular login
    if (!clientUser || !(await bcrypt.compare(password, clientUser.password_hash))) {
      return res.status(401).json({ status: 'error', message: 'Incorrect email or password' });
    }

    if (clientUser.status !== 'Active') {
      return res.status(401).json({ status: 'error', message: 'Your account is inactive' });
    }

    // Include the client_id and a special role 'Client' in the token
    const token = jwt.sign(
      { id: clientUser.id, email: clientUser.email, role: 'Client', client_id: clientUser.client_id }, 
      process.env.JWT_SECRET || 'supersecretjwtkey12345', 
      { expiresIn: '90d' }
    );

    res.status(200).json({
      status: 'success',
      token,
      data: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        role: 'Client',
        client_id: clientUser.client_id,
        company_name: clientUser.client?.company_name
      }
    });
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, department: true, designation: true, role: true }
    });
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
