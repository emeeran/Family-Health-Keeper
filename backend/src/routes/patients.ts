import { Router } from 'express';
import { query, transaction } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { Patient, PatientQueryParams, PaginatedResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all patients for the authenticated user
router.get('/', asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const { page = 1, limit = 20, search, doctor_id }: PatientQueryParams = req.query;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const offset = (Number(page) - 1) * Number(limit);
  const limitNum = Number(limit);

  try {
    let whereClause = 'WHERE p.user_id = $1 AND p.is_active = true';
    let queryParams: any[] = [userId];
    let paramCount = 1;

    // Add search filter
    if (search) {
      paramCount++;
      whereClause += ` AND (p.name ILIKE $${paramCount} OR p.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add doctor filter
    if (doctor_id) {
      paramCount++;
      whereClause += ` AND p.primary_doctor_id = $${paramCount}`;
      queryParams.push(doctor_id);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM patients p
      ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get patients with pagination
    const patientsQuery = `
      SELECT
        p.id, p.name, p.date_of_birth, p.gender, p.blood_type, p.phone, p.email,
        p.address, p.emergency_contact_name, p.emergency_contact_phone,
        p.primary_doctor_id, p.avatar_url, p.medical_history, p.allergies,
        p.family_medical_history, p.is_active, p.created_at, p.updated_at,
        d.name as primary_doctor_name, d.specialty as primary_doctor_specialty
      FROM patients p
      LEFT JOIN doctors d ON p.primary_doctor_id = d.id
      ${whereClause}
      ORDER BY p.updated_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limitNum, offset);
    const patientsResult = await query(patientsQuery, queryParams);

    // Get hospital IDs for each patient
    const patientIds = patientsResult.rows.map((p: any) => p.id);
    let hospitalIds: any = {};

    if (patientIds.length > 0) {
      const hospitalQuery = `
        SELECT patient_id, hospital_name, hospital_patient_id
        FROM patient_hospital_ids
        WHERE patient_id = ANY($1)
      `;

      const hospitalResult = await query(hospitalQuery, [patientIds]);

      hospitalResult.rows.forEach((hospital: any) => {
        if (!hospitalIds[hospital.patient_id]) {
          hospitalIds[hospital.patient_id] = [];
        }
        hospitalIds[hospital.patient_id].push({
          hospital_name: hospital.hospital_name,
          hospital_patient_id: hospital.hospital_patient_id
        });
      });
    }

    // Format response
    const patients = patientsResult.rows.map((patient: any) => ({
      ...patient,
      hospitalIds: hospitalIds[patient.id] || []
    }));

    const response: PaginatedResponse<Patient> = {
      success: true,
      data: patients,
      pagination: {
        page: Number(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patients'
    });
  }
}));

