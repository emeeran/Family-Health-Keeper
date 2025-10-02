import type { Patient, MedicalRecord, Doctor } from '../types';

interface ShareOptions {
  includeFullHistory?: boolean;
  includeMedications?: boolean;
  includeAllergies?: boolean;
  includeRecentVisits?: boolean;
  maxRecentVisits?: number;
  customMessage?: string;
}

export class WhatsAppShareService {
  /**
   * Generate a formatted patient summary for WhatsApp sharing
   */
  static generatePatientSummary(
    patient: Patient,
    options: ShareOptions = {}
  ): string {
    const {
      includeFullHistory = true,
      includeMedications = true,
      includeAllergies = true,
      includeRecentVisits = true,
      maxRecentVisits = 3,
      customMessage = ''
    } = options;

    let message = '📋 *MEDICAL INFORMATION SUMMARY*\n\n';

    // Patient基本信息
    message += `👤 *Patient Details*\n`;
    message += `Name: ${patient.name}\n`;

    if (patient.dateOfBirth) {
      const age = this.calculateAge(patient.dateOfBirth);
      message += `Age: ${age} years\n`;
    }

    if (patient.gender) {
      message += `Gender: ${patient.gender}\n`;
    }

    if (patient.contactInfo?.phone) {
      message += `Phone: ${patient.contactInfo.phone}\n`;
    }

    message += '\n';

    // Medical History
    if (includeFullHistory && patient.medicalHistory) {
      message += `🏥 *Medical History*\n`;
      message += `${this.truncateText(patient.medicalHistory, 300)}\n\n`;
    }

    // Current Medications
    if (includeMedications && patient.currentMedications && patient.currentMedications.length > 0) {
      message += `💊 *Current Medications*\n`;
      patient.currentMedications.forEach(med => {
        message += `• ${med.name}`;
        if (med.dosage) message += ` - ${med.dosage}`;
        if (med.frequency) message += ` (${med.frequency})`;
        message += '\n';
      });
      message += '\n';
    }

    // Allergies
    if (includeAllergies && patient.allergies && patient.allergies.length > 0) {
      message += `⚠️ *Allergies*\n`;
      patient.allergies.forEach(allergy => {
        message += `• ${allergy}\n`;
      });
      message += '\n';
    }

    // Recent Visits
    if (includeRecentVisits && patient.records && patient.records.length > 0) {
      message += `🗓️ *Recent Medical Visits* (Last ${maxRecentVisits})\n`;
      const recentRecords = patient.records
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, maxRecentVisits);

      recentRecords.forEach(record => {
        message += `\n📅 ${new Date(record.date).toLocaleDateString()}\n`;
        message += `🩺 *Diagnosis:* ${record.diagnosis}\n`;
        if (record.complaint) {
          message += `💭 *Complaint:* ${this.truncateText(record.complaint, 100)}\n`;
        }
        if (record.prescription) {
          message += `📝 *Prescription:* ${this.truncateText(record.prescription, 150)}\n`;
        }
      });
      message += '\n';
    }

    // Emergency Contact
    if (patient.emergencyContact) {
      message += `🚨 *Emergency Contact*\n`;
      message += `Name: ${patient.emergencyContact.name}\n`;
      if (patient.emergencyContact.phone) {
        message += `Phone: ${patient.emergencyContact.phone}\n`;
      }
      if (patient.emergencyContact.relationship) {
        message += `Relationship: ${patient.emergencyContact.relationship}\n`;
      }
      message += '\n';
    }

    // Custom message
    if (customMessage) {
      message += `💬 *Additional Information*\n`;
      message += `${customMessage}\n\n`;
    }

    // Footer
    message += `📱 *Shared via Family Health Keeper*\n`;
    message += `🕒 ${new Date().toLocaleString()}\n`;
    message += `⚠️ This information is for medical consultation purposes only.`;

