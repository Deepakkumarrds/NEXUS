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
    const { name, email, password, role_id, department, designation, skills } = req.body;

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
        status: 'Active',
        skills: skills || []
      },
      include: { role: true }
    });

    res.status(201).json({ status: 'success', data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create user' });
  }
};

// Update a user (e.g. designation, department, skills)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, designation, skills, status } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        department,
        designation,
        skills: skills || undefined,
        status
      },
      include: { role: true }
    });

    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update user' });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id }
    });
    res.status(200).json({ status: 'success', message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete user' });
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