// Get a specific patient by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const patientId = req.params.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const patientQuery = `
      SELECT
        p.id, p.name, p.date_of_birth, p.gender, p.blood_type, p.phone, p.email,
        p.address, p.emergency_contact_name, p.emergency_contact_phone,
        p.primary_doctor_id, p.avatar_url, p.medical_history, p.allergies,
        p.family_medical_history, p.is_active, p.created_at, p.updated_at,
        d.name as primary_doctor_name, d.specialty as primary_doctor_specialty
      FROM patients p
      LEFT JOIN doctors d ON p.primary_doctor_id = d.id
      WHERE p.id = $1 AND p.user_id = $2 AND p.is_active = true
    `;

    const patientResult = await query(patientQuery, [patientId, userId]);

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Get hospital IDs
    const hospitalQuery = `
      SELECT hospital_name, hospital_patient_id
      FROM patient_hospital_ids
      WHERE patient_id = $1
    `;

    const hospitalResult = await query(hospitalQuery, [patientId]);

    const patient = {
      ...patientResult.rows[0],
      hospitalIds: hospitalResult.rows
    };

    res.json({
      success: true,
      data: patient
    });

  } catch (error) {
    logger.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient'
    });
  }
}));

// Create a new patient
router.post('/', asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const patientData = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Validate required fields
  if (!patientData.name) {
    return res.status(400).json({
      success: false,
      error: 'Patient name is required'
    });
  }

  try {
    const result = await transaction(async (client) => {
      // Insert patient
      const patientQuery = `
        INSERT INTO patients (
          user_id, name, date_of_birth, gender, blood_type, phone, email,
          address, emergency_contact_name, emergency_contact_phone,
          primary_doctor_id, avatar_url, medical_history, allergies,
          family_medical_history
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
        RETURNING *
      `;

      const patientResult = await client.query(patientQuery, [
        userId,
        patientData.name,
        patientData.date_of_birth || null,
        patientData.gender || null,
        patientData.blood_type || null,
        patientData.phone || null,
        patientData.email || null,
        patientData.address || null,
        patientData.emergency_contact_name || null,
        patientData.emergency_contact_phone || null,
        patientData.primary_doctor_id || null,
        patientData.avatar_url || null,
        patientData.medical_history || null,
        patientData.allergies || null,
        patientData.family_medical_history || null
      ]);

      const patient = patientResult.rows[0];

      // Insert hospital IDs if provided
      if (patientData.hospitalIds && patientData.hospitalIds.length > 0) {
        const hospitalQuery = `
          INSERT INTO patient_hospital_ids (patient_id, hospital_name, hospital_patient_id)
          VALUES ${patientData.hospitalIds.map((_: any, i: number) =>
            `($1, $${i + 2}, $${i + 2 + patientData.hospitalIds.length})`
          ).join(', ')}
        `;

        const hospitalParams = [
          patient.id,
          ...patientData.hospitalIds.flatMap((hospital: any) =>
            [hospital.hospital_name, hospital.hospital_patient_id]
          )
        ];

        await client.query(hospitalQuery, hospitalParams);
      }

      return patient;
    });

    logger.info('Patient created successfully', {
      patientId: result.id,
      userId,
      patientName: result.name
    });

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: result
    });

  } catch (error) {
    logger.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create patient'
    });
  }
}));

// Update a patient
router.put('/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const patientId = req.params.id;
  const updateData = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const result = await transaction(async (client) => {
      // Update patient
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      // Build dynamic update query
      const allowedFields = [
        'name', 'date_of_birth', 'gender', 'blood_type', 'phone', 'email',
        'address', 'emergency_contact_name', 'emergency_contact_phone',
        'primary_doctor_id', 'avatar_url', 'medical_history', 'allergies',
        'family_medical_history'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          paramCount++;
          updateFields.push(`${field} = $${paramCount}`);
          updateValues.push(updateData[field]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push('updated_at = NOW()');

      const updateQuery = `
        UPDATE patients
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount + 1} AND user_id = $${paramCount + 2} AND is_active = true
        RETURNING *
      `;

      updateValues.push(patientId, userId);

      const patientResult = await client.query(updateQuery, updateValues);

      if (patientResult.rows.length === 0) {
        throw new Error('Patient not found');
      }

      // Update hospital IDs if provided
      if (updateData.hospitalIds !== undefined) {
        // Delete existing hospital IDs
        await client.query(
          'DELETE FROM patient_hospital_ids WHERE patient_id = $1',
          [patientId]
        );

        // Insert new hospital IDs
        if (updateData.hospitalIds.length > 0) {
          const hospitalQuery = `
            INSERT INTO patient_hospital_ids (patient_id, hospital_name, hospital_patient_id)
            VALUES ${updateData.hospitalIds.map((_: any, i: number) =>
              `($1, $${i + 2}, $${i + 2 + updateData.hospitalIds.length})`
            ).join(', ')}
          `;

          const hospitalParams = [
            patientId,
            ...updateData.hospitalIds.flatMap((hospital: any) =>
              [hospital.hospital_name, hospital.hospital_patient_id]
            )
          ];

          await client.query(hospitalQuery, hospitalParams);
        }
      }

      return patientResult.rows[0];
    });

    logger.info('Patient updated successfully', {
      patientId: result.id,
      userId,
      patientName: result.name
    });

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: result
    });

  } catch (error) {
    if (error.message === 'Patient not found') {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    logger.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update patient'
    });
  }
}));

// Delete a patient (soft delete)
router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const patientId = req.params.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const deleteQuery = `
      UPDATE patients
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND is_active = true
      RETURNING id, name
    `;

    const result = await query(deleteQuery, [patientId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    logger.info('Patient deleted successfully', {
      patientId: result.rows[0].id,
      userId,
      patientName: result.rows[0].name
    });

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    logger.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete patient'
    });
  }
}));

export default router;