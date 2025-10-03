import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../config/database';
import { logger } from '../utils/logger';
import { generateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';
import { validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const validateLogin = (req: LoginRequest, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Register user
router.post('/register', asyncHandler(async (req, res) => {
  const { email, username, password, confirmPassword, firstName, lastName, role = 'user' }: RegisterRequest = req.body;

  // Validate input
  if (!email || !username || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: 'All required fields must be provided'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: 'Passwords do not match'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email or username already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user using transaction
    const result = await transaction(async (client) => {
      // Insert user
      const userQuery = `
        INSERT INTO users (email, username, password_hash, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, username, first_name, last_name, role, is_active, email_verified, created_at
      `;

      const userResult = await client.query(userQuery, [
        email, username, passwordHash, firstName, lastName, role
      ]);

      const user = userResult.rows[0];

      // Create session
      const token = generateToken(user);
      const sessionQuery = `
        INSERT INTO sessions (user_id, token, expires_at, device_info, ip_address)
        VALUES ($1, $2, NOW() + INTERVAL '24 hours', $3, $4)
        RETURNING id
      `;

      await client.query(sessionQuery, [
        user.id,
        token,
        req.get('User-Agent'),
        req.ip
      ]);

      return { user, token };
    });

    logger.info('User registered successfully', { userId: result.user.id, email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: result.user,
      token: result.token
    } as AuthResponse);

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
}));

// Login user
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password, rememberMe = false }: LoginRequest = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  try {
    // Find user by email
    const userQuery = `
      SELECT id, email, username, password_hash, first_name, last_name, role,
             is_active, email_verified, created_at, updated_at, last_login
      FROM users
      WHERE email = $1 AND is_active = true
    `;

    const userResult = await query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      logger.warn('Failed login attempt', { email, ip: req.ip });
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const tokenExpiry = rememberMe ? '7d' : '24h';
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login
    });

    // Update user's last login and create session
    await transaction(async (client) => {
      // Update last login
      await client.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      // Invalidate old sessions (optional - only keep last session)
      await client.query(
        'UPDATE sessions SET is_active = false WHERE user_id = $1',
        [user.id]
      );

      // Create new session
      const sessionQuery = `
        INSERT INTO sessions (user_id, token, expires_at, device_info, ip_address)
        VALUES ($1, $2, NOW() + INTERVAL '${tokenExpiry}', $3, $4)
      `;

      await client.query(sessionQuery, [
        user.id,
        token,
        req.get('User-Agent'),
        req.ip
      ]);
    });

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    logger.info('User logged in successfully', { userId: user.id, email });

    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    } as AuthResponse);

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}));

// Logout user
router.post('/logout', asyncHandler(async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    // Invalidate session
    await query(
      'UPDATE sessions SET is_active = false WHERE token = $1',
      [token]
    );

    logger.info('User logged out successfully');

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
}));

// Get current user profile
router.get('/profile', asyncHandler(async (req, res) => {
  // This route should be protected by auth middleware
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const userQuery = `
      SELECT id, email, username, first_name, last_name, role, avatar_url,
             is_active, email_verified, created_at, updated_at, last_login
      FROM users
      WHERE id = $1
    `;

    const result = await query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
}));

// Update user profile
router.put('/profile', asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const { first_name, last_name, avatar_url } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const updateQuery = `
      UPDATE users
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          avatar_url = COALESCE($3, avatar_url),
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, email, username, first_name, last_name, role, avatar_url,
                is_active, email_verified, created_at, updated_at
    `;

    const result = await query(updateQuery, [
      first_name,
      last_name,
      avatar_url,
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
}));

// Change password
router.put('/change-password', asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!userId || !currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required'
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: 'New passwords do not match'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters long'
    });
  }

  try {
    // Get current password hash
    const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const userResult = await query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const currentHash = userResult.rows[0].password_hash;

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentHash);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Invalidate all existing sessions (force re-login)
    await query(
      'UPDATE sessions SET is_active = false WHERE user_id = $1',
      [userId]
    );

    logger.info('Password changed successfully', { userId });

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
}));

export default router;