import type { Document } from '../types';

interface OCRResult {
  text: string;
  confidence: number;
  extractedData: {
    patientName?: string;
    date?: string;
    diagnosis?: string[];
    medications?: string[];
    labResults?: Array<{
      test: string;
      value: string;
      unit: string;
      reference?: string;
    }>;
    vitals?: Array<{
      measurement: string;
      value: string;
      unit: string;
    }>;
  };
}

export const processMedicalDocument = async (document: Document): Promise<OCRResult> => {
  // In a real implementation, this would use OCR services like:
  // - Google Vision API
  // - Tesseract.js
  // - Azure Computer Vision
  // - Amazon Textract

  // For now, simulate OCR processing based on document type
  const mockOCRResult = simulateOCRProcessing(document);

  // Add delay to simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  return mockOCRResult;
};

const simulateOCRProcessing = (document: Document): OCRResult => {
  const baseResult: OCRResult = {
    text: `Document: ${document.name}\nType: ${document.type}\nUpload Date: ${new Date(document.uploadedAt).toLocaleDateString()}`,
    confidence: 0.95,
    extractedData: {}
  };

  // Simulate different OCR results based on document type
  switch (document.type) {
    case 'pdf':
      return {
        ...baseResult,
        text: `${baseResult.text}\n\nMEDICAL REPORT\nPatient: John Doe\nDate: 2024-01-15\nDiagnosis: Hypertension, Type 2 Diabetes\nLab Results:\n- Fasting Glucose: 125 mg/dL (High)\n- Blood Pressure: 140/90 mmHg (High)\n- HbA1c: 7.2% (High)\nRecommendations: Follow up in 3 months, monitor blood pressure`,
        extractedData: {
          patientName: "John Doe",
          date: "2024-01-15",
          diagnosis: ["Hypertension", "Type 2 Diabetes"],
          medications: [], // Disabled - users should enter medications manually
          labResults: [
            { test: "Fasting Glucose", value: "125", unit: "mg/dL", reference: "High" },
            { test: "Blood Pressure", value: "140/90", unit: "mmHg", reference: "High" },
            { test: "HbA1c", value: "7.2", unit: "%", reference: "High" }
          ],
          vitals: [
            { measurement: "Blood Pressure", value: "140/90", unit: "mmHg" }
          ]
        }
      };

    case 'image':
      return {
        ...baseResult,
        text: `${baseResult.text}\n\nPRESCRIPTION\nDr. Sarah Johnson\nDate: 2024-01-20\nPatient: John Doe\nNote: Prescription details should be entered manually by the user\nRefills: 3\nNext Appointment: 2024-04-20`,
        extractedData: {
          patientName: "John Doe",
          date: "2024-01-20",
          medications: [], // Disabled - users should enter medications manually
        }
      };

    default:
      return baseResult;
  }
};

export const extractMedicalKeywords = (text: string): string[] => {
  const medicalKeywords = [
    'diagnosis', 'treatment', 'medication', 'prescription', 'symptoms',
    'hypertension', 'diabetes', 'cholesterol', 'glucose', 'blood pressure',
    'heart rate', 'temperature', 'weight', 'height', 'bmi',
    'lab results', 'blood test', 'x-ray', 'mri', 'ct scan',
    'referral', 'consultation', 'follow-up', 'appointment'
  ];

  const foundKeywords: string[] = [];
  const lowerText = text.toLowerCase();

  medicalKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  });

  return [...new Set(foundKeywords)]; // Remove duplicates
};

