import { Medication, MedicalRecord } from '../types';
import { MedicalRecordParser } from './medicalRecordParser';

export interface MedicationChange {
  medication: Medication;
  changeType: 'added' | 'modified' | 'discontinued' | 'continued';
  previousMedication?: Medication;
  reason?: string;
  source: 'prescription' | 'record' | 'manual';
}

export interface ReconciliationResult {
  changes: MedicationChange[];
  currentMedications: Medication[];
  discontinuedMedications: Medication[];
  requiresAttention: MedicationChange[];
  summary: {
    totalChanges: number;
    added: number;
    modified: number;
    discontinued: number;
    continued: number;
  };
}

export class MedicationReconciliationService {
  /**
   * Reconcile current medications with new prescriptions from medical records
   */
  static reconcileMedications(
    currentMeds: Medication[],
    newRecords: MedicalRecord[]
  ): ReconciliationResult {
    const changes: MedicationChange[] = [];
    const allNewPrescriptions: Medication[] = [];

    // Extract all medications from new records
    for (const record of newRecords) {
      if (record.prescription) {
        const parsedData = MedicalRecordParser.parseMedicalRecord(`
          C/C: ${record.complaint}
          Ix: ${record.investigations}
          D/Dx: ${record.diagnosis}
          R/X: ${record.prescription}
          Notes: ${record.notes}
        `);
        allNewPrescriptions.push(...parsedData.prescriptions);
      }
    }

    // Create maps for easier comparison
    const currentMedsMap = new Map(currentMeds.map(med => [this.normalizeMedicationName(med.name), med]));
    const newMedsMap = new Map(allNewPrescriptions.map(med => [this.normalizeMedicationName(med.name), med]));

    // Find added medications
    for (const [normalizedName, newMed] of newMedsMap) {
      if (!currentMedsMap.has(normalizedName)) {
        changes.push({
          medication: newMed,
          changeType: 'added',
          reason: 'New prescription from recent visit',
          source: 'prescription'
        });
      }
    }

    // Find continued and modified medications
    for (const [normalizedName, currentMed] of currentMedsMap) {
      const newMed = newMedsMap.get(normalizedName);

      if (newMed) {
        // Check if medication was modified
        if (this.isMedicationModified(currentMed, newMed)) {
          changes.push({
            medication: newMed,
            changeType: 'modified',
            previousMedication: currentMed,
            reason: 'Dosage or frequency adjusted',
            source: 'prescription'
          });
        } else {
          // Medication continued
          changes.push({
            medication: currentMed,
            changeType: 'continued',
            reason: 'Medication continued as prescribed',
            source: 'prescription'
          });
        }
      } else {
        // Check if medication should be discontinued
        // (This is a simplified logic - in reality, you'd consider more factors)
        const shouldDiscontinue = this.shouldDiscontinueMedication(currentMed, newRecords);

        if (shouldDiscontinue) {
          changes.push({
            medication: currentMed,
            changeType: 'discontinued',
            reason: 'No longer prescribed in recent visits',
            source: 'record'
          });
        } else {
          // Medication continued
          changes.push({
            medication: currentMed,
            changeType: 'continued',
            reason: 'Maintenance medication',
            source: 'manual'
          });
        }
      }
    }

    // Generate current medications list
    const currentMedications: Medication[] = [];
    const discontinuedMedications: Medication[] = [];

    for (const change of changes) {
      switch (change.changeType) {
        case 'added':
        case 'modified':
        case 'continued':
          currentMedications.push(change.medication);
          break;
        case 'discontinued':
          discontinuedMedications.push(change.medication);
          break;
      }
    }

    // Identify changes that require attention
    const requiresAttention = changes.filter(change =>
      change.changeType === 'added' ||
      change.changeType === 'discontinued' ||
      (change.changeType === 'modified' && this.isSignificantChange(change.previousMedication!, change.medication))
    );

    // Calculate summary
    const summary = {
      totalChanges: changes.length,
      added: changes.filter(c => c.changeType === 'added').length,
      modified: changes.filter(c => c.changeType === 'modified').length,
      discontinued: changes.filter(c => c.changeType === 'discontinued').length,
      continued: changes.filter(c => c.changeType === 'continued').length
    };

    return {
      changes,
      currentMedications,
      discontinuedMedications,
      requiresAttention,
      summary
    };
  }

