import { formatMedicationsForPrescription, parseMedicationFromText } from './ocrService.js';

// Test cases for OCR prescription parsing
const testMedications = [
  // Standard prescription format
  "Metformin 500mg - Take 1 tablet twice daily with meals",

  // Numbered prescription format
  "1. Lisinopril 10mg - Take 1 tablet daily in the morning",

  // Simple medication with instructions
  "Atorvastatin 20mg - Take 1 tablet at bedtime",

  // Complex medication with multiple instructions
  "Aspirin 81mg - Take 1 tablet daily with food",

  // Medical abbreviations
  "Metoprolol 25mg - Take 1 tablet BID",

  // Different dosage forms
  "Albuterol 90mcg - Take 2 puffs every 4-6 hours as needed",

  // No clear format (fallback case)
  "Vitamin D3",

  // Prescription with timing
  "Omeprazole 20mg - Take 1 capsule before breakfast",

  // Prescription with frequency abbreviations
  "Amoxicillin 500mg - Take 1 capsule TID for 7 days",

  // Prescription with route
  "Insulin glargine - Inject 10 units subcutaneously at bedtime"
];

console.log('🧪 Testing OCR Prescription Auto-Fill Improvements\n');

// Test individual medication parsing
console.log('📋 Individual Medication Parsing Tests:\n');
testMedications.forEach((med, index) => {
  const parsed = parseMedicationFromText(med);
  console.log(`${index + 1}. Input: "${med}"`);
  console.log(`   Parsed:`, parsed);
  console.log('');
});

// Test complete prescription formatting
console.log('💊 Complete Prescription Formatting Test:\n');
const formattedPrescription = formatMedicationsForPrescription(testMedications);
console.log('Formatted Prescription:');
console.log(formattedPrescription);
console.log('\n');

// Test edge cases
console.log('🔧 Edge Case Tests:\n');
const edgeCases = [
  // Empty array
  [],

  // Null/undefined
  null as any,
  undefined as any,

  // Invalid medication strings
  ["", "   ", "Invalid medication text"],

  // Mixed valid and invalid
  ["Lisinopril 10mg - Take once daily", "", "Metformin 500mg"]
];

edgeCases.forEach((testCase, index) => {
  const result = formatMedicationsForPrescription(testCase);
  console.log(`Edge case ${index + 1}:`, testCase);
  console.log(`Result: "${result || '(empty)'}"`);
  console.log('');
});

export { testMedications, formattedPrescription };