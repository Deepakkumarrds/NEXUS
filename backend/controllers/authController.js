const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Please provide an email' });
    }

    // Try to find the user in the User model (admin) first
    let user = await prisma.user.findUnique({ where: { email } });
    let isClient = false;

    // If not found, try ClientUser model
    if (!user) {
      user = await prisma.clientUser.findUnique({ where: { email } });
      if (user) isClient = true;
    }

    if (!user) {
      // Return success even if not found to prevent email enumeration
      return res.status(200).json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to DB
    if (isClient) {
      await prisma.clientUser.update({
        where: { id: user.id },
        data: { reset_token: resetToken, reset_token_expires: resetTokenExpires }
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { reset_token: resetToken, reset_token_expires: resetTokenExpires }
      });
    }

    // Determine the correct frontend URL based on user type
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = isClient 
      ? `${baseUrl}/portal/reset-password?token=${resetToken}`
      : `${baseUrl}/reset-password?token=${resetToken}`;

    // Send email
    await emailService.sendPasswordResetEmail(user.email, resetLink);

    res.status(200).json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ status: 'error', message: 'Invalid request' });
    }

    // Search for token in User model
    let user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: { gt: new Date() } // Must not be expired
      }
    });
    let isClient = false;

    // If not found, search in ClientUser model
    if (!user) {
      user = await prisma.clientUser.findFirst({
        where: {
          reset_token: token,
          reset_token_expires: { gt: new Date() }
        }
      });
      if (user) isClient = true;
    }

    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Token is invalid or has expired' });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 10);

    // Update password and clear tokens
    if (isClient) {
      await prisma.clientUser.update({
        where: { id: user.id },
        data: {
          password_hash,
          reset_token: null,
          reset_token_expires: null
        }
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password_hash,
          reset_token: null,
          reset_token_expires: null
        }
      });
    }

    res.status(200).json({ status: 'success', message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
