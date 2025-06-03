const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { User } = require('../models');

// Render signup page
exports.showSignup = (req, res) => {
  res.render('signup', { error: null });
};

// Render login page
exports.showLogin = (req, res) => {
  res.render('login', { error: null });
};

// Render verify message page (after signup)
exports.showVerifyMessage = (req, res) => {
  const message = req.session.message || 'Check your email to verify your account.';
  req.session.message = null;
  res.render('verify-message', { message });
};

// Handle user registration with email verification
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.render('signup', { error: 'User with this email already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    // Create verification token
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const verificationLink = `${process.env.BASE_URL}/verify-email?token=${token}`;

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Volunteer Task App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your email',
      html: `
        <p>Hello ${name},</p>
        <p>Thank you for registering. Please verify your email by clicking the button below:</p>
        <a href="${verificationLink}" style="display:inline-block;padding:10px 20px;background-color:#28a745;color:white;text-decoration:none;border-radius:5px;">Verify Email</a>
        <p>This link will expire in 1 hour.</p>
      `
    });

    req.session.message = 'Verification email sent. Please check your inbox.';
    res.redirect('/verify-message');

  } catch (err) {
    console.error('Registration error:', err);
    res.render('signup', { error: 'An error occurred, please try again.' });
  }
};

// Email verification handler
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.send('Invalid verification link.');
    }

    user.verified = true;
    await user.save();

    res.render('verify-success', { name: user.name });
  } catch (err) {
    console.error('Email verification error:', err);
    res.send('Verification link expired or invalid.');
  }
};

// Handle user login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Admin login check
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      req.session.user = { email, name: 'Admin' };

      return req.session.save(err => {
        if (err) {
          console.error("Session save error:", err);
          return res.render('login', { error: 'Session error, please try again.' });
        }
        res.redirect('/admin-dashboard');
      });
    }

    // Regular user login
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.render('login', { error: 'User not found' });
    }

    if (!user.verified) {
      return res.render('login', { error: 'Please verify your email before logging in.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);

    if (!validPassword) {
      return res.render('login', { error: 'Invalid credentials' });
    }

    // Set session info for authenticated user
    req.session.isAdmin = false;
    req.session.user = { id: user.id, email: user.email, name: user.name };

    // Save session before redirecting
    req.session.save(err => {
      if (err) {
        console.error("Session save error:", err);
        return res.render('login', { error: 'Session error, please try again.' });
      }
      res.redirect('/dashboard');
    });

  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'An error occurred, please try again.' });
  }
};

// Handle user logout
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.redirect('/login');
  });
};

exports.showForgotPassword = (req, res) => {
  res.render('forgot-password', { message: null });
};

// Handle forgot password form submission
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.render('forgot-password', { message: 'A reset link have been sent to your email.' });
    }

    // Create a reset token (JWT or random token) - using JWT here
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

    // Send reset password email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Volunteer Task App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background-color:#6366f1;color:white;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    res.render('forgot-password', { message: 'A reset link will be will send to your mail. Please verify it.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.render('forgot-password', { message: 'An error occurred, please try again.' });
  }
};

// Render reset password page
exports.showResetPassword = (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.send('Invalid or missing password reset token.');
  }

  res.render('reset-password', { token, message: null });
};

// Handle reset password form submission
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.render('reset-password', { token, message: 'Invalid token or user does not exist.' });
    }

    // Hash the new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.render('reset-password', { message: 'Password reset successful.', token: null });

  } catch (err) {
    console.error('Reset password error:', err);
    res.render('reset-password', { token: null, message: 'Reset link expired or invalid.' });
  }
};
