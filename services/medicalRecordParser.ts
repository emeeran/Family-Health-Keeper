import { MedicalRecord, Document, Medication } from '../types';

export interface ParsedMedicalData {
  chiefComplaints: string[];
  investigations: string[];
  diagnoses: string[];
  prescriptions: Medication[];
  notes: string[];
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
    height?: string;
  };
  followUp?: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface VisitOverview {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  medicationChanges: {
    added: Medication[];
    modified: Medication[];
    discontinued: string[];
  };
  followUpPlan: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  redFlags: string[];
}

export class MedicalRecordParser {
  // Patterns for extracting medical information
  private static readonly PATTERNS = {
    // Chief complaints patterns
    chiefComplaint: [
      /c\/c\s*:?\s*([^\n]+)/i,
      /chief complaint\s*:?\s*([^\n]+)/i,
      /presenting complaint\s*:?\s*([^\n]+)/i,
      /patient presents with\s*([^\n]+)/i,
      /complains of\s*([^\n]+)/i
    ],

    // Investigations patterns
    investigation: [
      /ix\s*:?\s*([^\n]+)/i,
      /investigations?\s*:?\s*([^\n]+)/i,
      /labs?\s*:?\s*([^\n]+)/i,
      /tests?\s*:?\s*([^\n]+)/i,
      /diagnostic\s*:?\s*([^\n]+)/i
    ],

    // Diagnoses patterns
    diagnosis: [
      /d\/dx\s*:?\s*([^\n]+)/i,
      /diagnosis\s*:?\s*([^\n]+)/i,
      /diagnoses?\s*:?\s*([^\n]+)/i,
      /assessment\s*:?\s*([^\n]+)/i,
      /impression\s*:?\s*([^\n]+)/i
    ],

    // Prescriptions patterns
    prescription: [
      /r\/x\s*:?\s*([^\n]+)/i,
      /prescription\s*:?\s*([^\n]+)/i,
      /rx\s*:?\s*([^\n]+)/i,
      /medications?\s*:?\s*([^\n]+)/i,
      /treatment\s*:?\s*([^\n]+)/i
    ],

    // Vitals patterns
    vitals: {
      bloodPressure: /bp\s*:?\s*(\d{2,3}\/\d{2,3})/i,
      heartRate: /hr\s*:?\s*(\d{2,3})\s*bpm/i,
      temperature: /temp\s*:?\s*(\d{2,3}\.\d)/i,
      weight: /wt\s*:?\s*(\d{2,3})\s*kg/i,
      height: /ht\s*:?\s*(\d{2,3})\s*cm/i
    },

    // Follow-up patterns
    followUp: [
      /follow[-\s]?up\s*:?\s*([^\n]+)/i,
      /review\s*:?\s*([^\n]+)/i,
      /next visit\s*:?\s*([^\n]+)/i
    ]
  };

  /**
   * Parse medical record text and extract structured data
   */
  static parseMedicalRecord(text: string): ParsedMedicalData {
    const result: ParsedMedicalData = {
      chiefComplaints: [],
      investigations: [],
      diagnoses: [],
      prescriptions: [],
      notes: [],
      urgency: 'medium'
    };

    // Extract chief complaints
    result.chiefComplaints = this.extractMultiplePatterns(text, this.PATTERNS.chiefComplaint);

    // Extract investigations
    result.investigations = this.extractMultiplePatterns(text, this.PATTERNS.investigation);

    // Extract diagnoses
    result.diagnoses = this.extractMultiplePatterns(text, this.PATTERNS.diagnosis);

    // Extract and parse prescriptions
    const prescriptionTexts = this.extractMultiplePatterns(text, this.PATTERNS.prescription);
    result.prescriptions = this.parsePrescriptions(prescriptionTexts);

    // Extract vitals
    result.vitals = this.extractVitals(text);

    // Extract follow-up
    const followUpTexts = this.extractMultiplePatterns(text, this.PATTERNS.followUp);
    result.followUp = followUpTexts[0];

    // Determine urgency based on content
    result.urgency = this.determineUrgency(result);

    // Extract remaining notes
    result.notes = this.extractNotes(text);

    return result;
  }

