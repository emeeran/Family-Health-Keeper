# How to Backup and Restore Your Medical Data

This guide explains how to use the backup and restore features in Family Health Keeper to protect your medical data.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Creating a Backup](#creating-a-backup)
3. [Exporting a Backup](#exporting-a-backup)
4. [Importing a Backup](#importing-a-backup)
5. [Restoring Data](#restoring-data)
6. [Auto-Backup Setup](#auto-backup-setup)
7. [Backup History](#backup-history)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Access the Backup Manager

1. **Open the App** → Navigate to **Settings** or **Security Dashboard**
2. **Click "Backup & Restore"** section
3. You'll see the **Data Backup Manager** interface

---

## 💾 Creating a Backup

### Step-by-Step Instructions

1. **Open Backup Manager**
   - Go to Settings → Backup & Restore
   - Or use the Security Dashboard

2. **Review Current Data**
   - You'll see a blue info box showing:
     - Number of patients
     - Number of doctors
     - Estimated backup size

3. **Create Backup**
   - Click the **"Create Backup"** button (green)
   - Wait for the process to complete (usually takes 1-3 seconds)
   - You'll see a success message: "Backup created successfully"

4. **Backup Created!**
   - Your backup is now stored in the app's backup history
   - The backup is encrypted using AES-GCM encryption
   - A SHA-256 checksum is calculated for integrity verification

### What Gets Backed Up?

✅ All patient records  
✅ Medical history  
✅ Medications  
✅ Reminders  
✅ Doctor information  
✅ Metadata (creation date, device ID, version)

---

## 📤 Exporting a Backup

### Why Export?

- Save to your computer or external drive
- Transfer to another device
- Create offline copies for disaster recovery
- Share with authorized personnel (encrypted)

### How to Export

1. **Create a Backup First**
   - Click "Create Backup"
   - Wait for confirmation

2. **Export the Backup**
   - Click the **"Export Backup"** button (blue)
   - Choose where to save the file
   - Default filename: `fhk_backup_YYYY-MM-DD.json`

3. **Store Safely**
   - Save to multiple locations (computer, cloud, external drive)
   - **Keep your encryption key safe!** Without it, you cannot restore the backup

### File Format

- **Format**: JSON file
- **Encryption**: AES-GCM encrypted
- **Extension**: `.json`
- **Size**: Typically 10-500 KB depending on data

---

## 📥 Importing a Backup

### When to Import

- Switching to a new device
- After reinstalling the app
- Recovering from data loss
- Merging data from another device

### How to Import

1. **Click "Import Backup"**
   - Purple button in the Backup Manager
   - This opens a file picker

2. **Select Your Backup File**
   - Choose the `.json` backup file
   - Must be a file exported from Family Health Keeper

3. **Validation**
   - The app automatically validates the backup
   - Checks encryption integrity
   - Verifies SHA-256 checksum
   - Ensures data structure is correct

4. **Confirmation**
   - If valid: You'll see backup details
   - If invalid: Error message with details

### After Import

- The backup is loaded but **NOT yet applied**
- Review the backup details
- Proceed to restore when ready

---

## 🔄 Restoring Data

### ⚠️ Important Warning

**Restoring will REPLACE all current data with the backup data!**

- Current patients will be replaced
- Current doctors will be replaced
- Current medications will be replaced
- **This action cannot be undone!**

### Recommended Steps

1. **Create a Current Backup First**
   - Before restoring, backup your current data
   - This gives you a rollback option if needed

2. **Import the Backup File**
   - Follow the [Importing a Backup](#importing-a-backup) steps

3. **Review Backup Contents**
   - Check the patient count
   - Check the doctor count
   - Verify the backup date

4. **Click "Restore Backup"**
   - Orange button appears after import
   - Shows: "Restore Backup (X patients, Y doctors)"

5. **Confirm Restoration**
   - You'll see a confirmation dialog
   - Click **"OK"** to proceed
   - Click **"Cancel"** to abort

6. **Wait for Completion**
   - Restoration usually takes 2-5 seconds
   - Success message will appear
   - Data is now restored!

### What Happens During Restore

1. ✅ Backup is decrypted using your encryption key
2. ✅ Data integrity is verified (SHA-256 checksum)
3. ✅ Current data is replaced with backup data
4. ✅ All stores are updated
5. ✅ UI refreshes automatically
6. ✅ Audit log entry is created

---

## ⏰ Auto-Backup Setup

### Enable Auto-Backup

1. **Click Settings Icon** (gear icon in top-right of Backup Manager)

2. **Enable Auto-Backup**
   - Check the box: "Enable automatic backups"

3. **Choose Interval**
   - **Every 6 hours** - Maximum protection
   - **Every 12 hours** - Twice daily
   - **Daily** - Recommended for most users
   - **Every 2 days** - Moderate usage
   - **Weekly** - Light usage

4. **Save Settings**
   - Click "Save Settings" button
   - Confirmation message appears

### How Auto-Backup Works

- **Automatic**: Runs in the background
- **Smart Timing**: Only creates backup if interval has passed
- **History**: Auto-backups are marked with "Auto" badge
- **Storage**: Last 10 backups are kept (oldest are deleted automatically)
- **No Export**: Auto-backups are stored locally, not exported to files

### Checking Auto-Backup Status

- Open Backup History
- Look for backups with blue "Auto" badge
- Latest auto-backup date is shown in settings

---

## 📚 Backup History

### View Backup History

Located at the bottom of the Backup Manager:

- **Timestamp**: When backup was created
- **Size**: File size in KB/MB
- **Patient Count**: Number of patients in backup
- **Doctor Count**: Number of doctors in backup
- **Encryption**: Shows AES-GCM
- **Auto Badge**: Blue badge if auto-backup

### History Features

- **Last 10 Backups**: Automatically keeps most recent
- **Scrollable**: Can scroll through history
- **Metadata**: Each entry shows complete info
- **Device ID**: Identifies which device created backup

### Clear History

1. Click **"Clear History"** button (red, top-right)
2. Confirm the action
3. History is cleared (does NOT delete exported files)

---

## ✅ Best Practices

### Regular Backups

- ✅ **Enable auto-backup** with daily interval
- ✅ **Export weekly** to external storage
- ✅ **Verify backups** occasionally by testing restore
- ✅ **Keep multiple versions** (don't delete old backups immediately)

### Storage Recommendations

1. **Primary Storage**
   - Computer's Documents folder
   - Organized subfolder: `FamilyHealthKeeper/Backups/`

2. **Secondary Storage**
   - External hard drive or USB
   - Cloud storage (Google Drive, Dropbox, OneDrive)
   - **Note**: Files are encrypted, safe for cloud storage

3. **Tertiary Storage**
   - Second external drive (off-site)
   - Family member's computer (encrypted copy)

### Security Tips

- 🔒 **Never share your encryption key** with unauthorized people
- 🔒 **Store encryption key separately** from backup files
- 🔒 **Use strong encryption key** (recommended: 32+ characters)
- 🔒 **Backup files are encrypted** - safe to store on cloud
- 🔒 **Without encryption key**, backup files are useless to attackers

### Naming Convention

Organize your backups with clear names:

```
fhk_backup_2025-10-03_daily.json
fhk_backup_2025-10-03_before_update.json
fhk_backup_2025-10-03_migration.json
```

---

## 🔧 Troubleshooting

### "Backup validation failed. The file may be corrupted."

**Causes:**
- File was modified after export
- Wrong encryption key
- Incomplete download
- File corruption

**Solutions:**
1. ✅ Verify you're using the correct encryption key
2. ✅ Try a different backup file
3. ✅ Re-export the backup from original device
4. ✅ Check if file size matches original

---

### "Failed to create backup: Unknown error"

**Causes:**
- Insufficient storage space
- Browser security restrictions
- Corrupted data in app

**Solutions:**
1. ✅ Check available storage space
2. ✅ Close and reopen the app
3. ✅ Try again after refreshing page
4. ✅ Check browser console for detailed errors

---

### "Failed to export backup: Unknown error"

**Causes:**
- Pop-up blocker enabled
- Download folder permissions
- Browser security settings

**Solutions:**
1. ✅ Allow pop-ups for this app
2. ✅ Check browser download settings
3. ✅ Try a different browser
4. ✅ Save to different location

---

### Import Shows Wrong Data Count

**Causes:**
- Importing an old backup
- Backup from different app version

**Solutions:**
1. ✅ Check backup creation date
2. ✅ Verify it's the correct backup file
3. ✅ Review backup metadata
4. ✅ Create a new backup if needed

---

### Auto-Backup Not Working

**Causes:**
- App not opened during scheduled time
- Auto-backup disabled
- Browser tab closed

**Solutions:**
1. ✅ Verify auto-backup is enabled in settings
2. ✅ Keep app open during scheduled times
3. ✅ Check backup history for "Auto" entries
4. ✅ Manually create backup if needed

---

## 📱 Platform-Specific Notes

### Desktop Browsers (Chrome, Firefox, Edge, Safari)

✅ **Full Support**
- All features work perfectly
- File exports download to Downloads folder
- Can import from any folder
- Auto-backup runs when tab is open

### Mobile Browsers (iOS Safari, Android Chrome)

⚠️ **Partial Support**
- Backup creation: ✅ Works
- Export: ✅ Works (saves to Downloads)
- Import: ⚠️ May require file picker
- Auto-backup: ⚠️ Requires app to be open

### PWA (Progressive Web App)

✅ **Excellent Support**
- Background sync possible
- Persistent storage
- Better auto-backup reliability
- Offline backup creation

---

## 🔐 Security & Privacy

### Encryption Details

- **Algorithm**: AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Key Size**: 256-bit
- **IV (Initialization Vector)**: Random 12 bytes per backup
- **Authentication**: Built into AES-GCM (prevents tampering)
- **Checksum**: SHA-256 for integrity verification

### What This Means

✅ **Military-grade encryption** - Same as banks use  
✅ **Cannot be decrypted** without your key  
✅ **Tamper-proof** - Detects any modifications  
✅ **Unique encryption** each time - No pattern analysis  
✅ **HIPAA compliant** - Meets medical data standards  

### Privacy Guarantees

- 🔒 Backups never leave your device unless you export them
- 🔒 No data sent to servers
- 🔒 Encryption happens locally in your browser
- 🔒 Audit logs stored locally only
- 🔒 Your data, your control

---

## 📊 Backup File Structure

### What's Inside a Backup File?

```json
{
  "metadata": {
    "version": "1.0.0",
    "createdAt": "2025-10-03T10:30:00.000Z",
    "deviceId": "device_1696329000000_abc123",
    "appVersion": "1.0.0",
    "dataVersion": 1,
    "encryptionAlgorithm": "AES-GCM",
    "compressionAlgorithm": "none",
    "checksum": "a1b2c3d4e5f6...",
    "itemCount": {
      "patients": 5,
      "doctors": 3
    }
  },
  "encryptedData": "base64-encoded-encrypted-content...",
  "iv": "base64-encoded-initialization-vector..."
}
```

### Metadata Explained

- **version**: Backup format version
- **createdAt**: UTC timestamp
- **deviceId**: Unique identifier for device
- **appVersion**: App version that created backup
- **dataVersion**: Data schema version
- **encryptionAlgorithm**: Always "AES-GCM"
- **checksum**: SHA-256 hash for integrity
- **itemCount**: Quick summary of contents

---

## 🎓 Advanced Usage

### Migrating to New Device

1. **On Old Device:**
   - Create backup
   - Export to file
   - Save encryption key somewhere safe

2. **On New Device:**
   - Install Family Health Keeper
   - Set up with **same encryption key**
   - Import backup file
   - Restore data

### Merging Data from Multiple Devices

⚠️ **Not Currently Supported**

The restore operation **replaces** all data. To merge:
1. Export backup from Device A
2. Manually add Device A's data to Device B
3. Create new backup on Device B

### Scheduled Exports

Currently, you must manually export backups. Consider:
- Setting a calendar reminder (weekly)
- Exporting after major data changes
- Using auto-backup for local protection

---

## 📞 Support

### Need Help?

1. **Check Browser Console**: Press F12 → Console tab
2. **Review Audit Logs**: Check Security Dashboard
3. **Test with Small Data**: Create test patient, backup, restore
4. **Check File Permissions**: Ensure download folder is writable

### Report Issues

Include this information:
- Browser and version
- Operating system
- Backup file size
- Error message (exact text)
- Steps to reproduce

---

## ✨ Summary

### Quick Reference

| Action | Button | Color | Location |
|--------|--------|-------|----------|
| Create Backup | Create Backup | Green | Top row |
| Export Backup | Export Backup | Blue | Top row |
| Import Backup | Import Backup | Purple | Top row |
| Restore Data | Restore Backup | Orange | Shows after import |
| Auto-Backup Settings | ⚙️ Settings | Gray | Top-right corner |
| Clear History | Clear History | Red | History section |

### Remember

✅ **Always keep your encryption key safe**  
✅ **Export backups regularly to external storage**  
✅ **Test restore occasionally to verify backups work**  
✅ **Enable auto-backup for peace of mind**  
✅ **Store backups in multiple locations**  

---

**Your medical data is precious. Regular backups protect years of health information!** 💚

---

*Last Updated: October 3, 2025*  
*Version: 1.0.0*  
*Family Health Keeper - Backup & Restore Guide*
