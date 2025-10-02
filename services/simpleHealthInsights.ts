import type { Patient, Document } from '../types';

interface HealthInsightData {
  summary: string;
  riskFactors: string[];
  recommendations: string[];
  medicationInsights: string;
  preventiveCare: string[];
  lifestyleSuggestions: string[];
  followUpCare: string;
  disclaimer: string;
}

export const generateSimpleHealthInsights = async (
  patient: Patient,
  documents: Document[] = []
): Promise<HealthInsightData> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('Generating simple health insights for:', patient.name);

  // Extract key health information
  const age = calculateAge(patient.dateOfBirth);
  const conditions = patient.conditions || [];
  const allergies = patient.allergies || [];
  const medications = patient.currentMedications || [];
  const records = patient.records || [];
  const surgeries = patient.surgeries || [];
  const familyHistory = patient.familyMedicalHistory || '';

  // Generate insights based on available data
  const insights: HealthInsightData = {
    summary: generateHealthSummary(patient, age, conditions, medications, records),
    riskFactors: generateRiskFactors(age, conditions, familyHistory, medications),
    recommendations: generateRecommendations(conditions, medications, age),
    medicationInsights: generateMedicationInsights(medications, conditions),
    preventiveCare: generatePreventiveCare(age, conditions, familyHistory),
    lifestyleSuggestions: generateLifestyleSuggestions(conditions, age),
    followUpCare: generateFollowUpCare(records, conditions, medications),
    disclaimer: "These AI-generated insights are for informational purposes only and do not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical decisions."
  };

  return insights;
};

