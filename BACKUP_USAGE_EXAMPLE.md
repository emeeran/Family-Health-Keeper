# Backup Module - Usage Examples

Quick start guide for implementing the backup module in Family Health Keeper.

---

## 🚀 Quick Start

### 1. Add to Settings Page

```tsx
// In your Settings or Security component
import { DataBackupManager } from './components/DataBackupManager';
import { useAppStore } from './stores/useAppStore';

function SettingsPage() {
  const patients = useAppStore((state) => state.patients);
  const doctors = useAppStore((state) => state.doctors);
  const setPatients = useAppStore((state) => state.setPatients);
  const setDoctors = useAppStore((state) => state.setDoctors);
  
  const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key';

  const handleRestoreComplete = (
    restoredPatients: Patient[],
    restoredDoctors: Doctor[]
  ) => {
    // Update app state with restored data
    setPatients(restoredPatients);
    setDoctors(restoredDoctors);
    
    // Optional: Show notification
    alert('Data restored successfully!');
    
    // Optional: Refresh the page
    // window.location.reload();
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      {/* Other settings sections */}
      
      <section className="backup-section">
        <DataBackupManager
          patients={patients}
          doctors={doctors}
          encryptionKey={ENCRYPTION_KEY}
          onRestoreComplete={handleRestoreComplete}
        />
      </section>
    </div>
  );
}
```

### 2. Initialize Auto-Backup

```tsx
// In your App.tsx or main component
import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';

function App() {
  const {
    initializeBackupService,
    checkAutoBackup,
    autoBackupEnabled,
    patients,
    doctors,
  } = useAppStore();

  useEffect(() => {
    // Initialize backup service
    const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;
    initializeBackupService(ENCRYPTION_KEY);
  }, []);

  useEffect(() => {
    // Check for auto-backup every hour
    if (autoBackupEnabled) {
      const interval = setInterval(() => {
        checkAutoBackup(patients, doctors);
      }, 60 * 60 * 1000); // Every hour

      return () => clearInterval(interval);
    }
  }, [autoBackupEnabled, patients, doctors]);

  return <YourApp />;
}
```

### 3. Add Backup Button to Toolbar

```tsx
// Quick backup button for toolbar/header
import { Download } from 'lucide-react';
import { useAppStore } from './stores/useAppStore';

function Toolbar() {
  const { createBackup, exportBackup, patients, doctors } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);

  const handleQuickBackup = async () => {
    setIsCreating(true);
    try {
      const backup = await createBackup(patients, doctors, false);
      if (backup) {
        await exportBackup(backup);
        alert('Backup downloaded successfully!');
      }
    } catch (error) {
      alert('Backup failed: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="toolbar">
      <button onClick={handleQuickBackup} disabled={isCreating}>
        <Download className="w-4 h-4 mr-2" />
        {isCreating ? 'Creating...' : 'Quick Backup'}
      </button>
    </div>
  );
}
```

---

## 💡 Common Patterns

### Pattern 1: Backup Before Critical Operations

```tsx
function DeletePatientButton({ patientId }: { patientId: string }) {
  const { createBackup, deletePatient, patients, doctors } = useAppStore();

  const handleDelete = async () => {
    // Create backup before deletion
    const backup = await createBackup(patients, doctors, false);
    
    if (backup) {
      // Proceed with deletion
      deletePatient(patientId);
      alert('Patient deleted. Backup created for safety.');
    }
  };

  return <button onClick={handleDelete}>Delete Patient</button>;
}
```

### Pattern 2: Scheduled Backups with Notifications

```tsx
function AutoBackupManager() {
  const {
    setAutoBackupEnabled,
    setAutoBackupInterval,
    autoBackupEnabled,
    autoBackupInterval,
    lastAutoBackup,
  } = useAppStore();

  const handleToggleAutoBackup = (enabled: boolean) => {
    setAutoBackupEnabled(enabled);
    
    if (enabled) {
      alert(`Auto-backup enabled! Backups will run every ${autoBackupInterval} hours.`);
    }
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={autoBackupEnabled}
          onChange={(e) => handleToggleAutoBackup(e.target.checked)}
        />
        Enable Auto-Backup
      </label>
      
      {autoBackupEnabled && (
        <>
          <select
            value={autoBackupInterval}
            onChange={(e) => setAutoBackupInterval(Number(e.target.value))}
          >
            <option value={6}>Every 6 hours</option>
            <option value={12}>Every 12 hours</option>
            <option value={24}>Daily</option>
            <option value={168}>Weekly</option>
          </select>
          
          {lastAutoBackup && (
            <p>Last backup: {new Date(lastAutoBackup).toLocaleString()}</p>
          )}
        </>
      )}
    </div>
  );
}
```

### Pattern 3: Backup History Viewer

