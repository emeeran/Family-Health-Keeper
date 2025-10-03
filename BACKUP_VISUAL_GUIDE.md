# 📸 Visual Guide: Backup & Restore Workflow

## 🎯 Complete Workflow Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                   FAMILY HEALTH KEEPER                      │
│                  Backup & Restore Module                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Step 1: CREATE BACKUP                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ Current Data                                  │         │
│  │ • Patients: 5    • Doctors: 3                │         │
│  │ • Estimated Size: 45 KB                      │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  [  Create Backup  ] [  Export Backup  ] [  Import  ]      │
│      (Green)            (Blue-disabled)     (Purple)       │
│                                                             │
│  ↓ Click "Create Backup"                                   │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ ✓ Success!                                    │         │
│  │ Backup created with 5 patients and 3 doctors │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Step 2: EXPORT TO FILE                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [  Create Backup  ] [  Export Backup  ] [  Import  ]      │
│      (Green)            (Blue-enabled!)    (Purple)        │
│                                                             │
│  ↓ Click "Export Backup"                                   │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │  💾 Save File                                 │         │
│  │                                               │         │
│  │  Filename: fhk_backup_2025-10-03.json        │         │
│  │  Location: [Downloads ▼]                     │         │
│  │                                               │         │
│  │           [Cancel]  [Save]                    │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ✓ File saved to: ~/Downloads/fhk_backup_2025-10-03.json  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Step 3: IMPORT BACKUP                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [  Create Backup  ] [  Export Backup  ] [  Import  ]      │
│      (Green)            (Blue)             (Purple)        │
│                                                             │
│  ↓ Click "Import Backup"                                   │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │  📁 Select Backup File                        │         │
│  │                                               │         │
│  │  fhk_backup_2025-10-03.json           45 KB  │  ✓      │
│  │  fhk_backup_2025-09-28.json           42 KB  │         │
│  │  fhk_backup_2025-09-15.json           38 KB  │         │
│  │                                               │         │
│  │           [Cancel]  [Open]                    │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ↓ Validating...                                           │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ ✓ Success!                                    │         │
│  │ Backup imported successfully.                │         │
│  │ Contains 5 patients and 3 doctors.           │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Step 4: RESTORE DATA                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️  New Button Appears:                                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔄 Restore Backup (5 patients, 3 doctors)           │  │
│  │                                        [Click Here]  │  │
│  └──────────────────────────────────────────────────────┘  │
│      (Orange button - full width)                          │
│                                                             │
│  ↓ Click "Restore Backup"                                  │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │  ⚠️  Confirmation Required                    │         │
│  │                                               │         │
│  │  This will replace ALL current data with     │         │
│  │  the backup. Are you sure you want to        │         │
│  │  continue?                                    │         │
│  │                                               │         │
│  │           [Cancel]  [OK]                      │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ↓ Click "OK"                                              │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ 🔄 Restoring...                               │         │
│  │ Please wait...                                │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ↓ Decrypting → Validating → Restoring                    │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ ✓ Success!                                    │         │
│  │ Data restored successfully:                  │         │
│  │ 5 patients, 3 doctors                        │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AUTO-BACKUP SETTINGS (Optional)                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── Backup & Restore ─────────────────────── ⚙️ ───┐    │
│                                                 ↑           │
│                                         Click Settings      │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ Auto-Backup Settings                          │         │
│  ├───────────────────────────────────────────────┤         │
│  │                                               │         │
│  │ ☑ Enable automatic backups                   │         │
│  │                                               │         │
│  │ Backup Interval (hours)                      │         │
│  │ ┌─────────────────────────────────┐          │         │
│  │ │ Daily                        ▼  │          │         │
│  │ └─────────────────────────────────┘          │         │
│  │   Options:                                   │         │
│  │   • Every 6 hours                            │         │
│  │   • Every 12 hours                           │         │
│  │   • Daily          ← Selected                │         │
│  │   • Every 2 days                             │         │
│  │   • Weekly                                   │         │
│  │                                               │         │
│  │ [        Save Settings        ]              │         │
│  │                                               │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ✓ Auto-backup will run every 24 hours automatically      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  BACKUP HISTORY                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Backup History                     [Clear History]        │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ 🕐 Oct 3, 2025, 10:30:45 AM      [Auto]      │         │
│  │    45 KB                                      │         │
│  │    Patients: 5  Doctors: 3  Encryption: AES  │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ 🕐 Oct 2, 2025, 10:30:12 AM      [Auto]      │         │
│  │    44 KB                                      │         │
│  │    Patients: 5  Doctors: 3  Encryption: AES  │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ 🕐 Oct 1, 2025, 3:15:30 PM                   │         │
│  │    43 KB                                      │         │
│  │    Patients: 4  Doctors: 3  Encryption: AES  │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ... (Shows last 10 backups)                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Guide

