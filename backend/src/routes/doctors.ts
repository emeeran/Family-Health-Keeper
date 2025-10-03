import { Router } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { Doctor, PaginatedResponse } from '../types';

const router = Router();

// Get all doctors (active ones)
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, specialty } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const limitNum = Number(limit);

  try {
    let whereClause = 'WHERE d.is_active = true';
    let queryParams: any[] = [];
    let paramCount = 0;

    // Add search filter
    if (search) {
      paramCount++;
      whereClause += ` AND (d.name ILIKE $${paramCount} OR d.specialty ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add specialty filter
    if (specialty) {
      paramCount++;
      whereClause += ` AND d.specialty = $${paramCount}`;
      queryParams.push(specialty);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM doctors d
      ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get doctors with pagination
    const doctorsQuery = `
      SELECT
        d.id, d.name, d.specialty, d.phone, d.email, d.address,
        d.hospital_affiliation, d.license_number, d.years_experience,
        d.is_active, d.created_at, d.updated_at,
        COUNT(p.id) as patient_count
      FROM doctors d
      LEFT JOIN patients p ON d.id = p.primary_doctor_id AND p.is_active = true
      ${whereClause}
      GROUP BY d.id, d.name, d.specialty, d.phone, d.email, d.address,
               d.hospital_affiliation, d.license_number, d.years_experience,
               d.is_active, d.created_at, d.updated_at
      ORDER BY d.name ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limitNum, offset);
    const doctorsResult = await query(doctorsQuery, queryParams);

    const response: PaginatedResponse<Doctor> = {
      success: true,
      data: doctorsResult.rows,
      pagination: {
        page: Number(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctors'
    });
  }
}));

// Get a specific doctor by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const doctorId = req.params.id;

  try {
    const doctorQuery = `
      SELECT
        d.id, d.name, d.specialty, d.phone, d.email, d.address,
        d.hospital_affiliation, d.license_number, d.years_experience,
        d.is_active, d.created_at, d.updated_at,
        COUNT(p.id) as patient_count
      FROM doctors d
      LEFT JOIN patients p ON d.id = p.primary_doctor_id AND p.is_active = true
      WHERE d.id = $1 AND d.is_active = true
      GROUP BY d.id, d.name, d.specialty, d.phone, d.email, d.address,
               d.hospital_affiliation, d.license_number, d.years_experience,
               d.is_active, d.created_at, d.updated_at
    `;

    const doctorResult = await query(doctorQuery, [doctorId]);

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: doctorResult.rows[0]
    });

  } catch (error) {
    logger.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor'
    });
  }
}));

// Get all specialities
router.get('/specialties/list', asyncHandler(async (req, res) => {
  try {
    const specialtiesQuery = `
      SELECT DISTINCT specialty, COUNT(*) as doctor_count
      FROM doctors
      WHERE is_active = true AND specialty IS NOT NULL
      GROUP BY specialty
      ORDER BY specialty ASC
    `;

    const result = await query(specialtiesQuery);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    logger.error('Get specialties error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch specialties'
    });
  }
}));

export default router;