    return message;
  }

  /**
   * Generate a specific medical record summary
   */
  static generateMedicalRecordSummary(
    patient: Patient,
    record: MedicalRecord
  ): string {
    let message = '🏥 *MEDICAL VISIT SUMMARY*\n\n';

    message += `👤 *Patient:* ${patient.name}\n`;

    if (patient.dateOfBirth) {
      const age = this.calculateAge(patient.dateOfBirth);
      message += `🎂 *Age:* ${age} years\n`;
    }

    message += `📅 *Visit Date:* ${new Date(record.date).toLocaleDateString()}\n\n`;

    if (record.complaint) {
      message += `💭 *Chief Complaint*\n`;
      message += `${this.truncateText(record.complaint, 200)}\n\n`;
    }

    if (record.investigations) {
      message += `🔬 *Investigations*\n`;
      message += `${this.truncateText(record.investigations, 200)}\n\n`;
    }

    if (record.diagnosis) {
      message += `🩺 *Diagnosis*\n`;
      message += `${this.truncateText(record.diagnosis, 200)}\n\n`;
    }

    if (record.prescription) {
      message += `📝 *Prescription*\n`;
      message += `${this.truncateText(record.prescription, 300)}\n\n`;
    }

    if (record.notes) {
      message += `📋 *Doctor's Notes*\n`;
      message += `${this.truncateText(record.notes, 200)}\n\n`;
    }

    // Current medications context
    if (patient.currentMedications && patient.currentMedications.length > 0) {
      message += `💊 *Current Medications*\n`;
      patient.currentMedications.forEach(med => {
        message += `• ${med.name}`;
        if (med.dosage) message += ` - ${med.dosage}`;
        message += '\n';
      });
      message += '\n';
    }

    // Allergies
    if (patient.allergies && patient.allergies.length > 0) {
      message += `⚠️ *Allergies*\n`;
      patient.allergies.forEach(allergy => {
        message += `• ${allergy}\n`;
      });
      message += '\n';
    }

    message += `📱 *Shared via Family Health Keeper*\n`;
    message += `🕒 ${new Date().toLocaleString()}\n`;
    message += `⚠️ For medical consultation purposes only.`;

    return message;
  }

  /**
   * Share via WhatsApp Web
   */
  static shareViaWhatsApp(message: string, phoneNumber?: string): void {
    const encodedMessage = encodeURIComponent(message);
    let url = `https://web.whatsapp.com/send?text=${encodedMessage}`;

    if (phoneNumber) {
      // Remove any non-digit characters and ensure country code
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        url += `&phone=${cleanPhone}`;
      }
    }

    window.open(url, '_blank', 'width=800,height=600');
  }

  /**
   * Share via WhatsApp Mobile
   */
  static shareViaWhatsAppMobile(message: string, phoneNumber?: string): void {
    const encodedMessage = encodeURIComponent(message);
    let url = `https://wa.me/send?text=${encodedMessage}`;

    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      }
    }

    window.open(url, '_blank');
  }

  /**
   * Detect if user is on mobile and open appropriate WhatsApp
   */
  static shareWhatsApp(message: string, phoneNumber?: string): void {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      this.shareViaWhatsAppMobile(message, phoneNumber);
    } else {
      this.shareViaWhatsApp(message, phoneNumber);
    }
  }

  /**
   * Share with doctor information
   */
  static shareWithDoctor(
    patient: Patient,
    doctor: Doctor,
    recordId?: string,
    options: ShareOptions = {}
  ): void {
    let message = '';

    if (recordId) {
      const record = patient.records.find(r => r.id === recordId);
      if (record) {
        message = this.generateMedicalRecordSummary(patient, record);
      } else {
        message = this.generatePatientSummary(patient, options);
      }
    } else {
      message = this.generatePatientSummary(patient, options);
    }

    // Add doctor greeting
    message = `👨‍⚕️ *Dear Dr. ${doctor.name}*\n\n${message}`;

    this.shareWhatsApp(message, doctor.contactInfo?.phone);
  }

  /**
   * Calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Truncate text to specified length
   */
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
}