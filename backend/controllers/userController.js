const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role_id, department, designation } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role_id,
        department,
        designation,
        status: 'Active'
      },
      include: { role: true }
    });

    res.status(201).json({ status: 'success', data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create user' });
  }
};

// Get roles for dropdown
exports.getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.status(200).json({ status: 'success', data: roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch roles' });
  }
};