  /**
   * Generate AI-powered visit overview from parsed medical data
   */
  static generateVisitOverview(parsedData: ParsedMedicalData, record: MedicalRecord): VisitOverview {
    const urgency = this.determineUrgency(parsedData);
    const redFlags = this.identifyRedFlags(parsedData);

    // Generate summary
    const summary = this.generateSummary(parsedData, record);

    // Extract key findings
    const keyFindings = this.extractKeyFindings(parsedData);

    // Generate recommendations
    const recommendations = this.generateRecommendations(parsedData);

    // Create follow-up plan
    const followUpPlan = this.createFollowUpPlan(parsedData);

    return {
      summary,
      keyFindings,
      recommendations,
      medicationChanges: {
        added: parsedData.prescriptions,
        modified: [],
        discontinued: []
      },
      followUpPlan,
      urgencyLevel: urgency,
      redFlags
    };
  }

  /**
   * Extract text from multiple pattern matches
   */
  private static extractMultiplePatterns(text: string, patterns: RegExp[]): string[] {
    const results: string[] = [];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (let i = 1; i < matches.length; i++) {
          const match = matches[i]?.trim();
          if (match && !results.includes(match)) {
            results.push(match);
          }
        }
      }
    }

    return results;
  }

  /**
   * Parse prescription text into medication objects
   */
  private static parsePrescriptions(prescriptionTexts: string[]): Medication[] {
    const medications: Medication[] = [];

    for (const text of prescriptionTexts) {
      // Parse medication format: "MedicationName strength - dosage frequency"
      const medPattern = /([a-zA-Z\s]+)(\d+[a-zA-Z]*)?\s*[-:]?\s*([^\n]+)/i;
      const match = text.match(medPattern);

      if (match) {
        const medication: Medication = {
          id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: match[1].trim(),
          strength: match[2]?.trim(),
          dosage: '1 tablet', // Default, could be refined
          frequency: match[3]?.trim() || 'Once daily',
          startDate: new Date().toISOString().split('T')[0]
        };

        medications.push(medication);
      }
    }

    return medications;
  }

  /**
   * Extract vitals from text
   */
  private static extractVitals(text: string) {
    const vitals: any = {};

    for (const [key, pattern] of Object.entries(this.PATTERNS.vitals)) {
      const match = text.match(pattern as RegExp);
      if (match) {
        vitals[key] = match[1];
      }
    }

    return Object.keys(vitals).length > 0 ? vitals : undefined;
  }

  /**
   * Determine urgency level based on parsed data
   */
  private static determineUrgency(parsedData: ParsedMedicalData): 'low' | 'medium' | 'high' {
    // High urgency indicators
    const highUrgencyKeywords = [
      'emergency', 'urgent', 'severe', 'critical', 'chest pain', 'difficulty breathing',
      'high fever', 'uncontrolled', 'acute', 'abnormal', 'elevated'
    ];

    // Low urgency indicators
    const lowUrgencyKeywords = [
      'routine', 'follow-up', 'checkup', 'normal', 'stable', 'improved', 'resolved'
    ];

    const allText = [
      ...parsedData.chiefComplaints,
      ...parsedData.investigations,
      ...parsedData.diagnoses,
      ...parsedData.notes
    ].join(' ').toLowerCase();

    if (highUrgencyKeywords.some(keyword => allText.includes(keyword))) {
      return 'high';
    }

    if (lowUrgencyKeywords.some(keyword => allText.includes(keyword))) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Identify red flags in the medical data
   */
  private static identifyRedFlags(parsedData: ParsedMedicalData): string[] {
    const redFlags: string[] = [];

    // Check for high urgency in complaints
    if (parsedData.chiefComplaints.some(complaint =>
      complaint.toLowerCase().includes('chest pain') ||
      complaint.toLowerCase().includes('difficulty breathing') ||
      complaint.toLowerCase().includes('severe')
    )) {
      redFlags.push('Chest pain or breathing difficulties detected');
    }

    // Check for abnormal vitals
    if (parsedData.vitals?.bloodPressure) {
      const bp = parsedData.vitals.bloodPressure.split('/');
      const systolic = parseInt(bp[0]);
      const diastolic = parseInt(bp[1]);

      if (systolic > 180 || diastolic > 120) {
        redFlags.push('Hypertensive crisis detected');
      } else if (systolic > 140 || diastolic > 90) {
        redFlags.push('Elevated blood pressure');
      }
    }

    // Check for multiple new prescriptions
    if (parsedData.prescriptions.length > 3) {
      redFlags.push('Multiple new medications prescribed');
    }

    return redFlags;
  }

  /**
   * Generate visit summary
   */
  private static generateSummary(parsedData: ParsedMedicalData, record: MedicalRecord): string {
    const complaint = parsedData.chiefComplaints[0] || 'General consultation';
    const diagnosis = parsedData.diagnoses[0] || 'Under evaluation';

    return `Patient presented with ${complaint.toLowerCase()}. ` +
           `Assessment indicates ${diagnosis.toLowerCase()}. ` +
           `${parsedData.prescriptions.length > 0 ? `Treatment initiated with ${parsedData.prescriptions.length} medication(s).` : 'No new medications prescribed.'} ` +
           `${parsedData.followUp ? `Follow-up scheduled: ${parsedData.followUp}.` : 'Follow-up to be determined.'}`;
  }

  /**
   * Extract key findings
   */
  private static extractKeyFindings(parsedData: ParsedMedicalData): string[] {
    const findings: string[] = [];

    if (parsedData.chiefComplaints.length > 0) {
      findings.push(`Primary complaint: ${parsedData.chiefComplaints[0]}`);
    }

    if (parsedData.investigations.length > 0) {
      findings.push(`Investigations ordered: ${parsedData.investigations.join(', ')}`);
    }

    if (parsedData.diagnoses.length > 0) {
      findings.push(`Diagnosis: ${parsedData.diagnoses.join(', ')}`);
    }

    if (parsedData.vitals) {
      const vitalList = Object.entries(parsedData.vitals)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      findings.push(`Vitals: ${vitalList}`);
    }

    return findings;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(parsedData: ParsedMedicalData): string[] {
    const recommendations: string[] = [];

    if (parsedData.prescriptions.length > 0) {
      recommendations.push('Adhere to prescribed medication regimen');
    }

    if (parsedData.followUp) {
      recommendations.push(`Follow-up as scheduled: ${parsedData.followUp}`);
    }

    if (parsedData.urgency === 'high') {
      recommendations.push('Monitor symptoms closely and seek immediate care if worsening');
    }

    recommendations.push('Maintain healthy lifestyle and regular exercise');

    return recommendations;
  }

  /**
   * Create follow-up plan
   */
  private static createFollowUpPlan(parsedData: ParsedMedicalData): string {
    if (parsedData.followUp) {
      return `Follow-up ${parsedData.followUp}`;
    }

    if (parsedData.urgency === 'high') {
      return 'Urgent follow-up recommended within 1-3 days';
    } else if (parsedData.urgency === 'medium') {
      return 'Follow-up in 1-2 weeks';
    } else {
      return 'Routine follow-up in 1-3 months';
    }
  }

  /**
   * Extract general notes from the text
   */
  private static extractNotes(text: string): string[] {
    // Remove already parsed sections and extract remaining meaningful content
    const patternsToIgnore = [
      /c\/c\s*:?\s*[^\n]+/gi,
      /chief complaint\s*:?\s*[^\n]+/gi,
      /ix\s*:?\s*[^\n]+/gi,
      /investigations?\s*:?\s*[^\n]+/gi,
      /d\/dx\s*:?\s*[^\n]+/gi,
      /diagnosis\s*:?\s*[^\n]+/gi,
      /r\/x\s*:?\s*[^\n]+/gi,
      /prescription\s*:?\s*[^\n]+/gi,
      /follow[-\s]?up\s*:?\s*[^\n]+/gi
    ];

    let cleanedText = text;
    for (const pattern of patternsToIgnore) {
      cleanedText = cleanedText.replace(pattern, '');
    }

    // Split into paragraphs and filter meaningful content
    const paragraphs = cleanedText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 10 && !p.match(/^\d+\.?\s*$/)); // Remove page numbers

    return paragraphs.slice(0, 5); // Limit to first 5 meaningful paragraphs
  }

  /**
   * Process multiple documents and merge their data
   */
  static processMultipleDocuments(documents: Document[]): ParsedMedicalData {
    const mergedData: ParsedMedicalData = {
      chiefComplaints: [],
      investigations: [],
      diagnoses: [],
      prescriptions: [],
      notes: [],
      urgency: 'medium'
    };

    // This would integrate with a real OCR/Document parsing service
    // For now, we'll simulate the processing
    for (const doc of documents) {
      // Simulate document content extraction
      const simulatedContent = this.simulateDocumentContent(doc);
      const docData = this.parseMedicalRecord(simulatedContent);

      // Merge data, avoiding duplicates
      mergedData.chiefComplaints = [...new Set([...mergedData.chiefComplaints, ...docData.chiefComplaints])];
      mergedData.investigations = [...new Set([...mergedData.investigations, ...docData.investigations])];
      mergedData.diagnoses = [...new Set([...mergedData.diagnoses, ...docData.diagnoses])];
      mergedData.prescriptions = [...new Set([...mergedData.prescriptions, ...docData.prescriptions])];
      mergedData.notes = [...new Set([...mergedData.notes, ...docData.notes])];

      // Use highest urgency level
      if (docData.urgency === 'high' || mergedData.urgency === 'medium') {
        mergedData.urgency = docData.urgency;
      }
    }

    return mergedData;
  }

  /**
   * Simulate document content extraction (would integrate with real OCR service)
   */
  private static simulateDocumentContent(doc: Document): string {
    // This is a placeholder for actual document processing
    // In a real implementation, this would call OCR services or document parsers

    if (doc.name.toLowerCase().includes('lab') || doc.name.toLowerCase().includes('test')) {
      return `
        C/C: Routine checkup
        Ix: Complete blood count, Lipid profile, HbA1c
        D/Dx: Well-controlled diabetes, Hyperlipidemia
        R/X: Continue current medications
        Follow-up: 3 months
      `;
    }

    if (doc.name.toLowerCase().includes('prescription') || doc.name.toLowerCase().includes('rx')) {
      return `
        R/X: Metformin 500mg - Twice daily with meals
             Atorvastatin 20mg - Once daily at bedtime
             Lisinopril 10mg - Once daily in morning
      `;
    }

    return `
      C/C: Follow-up consultation
      Ix: As per lab reports
      D/Dx: Stable condition
      Notes: Patient doing well on current regimen
    `;
  }

  /**
   * Main method to parse medical text and return structured data
   */
  static parseMedicalText(text: string): ParsedMedicalData {
    return this.parseMedicalRecord(text);
  }

  /**
   * Combine parsed data from multiple sources
   */
  static combineParsedData(...dataSources: (ParsedMedicalData | null | undefined)[]): ParsedMedicalData {
    const combined: ParsedMedicalData = {
      chiefComplaints: [],
      investigations: [],
      diagnoses: [],
      prescriptions: [],
      notes: [],
      urgency: 'medium'
    };

    for (const source of dataSources) {
      if (!source) continue;

      // Merge data, avoiding duplicates
      combined.chiefComplaints = [...new Set([...combined.chiefComplaints, ...source.chiefComplaints])];
      combined.investigations = [...new Set([...combined.investigations, ...source.investigations])];
      combined.diagnoses = [...new Set([...combined.diagnoses, ...source.diagnoses])];
      combined.prescriptions = [...new Set([...combined.prescriptions, ...source.prescriptions])];
      combined.notes = [...new Set([...combined.notes, ...source.notes])];

      // Merge vitals if present
      if (source.vitals) {
        combined.vitals = { ...combined.vitals, ...source.vitals };
      }

      // Use highest urgency level
      if (source.urgency === 'high' || (source.urgency === 'medium' && combined.urgency !== 'high')) {
        combined.urgency = source.urgency;
      }

      // Use follow-up if available
      if (source.followUp) {
        combined.followUp = source.followUp;
      }
    }

    return combined;
  }

  /**
   * Extract text from PDF files
   */
  static async extractPDFText(file: File): Promise<string> {
    // In a real implementation, this would use a PDF parsing library like pdf-parse or pdf.js
    // For now, we'll simulate the extraction
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Simulate PDF text extraction
        // In production, you'd use a proper PDF parsing library
        const simulatedText = `
          MEDICAL REPORT
          Date: ${new Date().toLocaleDateString()}

          Chief Complaint: Follow-up consultation
          Investigations: Blood work, X-ray
          Diagnosis: Stable condition
          Prescriptions: Continue current medications
          Notes: Patient responding well to treatment
        `;
        resolve(simulatedText);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract text from image files using OCR
   */
  static async extractImageText(file: File): Promise<string> {
    // In a real implementation, this would use an OCR service like Tesseract.js
    // For now, we'll simulate the OCR extraction
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Simulate OCR text extraction
        // In production, you'd use a proper OCR library
        const simulatedText = `
          OCR EXTRACTED TEXT
          Date: ${new Date().toLocaleDateString()}

          Patient Report
          Chief Complaint: Routine check-up
          Vitals: BP 120/80, HR 72
          Notes: All vital signs normal
        `;
        resolve(simulatedText);
      };
      reader.readAsDataURL(file);
    });
  }
}