const calculateAge = (dateOfBirth: string): number => {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const generateHealthSummary = (
  patient: Patient,
  age: number,
  conditions: string[],
  medications: string[],
  records: any[]
): string => {
  const parts = [];

  parts.push(`Health analysis for ${patient.name}, age ${age}`);

  if (conditions.length > 0) {
    parts.push(`with ${conditions.length} documented condition${conditions.length > 1 ? 's' : ''}: ${conditions.join(', ')}`);
  } else {
    parts.push('with no documented chronic conditions');
  }

  if (medications.length > 0) {
    parts.push(`currently taking ${medications.length} medication${medications.length > 1 ? 's' : ''}`);
  }

  if (records.length > 0) {
    const lastVisit = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    parts.push(`last medical visit on ${new Date(lastVisit.date).toLocaleDateString()}`);
  }

  return parts.join('. ') + '.';
};

const generateRiskFactors = (
  age: number,
  conditions: string[],
  familyHistory: string,
  medications: string[]
): string[] => {
  const riskFactors: string[] = [];

  // Age-related risks
  if (age > 65) {
    riskFactors.push('Age over 65 - increased risk for cardiovascular disease and other age-related conditions');
  } else if (age > 45) {
    riskFactors.push('Age 45-65 - regular health screenings recommended');
  }

  // Condition-related risks
  if (conditions.includes('Diabetes') || conditions.includes('Type 2 Diabetes')) {
    riskFactors.push('Diabetes - requires regular monitoring of blood sugar and cardiovascular health');
  }

  if (conditions.includes('Hypertension') || conditions.includes('High Blood Pressure')) {
    riskFactors.push('Hypertension - regular blood pressure monitoring and cardiovascular risk management');
  }

  // Family history risks
  if (familyHistory.toLowerCase().includes('heart') || familyHistory.toLowerCase().includes('cardiac')) {
    riskFactors.push('Family history of heart disease - increased cardiovascular risk');
  }

  if (familyHistory.toLowerCase().includes('diabetes')) {
    riskFactors.push('Family history of diabetes - increased risk for developing diabetes');
  }

  // Medication-related considerations
  if (medications.length > 3) {
    riskFactors.push('Multiple medications - requires regular review for potential interactions');
  }

  // Add general risks if no specific ones identified
  if (riskFactors.length === 0) {
    riskFactors.push('Maintain regular health screenings based on age and gender');
  }

  return riskFactors;
};

const generateRecommendations = (
  conditions: string[],
  medications: string[],
  age: number
): string[] => {
  const recommendations: string[] = [];

  // General recommendations
  recommendations.push('Schedule regular check-ups with your primary care provider');
  recommendations.push('Maintain an up-to-date list of all medications and supplements');

  // Age-specific recommendations
  if (age > 50) {
    recommendations.push('Consider regular cancer screenings as appropriate for your age group');
  }

  // Condition-specific recommendations
  if (conditions.includes('Diabetes') || conditions.includes('Type 2 Diabetes')) {
    recommendations.push('Regular HbA1c testing and blood sugar monitoring');
    recommendations.push('Annual eye exams and foot examinations');
  }

  if (conditions.includes('Hypertension')) {
    recommendations.push('Regular blood pressure monitoring and cardiovascular risk assessment');
  }

  // Medication-specific recommendations
  if (medications.length > 0) {
    recommendations.push('Review all medications with your doctor or pharmacist regularly');
    recommendations.push('Report any side effects or concerns about your medications');
  }

  return recommendations;
};

const generateMedicationInsights = (
  medications: any[],
  conditions: string[]
): string => {
  if (medications.length === 0) {
    return 'No current medications are documented. Continue to follow any treatments as prescribed by your healthcare provider.';
  }

  const insights = [];
  insights.push(`Currently taking ${medications.length} medication${medications.length > 1 ? 's' : ''}:`);

  medications.forEach(med => {
    insights.push(`• ${med.name} (${med.dosage}) - ${med.frequency}`);
  });

  insights.push('\nImportant medication considerations:');
  insights.push('• Take all medications exactly as prescribed');
  insights.push('• Keep an updated medication list with you at all times');
  insights.push('• Inform all healthcare providers about all medications you take');
  insights.push('• Report any side effects or concerns to your healthcare provider');

  if (medications.length > 1) {
    insights.push('• Be aware of potential drug interactions - consult your pharmacist');
  }

  return insights.join('\n');
};

const generatePreventiveCare = (
  age: number,
  conditions: string[],
  familyHistory: string
): string[] => {
  const care: string[] = [];

  // General preventive care
  care.push('Annual physical examination with your primary care provider');
  care.push('Regular dental check-ups and cleanings');
  care.push('Vision and hearing screenings as needed');

  // Age-specific care
  if (age > 40) {
    care.push('Regular cardiovascular risk assessment');
  }

  if (age > 50) {
    care.push('Cancer screenings appropriate for age and risk factors');
    care.push('Bone density screening if risk factors present');
  }

  // Condition-specific care
  if (conditions.includes('Diabetes')) {
    care.push('Regular kidney function tests');
    care.push('Annual comprehensive eye examinations');
    care.push('Regular foot examinations');
  }

  if (conditions.includes('Hypertension')) {
    care.push('Regular cardiovascular risk monitoring');
    care.push('Kidney function tests');
  }

  // Family history-based care
  if (familyHistory.toLowerCase().includes('cancer')) {
    care.push('Cancer screenings based on family history and risk factors');
  }

  return care;
};

const generateLifestyleSuggestions = (
  conditions: string[],
  age: number
): string[] => {
  const suggestions: string[] = [];

  // General lifestyle suggestions
  suggestions.push('Maintain a balanced diet rich in fruits, vegetables, and whole grains');
  suggestions.push('Engage in regular physical activity (150 minutes of moderate exercise per week)');
  suggestions.push('Ensure adequate sleep (7-9 hours per night for adults)');
  suggestions.push('Practice stress management techniques');
  suggestions.push('Stay well hydrated throughout the day');

  // Condition-specific suggestions
  if (conditions.includes('Diabetes') || conditions.includes('Type 2 Diabetes')) {
    suggestions.push('Follow a diabetes-friendly diet as recommended by your healthcare provider');
    suggestions.push('Monitor carbohydrate intake and maintain consistent meal times');
    suggestions.push('Regular physical activity to help manage blood sugar levels');
  }

  if (conditions.includes('Hypertension')) {
    suggestions.push('Follow a low-sodium diet');
    suggestions.push('Limit alcohol consumption');
    suggestions.push('Regular moderate exercise to help manage blood pressure');
  }

  // Age-specific suggestions
  if (age > 65) {
    suggestions.push('Include strength training exercises to maintain muscle mass');
    suggestions.push('Balance exercises to prevent falls');
  }

  return suggestions;
};

const generateFollowUpCare = (
  records: any[],
  conditions: string[],
  medications: any[]
): string => {
  const parts = [];

  // General follow-up recommendations
  parts.push('Based on your health profile, the following follow-up care is recommended:');

  // Recent visit follow-up
  if (records.length > 0) {
    const lastVisit = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const daysSinceLastVisit = Math.floor((Date.now() - new Date(lastVisit.date).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastVisit > 365) {
      parts.push('Schedule an annual check-up with your primary care provider');
    } else if (daysSinceLastVisit > 180) {
      parts.push('Consider scheduling a follow-up visit within the next few months');
    }
  }

  // Condition-specific follow-up
  if (conditions.includes('Diabetes') || conditions.includes('Type 2 Diabetes')) {
    parts.push('Regular follow-up with your healthcare provider for diabetes management (every 3-6 months)');
  }

  if (conditions.includes('Hypertension')) {
    parts.push('Regular blood pressure monitoring and follow-up appointments as needed');
  }

  // Medication follow-up
  if (medications.length > 0) {
    parts.push('Regular medication reviews with your healthcare provider or pharmacist');
  }

  parts.push('Always discuss any new symptoms or concerns with your healthcare provider promptly');

  return parts.join('\n• ');
};

export default generateSimpleHealthInsights;