  /**
   * Normalize medication name for comparison (removes spacing, capitalization differences)
   */
  private static normalizeMedicationName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  }

  /**
   * Check if a medication has been modified
   */
  private static isMedicationModified(current: Medication, newMed: Medication): boolean {
    return (
      current.strength !== newMed.strength ||
      current.dosage !== newMed.dosage ||
      current.frequency !== newMed.frequency
    );
  }

  /**
   * Check if a medication change is significant and requires attention
   */
  private static isSignificantChange(oldMed: Medication, newMed: Medication): boolean {
    // Significant changes include dosage adjustments, strength changes, or frequency changes
    return (
      oldMed.strength !== newMed.strength ||
      oldMed.dosage !== newMed.dosage ||
      oldMed.frequency !== newMed.frequency
    );
  }

  /**
   * Determine if a medication should be discontinued
   */
  private static shouldDiscontinueMedication(medication: Medication, records: MedicalRecord[]): boolean {
    // Simple logic: if medication hasn't been mentioned in recent records (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentRecords = records.filter(record =>
      new Date(record.date) >= ninetyDaysAgo
    );

    const medicationMentioned = recentRecords.some(record => {
      const parsedData = MedicalRecordParser.parseMedicalRecord(`
        C/C: ${record.complaint}
        Ix: ${record.investigations}
        D/Dx: ${record.diagnosis}
        R/X: ${record.prescription}
        Notes: ${record.notes}
      `);

      return parsedData.prescriptions.some(prescribed =>
        this.normalizeMedicationName(prescribed.name) === this.normalizeMedicationName(medication.name)
      );
    });

    return !medicationMentioned;
  }

  /**
   * Generate medication reconciliation summary for display
   */
  static generateReconciliationSummary(result: ReconciliationResult): string {
    const { summary } = result;

    let summaryText = `Medication reconciliation completed: `;

    if (summary.added > 0) {
      summaryText += `${summary.added} new medication${summary.added > 1 ? 's' : ''} added`;
    }

    if (summary.modified > 0) {
      summaryText += `${summary.added > 0 ? ', ' : ''}${summary.modified} medication${summary.modified > 1 ? 's' : ''} modified`;
    }

    if (summary.discontinued > 0) {
      summaryText += `${summary.added > 0 || summary.modified > 0 ? ', ' : ''}${summary.discontinued} medication${summary.discontinued > 1 ? 's' : ''} discontinued`;
    }

    if (summary.continued > 0) {
      summaryText += `${summary.added > 0 || summary.modified > 0 || summary.discontinued > 0 ? ', ' : ''}${summary.continued} medication${summary.continued > 1 ? 's' : ''} continued`;
    }

    if (result.requiresAttention.length > 0) {
      summaryText += `. ${result.requiresAttention.length} change${result.requiresAttention.length > 1 ? 's' : ''} require attention.`;
    }

    return summaryText + '.';
  }

  /**
   * Get medication interactions and warnings
   */
  static checkMedicationInteractions(medications: Medication[]): {
    interactions: string[];
    warnings: string[];
    contraindications: string[];
  } {
    // This is a simplified implementation
    // In a real system, you would integrate with a drug database API
    const interactions: string[] = [];
    const warnings: string[] = [];
    const contraindications: string[] = [];

    // Check for common interactions
    const medicationNames = medications.map(m => m.name.toLowerCase());

    // Example: Check for blood thinners and NSAIDs
    if (medicationNames.some(name => name.includes('warfarin') || name.includes('coumadin')) &&
        medicationNames.some(name => name.includes('ibuprofen') || name.includes('naproxen'))) {
      interactions.push('Increased bleeding risk with anticoagulant and NSAID combination');
    }

    // Example: Check for ACE inhibitors and potassium-sparing diuretics
    if (medicationNames.some(name => name.includes('lisinopril') || name.includes('enalapril')) &&
        medicationNames.some(name => name.includes('spironolactone'))) {
      interactions.push('Increased risk of hyperkalemia with ACE inhibitor and potassium-sparing diuretic');
    }

    // Check for duplicate medications from same class
    const medicationClasses = this.categorizeMedications(medications);
    for (const [className, meds] of Object.entries(medicationClasses)) {
      if (meds.length > 1) {
        warnings.push(`Multiple medications from ${className} class: ${meds.map(m => m.name).join(', ')}`);
      }
    }

    return { interactions, warnings, contraindications };
  }

  /**
   * Categorize medications by therapeutic class
   */
  private static categorizeMedications(medications: Medication[]): Record<string, Medication[]> {
    const categories: Record<string, Medication[]> = {};

    for (const med of medications) {
      const name = med.name.toLowerCase();
      let category = 'Other';

      if (name.includes('metformin') || name.includes('insulin') || name.includes('glipizide')) {
        category = 'Antidiabetic';
      } else if (name.includes('lisinopril') || name.includes('enalapril') || name.includes('losartan')) {
        category = 'Antihypertensive';
      } else if (name.includes('atorvastatin') || name.includes('simvastatin')) {
        category = 'Statin';
      } else if (name.includes('sertraline') || name.includes('fluoxetine')) {
        category = 'Antidepressant';
      } else if (name.includes('warfarin') || name.includes('clopidogrel')) {
        category = 'Anticoagulant';
      }

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(med);
    }

    return categories;
  }
}