export const analyzeDocumentForHealthInsights = async (
  document: Document,
  patient: any
): Promise<{
  summary: string;
  keyFindings: string[];
  recommendations: string[];
}> => {
  const ocrResult = await processMedicalDocument(document);
  const keywords = extractMedicalKeywords(ocrResult.text);

  // Analyze the extracted data for health insights
  const keyFindings: string[] = [];
  const recommendations: string[] = [];

  // Analyze lab results
  if (ocrResult.extractedData.labResults) {
    ocrResult.extractedData.labResults.forEach(result => {
      if (result.reference === 'High' || result.reference === 'Low') {
        keyFindings.push(`${result.test}: ${result.value} ${result.unit} (${result.reference})`);

        // Add specific recommendations based on the abnormal result
        if (result.test.toLowerCase().includes('glucose')) {
          recommendations.push('Monitor blood sugar levels regularly');
          recommendations.push('Follow dietary guidelines for diabetes management');
        } else if (result.test.toLowerCase().includes('pressure')) {
          recommendations.push('Monitor blood pressure daily');
          recommendations.push('Reduce sodium intake');
        }
      }
    });
  }

  // Analyze medications
  if (ocrResult.extractedData.medications) {
    keyFindings.push(`Current medications: ${ocrResult.extractedData.medications.join(', ')}`);
    recommendations.push('Take medications as prescribed');
    recommendations.push('Report any side effects to your doctor');
  }

  // Analyze diagnoses
  if (ocrResult.extractedData.diagnosis) {
    keyFindings.push(`Diagnoses: ${ocrResult.extractedData.diagnosis.join(', ')}`);
    recommendations.push('Follow treatment plan as outlined by your healthcare provider');
  }

  const summary = `Document analysis complete. Found ${keywords.length} medical keywords and ${keyFindings.length} key findings.`;

  return {
    summary,
    keyFindings,
    recommendations
  };
};

interface ParsedMedication {
  name: string;
  strength?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  instructions?: string;
}

