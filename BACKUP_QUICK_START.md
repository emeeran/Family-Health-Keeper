# Quick Start: Backup & Restore in 5 Minutes

## 🎯 Goal
Learn how to backup and restore your medical data in Family Health Keeper.

---

## ⚡ Quick Steps

### 1️⃣ Create Your First Backup (30 seconds)

```
1. Open App → Settings → Backup & Restore
2. Click "Create Backup" (green button)
3. Wait for success message
4. Done! ✓
```

**What you'll see:**
- Current data summary (X patients, Y doctors)
- Estimated backup size
- Success message: "Backup created successfully"

---

### 2️⃣ Export Backup to File (20 seconds)

```
1. Click "Export Backup" (blue button)
2. Choose save location
3. File downloads as: fhk_backup_2025-10-03.json
4. Done! ✓
```

**Where to save:**
- Desktop (easy access)
- Documents/FamilyHealthKeeper/Backups
- External USB drive
- Cloud storage (Google Drive, Dropbox)

---

### 3️⃣ Import & Restore (1 minute)

```
1. Click "Import Backup" (purple button)
2. Select your .json backup file
3. Review backup details shown
4. Click "Restore Backup" (orange button)
5. Confirm: "Yes, replace current data"
6. Wait for success message
7. Done! ✓
```

**⚠️ Warning:** Restore replaces ALL current data!

---

## 🔄 Auto-Backup Setup (30 seconds)

```
1. Click ⚙️ Settings icon (top-right)
2. Check "Enable automatic backups"
3. Select interval: "Daily" recommended
4. Click "Save Settings"
5. Done! ✓
```

**Benefit:** Never lose more than 24 hours of data!

---

## 💡 Pro Tips

### Daily Use
✅ Enable auto-backup (daily)  
✅ Export weekly to external drive  
✅ Keep last 3-5 exported backups  

### Before Major Changes
✅ Create manual backup  
✅ Export to file  
✅ Verify backup in history  

### After Backup
✅ Check backup history (bottom of page)  
✅ Note the file size  
✅ Verify patient/doctor counts  

---

## 🆘 Common Questions

**Q: How often should I backup?**  
A: Enable daily auto-backup. Export weekly to external storage.

**Q: Are backups encrypted?**  
A: Yes! AES-GCM 256-bit encryption. Military-grade security.

**Q: Can I restore on another device?**  
A: Yes! Export backup, use same encryption key on new device, import & restore.

**Q: What if I lose my encryption key?**  
A: Backups cannot be restored without the key. Store it safely!

**Q: How much space do backups use?**  
A: Typically 10-500 KB. Very small!

**Q: Can I undo a restore?**  
A: No! Always create a backup before restoring.

---

## 📱 Integration Guide for Developers

### Add to Your App

#### 1. Import the Component

```tsx
import { DataBackupManager } from './components/DataBackupManager';
import { useAppStore } from './stores/useAppStore';
```

#### 2. Initialize Backup Service in App

```tsx
// In your main App component or Settings page
const App = () => {
  const { 
    patients, 
    doctors, 
    setPatients, 
    setDoctors,
    initializeBackupService 
  } = useAppStore();

  useEffect(() => {
    // Initialize with your encryption key
    const encryptionKey = process.env.VITE_ENCRYPTION_KEY || 'default-key';
    initializeBackupService(encryptionKey);
  }, []);

  // ... rest of your app
};
```

#### 3. Add Component to Settings Page

```tsx
// In your Settings or Security Dashboard
const SettingsPage = () => {
  const { patients, doctors, setPatients, setDoctors } = useAppStore();
  const encryptionKey = process.env.VITE_ENCRYPTION_KEY || 'default-key';

  const handleRestoreComplete = (
    restoredPatients: Patient[], 
    restoredDoctors: Doctor[]
  ) => {
    // Update app state with restored data
    setPatients(restoredPatients);
    setDoctors(restoredDoctors);
    
    // Optionally refresh UI or show success message
    alert('Data restored successfully!');
  };

  return (
    <div>
      <h1>Settings</h1>
      
      {/* Other settings sections */}
      
      <DataBackupManager
        patients={patients}
        doctors={doctors}
        encryptionKey={encryptionKey}
        onRestoreComplete={handleRestoreComplete}
      />
    </div>
  );
};
```

