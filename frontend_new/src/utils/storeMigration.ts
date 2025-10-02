/**
 * Store Migration Utility
 *
 * This utility helps migrate data from the old monolithic store
 * to the new modular store architecture.
 */

export interface LegacyStoreData {
  patients: any[];
  doctors: any[];
  theme: 'light' | 'dark';
  state: any;
  version: string;
}

export class StoreMigration {
  /**
   * Migrate data from the old store format to the new format
   */
  static migrateFromLegacy(legacyData: any): LegacyStoreData {
    // The old store used the name 'health-storage'
    if (legacyData?.patients && legacyData?.doctors && legacyData?.theme) {
      return {
        patients: legacyData.patients || [],
        doctors: legacyData.doctors || [],
        theme: legacyData.theme || 'light',
        state: legacyData.state || {},
        version: '1.0.0'
      };
    }

    // Handle different legacy formats if needed
    return {
      patients: [],
      doctors: [],
      theme: 'light',
      state: {},
      version: '1.0.0'
    };
  }

  /**
   * Check if legacy data exists in localStorage
   */
  static hasLegacyData(): boolean {
    const legacyKey = 'health-storage';
    return localStorage.getItem(legacyKey) !== null;
  }

  /**
   * Get legacy data from localStorage
   */
  static getLegacyData(): LegacyStoreData | null {
    try {
      const legacyKey = 'health-storage';
      const legacyData = localStorage.getItem(legacyKey);

      if (!legacyData) return null;

      const parsed = JSON.parse(legacyData);
      return this.migrateFromLegacy(parsed);
    } catch (error) {
      console.error('Failed to migrate legacy data:', error);
      return null;
    }
  }

  /**
   * Clean up legacy data after successful migration
   */
  static cleanupLegacyData(): void {
    const legacyKey = 'health-storage';
    localStorage.removeItem(legacyKey);
  }

  /**
   * Perform the migration
   */
  static performMigration(): boolean {
    try {
      const legacyData = this.getLegacyData();

      if (!legacyData) {
        return false; // No legacy data to migrate
      }

      // Save data to the new store format
      const newStoreData = {
        patients: legacyData.patients,
        doctors: legacyData.doctors,
        theme: legacyData.theme
      };

      const newKey = 'family-health-keeper-app';
      localStorage.setItem(newKey, JSON.stringify(newStoreData));

      // Clean up old data
      this.cleanupLegacyData();

      console.log('Store migration completed successfully');
      return true;
    } catch (error) {
      console.error('Store migration failed:', error);
      return false;
    }
  }
}