```
┌─────────────────────────────────────────────┐
│ Button Colors                               │
├─────────────────────────────────────────────┤
│                                             │
│  🟢 Green  → Create Backup                 │
│             (Primary action)               │
│                                             │
│  🔵 Blue   → Export Backup                 │
│             (Secondary action)             │
│                                             │
│  🟣 Purple → Import Backup                 │
│             (File input)                   │
│                                             │
│  🟠 Orange → Restore Backup                │
│             (Warning - destructive)        │
│                                             │
│  🔴 Red    → Clear History                 │
│             (Destructive action)           │
│                                             │
│  ⚙️  Gray   → Settings                      │
│             (Configuration)                │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Status Messages                             │
├─────────────────────────────────────────────┤
│                                             │
│  ✅ Green  → Success messages              │
│  ❌ Red    → Error messages                │
│  ⚠️  Yellow → Warning messages             │
│  ℹ️  Blue   → Info messages                │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔄 State Flow Diagram

```
┌─────────────┐
│   INITIAL   │
│   STATE     │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│  No Backup Created Yet                      │
│  • Create: Enabled                          │
│  • Export: Disabled                         │
│  • Restore: Hidden                          │
└──────┬──────────────────────────────────────┘
       │
       │ Click "Create Backup"
       ↓
┌─────────────────────────────────────────────┐
│  Creating...                                │
│  • Loading spinner                          │
│  • Button disabled                          │
└──────┬──────────────────────────────────────┘
       │
       │ Backup Created
       ↓
┌─────────────────────────────────────────────┐
│  Backup Ready                               │
│  • Create: Enabled (can create new)        │
│  • Export: Enabled ✓                       │
│  • Restore: Hidden                          │
└──────┬──────────────────────────────────────┘
       │
       │ Click "Import Backup"
       ↓
┌─────────────────────────────────────────────┐
│  File Selected                              │
│  • Validating...                            │
└──────┬──────────────────────────────────────┘
       │
       │ Validation Success
       ↓
┌─────────────────────────────────────────────┐
│  Backup Imported                            │
│  • Create: Enabled                          │
│  • Export: Enabled                          │
│  • Restore: Visible ✓                      │
└──────┬──────────────────────────────────────┘
       │
       │ Click "Restore Backup"
       ↓
┌─────────────────────────────────────────────┐
│  Confirm Dialog                             │
│  • "Replace all data?"                      │
│  • Cancel / OK                              │
└──────┬──────────────────────────────────────┘
       │
       │ Click "OK"
       ↓
┌─────────────────────────────────────────────┐
│  Restoring...                               │
│  • Decrypting data                          │
│  • Validating checksum                      │
│  • Updating stores                          │
└──────┬──────────────────────────────────────┘
       │
       │ Restore Complete
       ↓
┌─────────────────────────────────────────────┐
│  Restored!                                  │
│  • Success message                          │
│  • Data updated                             │
│  • UI refreshed                             │
└─────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      BACKUP CREATION                         │
└──────────────────────────────────────────────────────────────┘

  Patients Array    Doctors Array
       │                 │
       └────────┬────────┘
                │
                ↓
        ┌───────────────┐
        │  Combine Data │
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │ JSON.stringify│
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  SHA-256 Hash │  ← Integrity Check
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  Random IV    │  ← 12 bytes
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  AES-GCM      │  ← 256-bit key
        │  Encrypt      │
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  Base64       │
        │  Encode       │
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  Add Metadata │  ← Version, timestamp, etc.
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  Backup File  │  ← Ready to export!
        └───────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      BACKUP RESTORATION                      │