#### 4. Alternative: Use Backup Store Directly

```tsx
// For custom UI or programmatic backups
import { useAppStore } from './stores/useAppStore';

const MyCustomBackupButton = () => {
  const { 
    patients, 
    doctors, 
    createBackup, 
    exportBackup,
    isCreatingBackup 
  } = useAppStore();

  const handleBackup = async () => {
    // Create backup
    const backup = await createBackup(patients, doctors, false);
    
    if (backup) {
      // Export to file
      await exportBackup(backup, 'my-custom-backup.json');
      alert('Backup exported!');
    }
  };

  return (
    <button onClick={handleBackup} disabled={isCreatingBackup}>
      {isCreatingBackup ? 'Creating...' : 'Quick Backup'}
    </button>
  );
};
```

---

## 🎨 UI Integration Options

### Option 1: Full Component (Recommended)
Use `<DataBackupManager />` as-is. Includes all features.

### Option 2: Custom Layout
Import `BackupService` directly and build your own UI:

```tsx
import BackupService from './services/backupService';

const MyBackupUI = () => {
  const [service] = useState(() => new BackupService(encryptionKey));
  
  // Use service methods:
  // - service.createBackup()
  // - service.exportBackupToFile()
  // - service.importBackupFromFile()
  // - service.restoreBackup()
  // - service.getBackupHistory()
};
```

### Option 3: Store-Based
Use Zustand store for state management:

```tsx
const { 
  createBackup,        // Create new backup
  exportBackup,        // Export to file
  importBackupFromFile, // Import from file
  restoreBackup,       // Restore data
  backupHistory,       // History array
  autoBackupEnabled,   // Auto-backup setting
  setAutoBackupEnabled // Toggle auto-backup
} = useAppStore();
```

---

## 🔒 Security Checklist

Before deploying backup feature:

- ✅ Set strong encryption key in `.env`
- ✅ Never commit encryption key to git
- ✅ Use environment variables for production
- ✅ Test backup/restore with sample data
- ✅ Verify checksums are validated
- ✅ Confirm auto-backup respects interval
- ✅ Check audit logs are created
- ✅ Test with different browsers
- ✅ Validate error handling

---

## 📦 What's Included

### Files Added
```
services/
  └── backupService.ts         (Encryption, export, import)

stores/slices/
  └── backupStore.ts           (State management)

components/
  └── DataBackupManager.tsx    (Full UI component)

Documentation:
  ├── BACKUP_MODULE.md              (Technical docs)
  ├── BACKUP_USAGE_EXAMPLE.md       (Code examples)
  ├── HOW_TO_BACKUP_AND_RESTORE.md  (User guide)
  └── BACKUP_QUICK_START.md         (This file)
```

### Dependencies
None! Uses native browser APIs:
- `crypto.subtle` (AES-GCM encryption)
- `crypto.getRandomValues` (IV generation)
- `localStorage` (backup history)
- Native file download/upload

---

## 🚀 Next Steps

1. ✅ Read [HOW_TO_BACKUP_AND_RESTORE.md](./HOW_TO_BACKUP_AND_RESTORE.md) for detailed user guide
2. ✅ Check [BACKUP_MODULE.md](./BACKUP_MODULE.md) for technical documentation
3. ✅ Review [BACKUP_USAGE_EXAMPLE.md](./BACKUP_USAGE_EXAMPLE.md) for code examples
4. ✅ Test backup/restore with your data
5. ✅ Enable auto-backup
6. ✅ Export your first backup!

---

**You're ready to protect your medical data! 🎉**

---

*Family Health Keeper - Backup & Restore Quick Start*  
*Version 1.0.0 - October 3, 2025*
