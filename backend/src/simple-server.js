const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'family_health',
  user: process.env.DB_USER || 'family_health',
  password: process.env.DB_PASSWORD || 'password',
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      time: result.rows[0].now
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Simple auth endpoints
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // For demo purposes, create a simple user if not exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userCheck.rows.length === 0) {
      // Create demo user
      const newUser = await pool.query(`
        INSERT INTO users (id, email, username, first_name, last_name, role, password_hash, is_active, email_verified)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 'user', $5, true, true)
        RETURNING id, email, username, first_name, last_name, role, is_active, email_verified, created_at
      `, [email, email.split('@')[0], 'Demo', 'User', 'hashed_password']);

      const user = newUser.rows[0];
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: `${user.first_name} ${user.last_name}`,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at
        },
        token: 'demo-token-' + user.id,
        message: 'Login successful'
      });
    } else {
      const user = userCheck.rows[0];
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: `${user.first_name} ${user.last_name}`,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at
        },
        token: 'demo-token-' + user.id,
        message: 'Login successful'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, username, firstName, lastName, password } = req.body;

    const newUser = await pool.query(`
      INSERT INTO users (id, email, username, first_name, last_name, role, password_hash, is_active, email_verified)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, 'user', $5, true, true)
      RETURNING id, email, username, first_name, last_name, role, is_active, email_verified, created_at
    `, [email, username, firstName, lastName, 'hashed_password']);

    const user = newUser.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      },
      token: 'demo-token-' + user.id,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

app.get('/api/v1/auth/profile', async (req, res) => {
  try {
    // For demo purposes, return first user
    const userResult = await pool.query('SELECT * FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

// Patient endpoints
app.get('/api/v1/patients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone,
             avatar_url, medical_history, allergies, family_medical_history, created_at, updated_at
      FROM patients
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: 1,
        limit: 20,
        total: result.rows.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get patients'
    });
  }
});

app.post('/api/v1/patients', async (req, res) => {
  try {
    const { name, dateOfBirth, gender, phone, email, address, emergencyContactName, emergencyContactPhone,
           allergies, familyMedicalHistory, medicalHistory } = req.body;

    // For demo purposes, use the first user as user_id
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userResult.rows[0]?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'No user found. Please create a user first.'
      });
    }

    const newPatient = await pool.query(`
      INSERT INTO patients (user_id, name, date_of_birth, gender, phone, email, address,
                           emergency_contact_name, emergency_contact_phone, allergies,
                           family_medical_history, medical_history, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id, name, date_of_birth, gender, phone, email, address, emergency_contact_name,
                emergency_contact_phone, allergies, family_medical_history, medical_history, created_at, updated_at
    `, [userId, name, dateOfBirth, gender, phone, email, address, emergencyContactName,
        emergencyContactPhone, allergies, familyMedicalHistory, medicalHistory]);

    res.json({
      success: true,
      data: newPatient.rows[0],
      message: 'Patient created successfully'
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create patient'
    });
  }
});

// Doctor endpoints
app.get('/api/v1/doctors', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, specialty, phone, email, created_at, updated_at
      FROM doctors
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get doctors'
    });
  }
});

app.post('/api/v1/doctors', async (req, res) => {
  try {
    const { name, specialty, phone, email } = req.body;

    const newDoctor = await pool.query(`
      INSERT INTO doctors (id, name, specialty, phone, email, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, specialty, phone, email, created_at, updated_at
    `, [name, specialty, phone, email]);

    res.json({
      success: true,
      data: newDoctor.rows[0],
      message: 'Doctor created successfully'
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create doctor'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
});

module.exports = app;