└──────────────────────────────────────────────────────────────┘

        ┌───────────────┐
        │  Import File  │  ← .json file
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  Parse JSON   │
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  Check Version│  ← Validate structure
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  Extract IV   │  ← 12 bytes
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  Base64       │
        │  Decode       │
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  AES-GCM      │  ← 256-bit key
        │  Decrypt      │
        └───────┬───────┘
                │
                ↓
        ┌───────────────┐
        │  Verify Hash  │  ← SHA-256 check
        └───────┬───────┘
                │
                ↓ (Match!)
        ┌───────────────┐
        │  JSON.parse   │
        └───────┬───────┘
                │
                ↓
       ┌────────┴─────────┐
       │                  │
  Patients Array    Doctors Array
       │                  │
       └────────┬─────────┘
                │
                ↓
        ┌───────────────┐
        │  Update Stores│  ← Restore complete!
        └───────────────┘
```

---

## 🔐 Security Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                   ENCRYPTION SECURITY                        │
└──────────────────────────────────────────────────────────────┘

  User's Encryption Key
         │
         ↓
  ┌──────────────┐
  │ Pad to 32    │  "mykey" → "mykey000000000000000000000000000"
  │ characters   │
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │ UTF-8 Encode │  String → Uint8Array
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │ crypto.subtle│  Import as CryptoKey
  │ .importKey   │
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │  CryptoKey   │  ← Used for encrypt/decrypt
  │  (AES-GCM)   │
  └──────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  INTEGRITY VERIFICATION                      │
└──────────────────────────────────────────────────────────────┘

  JSON Data
     │
     ↓
  ┌──────────────┐
  │ SHA-256 Hash │  → Checksum A (stored in backup)
  └──────────────┘

  [Backup stored / transmitted / restored]

  Decrypted Data
     │
     ↓
  ┌──────────────┐
  │ SHA-256 Hash │  → Checksum B (calculated on restore)
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │  Compare     │  A === B ?
  │  Checksums   │
  └──────┬───────┘
         │
         ├─→ Match    ✓ Restore continues
         │
         └─→ Mismatch ✗ Restore aborted (corruption detected)
```

---

## 📱 Responsive Layout

```
┌─────────────────────────────────────────────────────────────┐
│  DESKTOP VIEW (≥768px)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── Backup & Restore ────────────────────── ⚙️ ───┐     │
│  │                                                     │     │
│  │  [Current Data Info Box - Full Width]             │     │
│  │                                                     │     │
│  │  ┌──────────┬──────────┬──────────┐               │     │
│  │  │  Create  │  Export  │  Import  │  ← 3 columns  │     │
│  │  │  Backup  │  Backup  │  Backup  │               │     │
│  │  └──────────┴──────────┴──────────┘               │     │
│  │                                                     │     │
│  │  [Restore Button - Full Width if active]          │     │
│  │                                                     │     │
│  │  [Backup History - Full Width]                     │     │
│  │                                                     │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MOBILE VIEW (<768px)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── Backup & Restore ── ⚙️ ─┐                           │
│  │                            │                           │
│  │  [Info Box - Full Width]  │                           │
│  │                            │                           │
│  │  ┌──────────────────────┐ │  ← Stack vertically      │
│  │  │  Create Backup       │ │                           │
│  │  └──────────────────────┘ │                           │
│  │  ┌──────────────────────┐ │                           │
│  │  │  Export Backup       │ │                           │
│  │  └──────────────────────┘ │                           │
│  │  ┌──────────────────────┐ │                           │
│  │  │  Import Backup       │ │                           │
│  │  └──────────────────────┘ │                           │
│  │                            │                           │
│  │  [Restore - Full Width]   │                           │
│  │                            │                           │
│  │  [History - Full Width]   │                           │
│  │                            │                           │
│  └────────────────────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Icon Reference

```
┌─────────────────────────────────────────┐
│ Icons Used (Lucide React)              │
├─────────────────────────────────────────┤
│                                         │
│  💾 Save       → Create Backup         │
│  📥 Download   → Export Backup         │
│  📤 Upload     → Import Backup         │
│  🔄 RefreshCw  → Restore / Refreshing  │
│  ⚙️  Settings   → Auto-backup settings  │
│  🕐 Clock      → Backup history        │
│  ✅ CheckCircle→ Success messages      │
│  ⚠️  AlertCircle→ Error messages        │
│  🗑️  Trash2     → Clear history         │
│                                         │
└─────────────────────────────────────────┘
```

---

**This visual guide shows exactly how the backup and restore module works!** 🎨

*Family Health Keeper - Visual Workflow Guide*  
*Version 1.0.0 - October 3, 2025*
