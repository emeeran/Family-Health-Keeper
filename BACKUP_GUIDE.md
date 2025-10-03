# Backup & Restore Guide

## Quick Start

### Creating a Backup
1. Click the **blue backup icon** in the header (next to logout)
2. Your encrypted backup file will download automatically as `family-health-backup-[timestamp].json`
3. Store this file securely - it contains all your medical data

### Restoring from Backup
1. Click the **green restore icon** in the header
2. Select your backup file
3. Confirm the restoration
4. Page will refresh with restored data

## Features

- **AES-256-GCM Encryption** - Military-grade encryption for all backups
- **Automatic Validation** - SHA-256 checksums ensure data integrity
- **HIPAA Compliant** - Audit logging for all backup operations
- **One-Click Operations** - Simple UI for backup/restore
- **Auto-Backup** - Optional scheduled backups (configurable in settings)

## Advanced Usage

### Backup Manager Component
For more control, use the full Backup Manager:
1. Navigate to Settings → Data Backup Manager
2. View backup history, configure auto-backup, and manage encryption keys

### Manual Backup via Code
```typescript
import { BackupService } from './services/backupService';

const backupService = new BackupService();
await backupService.createBackup('my-encryption-password');
```

## Security

- Backups are encrypted with AES-256-GCM
- Password/key required for encryption and decryption
- Store your encryption key securely - lost keys mean lost data
- Checksums validate backup integrity before restore

## Troubleshooting

**Restore fails with "Invalid backup file"**
- Ensure you're using a valid backup file from this app
- Check that you're using the correct encryption key

**Backup file too large**
- Backups include all patient records, medications, appointments, and documents
- Consider archiving old data or splitting backups by patient

## Technical Details

- **Format**: Encrypted JSON with metadata
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Validation**: SHA-256 checksum
- **Storage**: Browser localStorage for history (IndexedDB for data)
- **Audit**: All operations logged with timestamps

For implementation details, see the source code at `services/backupService.ts`.