```tsx
function BackupHistoryList() {
  const { backupHistory, getBackupHistory } = useAppStore();

  useEffect(() => {
    getBackupHistory();
  }, []);

  return (
    <div className="backup-history">
      <h3>Recent Backups</h3>
      {backupHistory.length === 0 ? (
        <p>No backups yet</p>
      ) : (
        <ul>
          {backupHistory.map((entry) => (
            <li key={entry.id}>
              <strong>{new Date(entry.timestamp).toLocaleDateString()}</strong>
              <br />
              Patients: {entry.itemCount.patients}, Doctors: {entry.itemCount.doctors}
              <br />
              Size: {BackupService.formatSize(entry.size)}
              {entry.autoBackup && <span className="badge">Auto</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Pattern 4: Import Backup from URL

```tsx
function ImportBackupFromUrl() {
  const { importBackupFromFile, restoreBackup } = useAppStore();

  const handleImportFromUrl = async (url: string) => {
    try {
      // Fetch backup from URL
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'backup.json', { type: 'application/json' });
      
      // Import and validate
      const backup = await importBackupFromFile(file);
      
      // Confirm restore
      if (confirm('Restore this backup?')) {
        const restored = await restoreBackup(backup);
        console.log('Restored:', restored);
      }
    } catch (error) {
      alert('Failed to import backup: ' + error.message);
    }
  };

  return (
    <button onClick={() => handleImportFromUrl('https://example.com/backup.json')}>
      Import from URL
    </button>
  );
}
```

---

## 🎯 Integration with Existing Components

### Add to SecurityDashboard

```tsx
// In SecurityDashboard.tsx
import { DataBackupManager } from './DataBackupManager';

function SecurityDashboard() {
  return (
    <div className="security-dashboard">
      {/* Existing security features */}
      
      <section className="mt-8">
        <DataBackupManager
          patients={patients}
          doctors={doctors}
          encryptionKey={ENCRYPTION_KEY}
          onRestoreComplete={handleRestore}
        />
      </section>
    </div>
  );
}
```

### Add to Settings Modal

```tsx
// In SettingsModal.tsx
import { DataBackupManager } from './DataBackupManager';

function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="general">General</Tab>
        <Tab value="security">Security</Tab>
        <Tab value="backup">Backup & Restore</Tab>
      </Tabs>
      
      {activeTab === 'backup' && (
        <DataBackupManager
          patients={patients}
          doctors={doctors}
          encryptionKey={ENCRYPTION_KEY}
          onRestoreComplete={handleRestore}
        />
      )}
    </Modal>
  );
}
```

---

## 🔧 Advanced Usage

### Custom Backup Service

```tsx
// Create a custom backup service with additional features
import BackupService from './services/backupService';

class CustomBackupService extends BackupService {
  async createBackupWithCompression(patients, doctors) {
    // Custom implementation with compression
    const backup = await this.createBackup(patients, doctors);
    // Add compression logic
    return backup;
  }

  async uploadToCloud(backup) {
    // Upload to cloud storage
    const formData = new FormData();
    formData.append('backup', JSON.stringify(backup));
    
    await fetch('https://api.example.com/backups', {
      method: 'POST',
      body: formData,
    });
  }
}

// Use custom service
const customService = new CustomBackupService(ENCRYPTION_KEY);
```

### Backup with Progress Tracking

```tsx
function BackupWithProgress() {
  const [progress, setProgress] = useState(0);
  const { createBackup, patients, doctors } = useAppStore();

  const handleBackupWithProgress = async () => {
    setProgress(10);
    
    // Simulate progress updates
    const backup = await createBackup(patients, doctors);
    setProgress(50);
    
    // Export
    await exportBackup(backup);
    setProgress(100);
    
    setTimeout(() => setProgress(0), 2000);
  };

  return (
    <div>
      <button onClick={handleBackupWithProgress}>Create Backup</button>
      {progress > 0 && (
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Testing Examples

### Test Backup Creation

```typescript
import { describe, it, expect } from 'vitest';
import BackupService from './services/backupService';

describe('BackupService', () => {
  it('should create a valid backup', async () => {
    const service = new BackupService('test-key');
    const patients = [{ id: '1', name: 'Test Patient' }];
    const doctors = [{ id: '1', name: 'Test Doctor' }];
    
    const backup = await service.createBackup(patients, doctors);
    
    expect(backup.metadata).toBeDefined();
    expect(backup.encryptedData).toBeDefined();
    expect(backup.iv).toBeDefined();
    expect(backup.metadata.itemCount.patients).toBe(1);
    expect(backup.metadata.itemCount.doctors).toBe(1);
  });

  it('should validate backup integrity', async () => {
    const service = new BackupService('test-key');
    const patients = [{ id: '1', name: 'Test Patient' }];
    const doctors = [];
    
    const backup = await service.createBackup(patients, doctors);
    const isValid = await service.validateBackup(backup);
    
    expect(isValid).toBe(true);
  });
});
```

---

## 📱 Mobile-Friendly Features

### Touch-Friendly Backup Button

```tsx
function MobileBackupButton() {
  const { createBackup, patients, doctors } = useAppStore();
  
  return (
    <button
      className="w-full py-4 text-lg rounded-lg bg-blue-600 text-white active:bg-blue-700"
      onClick={() => createBackup(patients, doctors)}
    >
      <Download className="w-6 h-6 inline-block mr-2" />
      Create Backup
    </button>
  );
}
```

---

**Need help?** Check the full documentation in `BACKUP_MODULE.md`