export const parseMedicationFromText = (text: string): ParsedMedication | null => {
  // Common medication patterns
  const patterns = [
    // Pattern: "1. Medication Name strength - Take dosage frequency"
    /^\d+\.\s*([A-Za-z\s'-]+)\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?|%))\s*[-–]\s*(.+)$/i,
    // Pattern: "Medication Name strength - dosage frequency"
    /^([A-Za-z\s'-]+)\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?|%))\s*[-–]\s*(.+)$/i,
    // Pattern: "- Medication Name strength instructions"
    /^\-\s*([A-Za-z\s'-]+)\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?|%))\s*(.+)$/i,
    // Pattern: "Medication Name - dosage instructions"
    /^([A-Za-z\s'-]+)\s*[-–]\s*(.+)$/i,
    // Pattern: "Take Medication Name strength frequency"
    /^(?:Take|apply|use|inject)\s+([A-Za-z\s'-]+)\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?))\s*(.+)$/i,
    // Pattern: Simple medication name with instructions
    /^([A-Za-z\s'-]+?)\s+(Take|apply|use|inject)\s+(.+)$/i,
    // Pattern: Just medication name with strength
    /^([A-Za-z\s'-]+)\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?|%))$/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const [, namePart, strengthOrDosage, instructions] = match;

      // Clean up medication name
      const cleanName = namePart.replace(/^[-\d.\s]+/, '').trim();

      // Try to extract strength from the second capture group
      const strength = strengthOrDosage?.match(/^\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?|%)/i) ? strengthOrDosage : undefined;

      // Parse instructions for detailed information
      const fullInstructions = instructions || strengthOrDosage;

      // Extract dosage (how much to take)
      const dosageMatch = fullInstructions?.match(/(\d+(?:\.\d+)?\s*(?:tablet|capsule|puff|spray|drop|ml|unit|teaspoon|tablespoon)s?)/i);

      // Extract frequency (how often to take)
      const frequencyPatterns = [
        /(\d+(?:\.\d+)?\s*(?:times?|doses?)?\s*(?:daily|every|once|twice|three|four|qday|bid|tid|qid)\s*(?:day|week|month)s?)/i,
        /(once|twice|three|four)\s+(?:daily|a?day|per\s+day)/i,
        /(qday|bid|tid|qid|qhs|prn)/i,
        /(every\s+\d+\s*(?:hours?|hrs?))/i,
        /(as\s+needed|prn)/i
      ];

      let frequency;
      for (const freqPattern of frequencyPatterns) {
        const freqMatch = fullInstructions?.match(freqPattern);
        if (freqMatch) {
          frequency = freqMatch[0];
          break;
        }
      }

      // Extract route (how to take)
      const routePatterns = [
        /((?:orally|sublingually|topically|inhaled|injected|intravenously|intramuscularly|by\s+mouth))/i,
        /(take\s+by\s+(mouth|inhalation|injection))/i
      ];

      let route;
      for (const routePattern of routePatterns) {
        const routeMatch = fullInstructions?.match(routePattern);
        if (routeMatch) {
          route = routeMatch[1];
          break;
        }
      }

      // Extract timing (when to take)
      const timingMatch = fullInstructions?.match(/(with\s+(?:food|meals)|on\s+empty\s+stomach|at\s+bedtime|in\s+the\s+(morning|evening))/i);

      return {
        name: cleanName,
        strength,
        dosage: dosageMatch ? dosageMatch[1] : undefined,
        frequency,
        route,
        duration: timingMatch ? timingMatch[1] : undefined,
        instructions: fullInstructions?.trim()
      };
    }
  }

  // If no pattern matches, try to extract a simple medication name
  const medNameMatch = text.match(/^([A-Za-z\s]+?)(?:\s+\d+.*)?$/);
  if (medNameMatch) {
    return {
      name: medNameMatch[1].trim(),
      instructions: text.trim()
    };
  }

  return null;
};

export const formatMedicationsForPrescription = (medications: string[]): string => {
  if (!medications || medications.length === 0) {
    return '';
  }

  return medications
    .map((med, index) => {
      const parsedMed = parseMedicationFromText(med);

      if (parsedMed) {
        const parts = [];

        // Build formatted prescription line
        let prescriptionLine = '';

        // Medication name (capitalize properly)
        const formattedName = parsedMed.name
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        // Add strength if available
        if (parsedMed.strength) {
          prescriptionLine = `${formattedName} ${parsedMed.strength}`;
        } else {
          prescriptionLine = formattedName;
        }

        // Add dosage instructions
        const instructions = [];

        if (parsedMed.dosage) {
          instructions.push(parsedMed.dosage.toLowerCase());
        }

        if (parsedMed.frequency) {
          instructions.push(parsedMed.frequency.toLowerCase());
        }

        if (parsedMed.duration) {
          instructions.push(parsedMed.duration.toLowerCase());
        }

        // Use original instructions if we couldn't parse detailed ones
        if (instructions.length === 0 && parsedMed.instructions) {
          prescriptionLine += ` - ${parsedMed.instructions}`;
        } else if (instructions.length > 0) {
          prescriptionLine += ` - ${instructions.join(' ')}`;
        }

        return prescriptionLine;
      } else {
        // Fallback for unparsed medications
        const cleanedMed = med.trim();
        if (cleanedMed.includes('-')) {
          return cleanedMed;
        } else {
          // Try to extract basic name and add default instructions
          const nameMatch = cleanedMed.match(/^([A-Za-z\s'-]+)/i);
          if (nameMatch) {
            return `${nameMatch[1].trim()} - Take as prescribed`;
          }
          return `${cleanedMed} - Take as prescribed`;
        }
      }
    })
    .join('\n');
};

// Debug function for testing OCR prescription parsing
export const debugOCRPrescription = () => {
  const testMedications = [
    "Metformin 500mg - Take 1 tablet twice daily with meals",
    "1. Lisinopril 10mg - Take 1 tablet daily in the morning",
    "Atorvastatin 20mg - Take 1 tablet at bedtime",
    "Aspirin 81mg - Take 1 tablet daily with food",
    "Metoprolol 25mg - Take 1 tablet BID",
    "Albuterol 90mcg - Take 2 puffs every 4-6 hours as needed",
    "Vitamin D3",
    "Omeprazole 20mg - Take 1 capsule before breakfast",
    "Amoxicillin 500mg - Take 1 capsule TID for 7 days",
    "Insulin glargine - Inject 10 units subcutaneously at bedtime"
  ];

  console.log('🧪 OCR Prescription Auto-Fill Test Results\n');
  console.log('📋 Individual Medication Parsing:\n');

  testMedications.forEach((med, index) => {
    const parsed = parseMedicationFromText(med);
    console.log(`${index + 1}. Input: "${med}"`);
    console.log(`   Parsed:`, parsed);
    console.log('');
  });

  console.log('💊 Formatted Prescription:\n');
  const formatted = formatMedicationsForPrescription(testMedications);
  console.log(formatted);

  return { testMedications, formatted };
};

export default processMedicalDocument;