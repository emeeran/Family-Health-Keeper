import { useCallback, useRef } from 'react';

interface UseFileUploadOptions {
  maxFileSizeMB?: number;
  allowedTypes?: string[];
  onFileUpload: (file: File, dataUrl: string) => void;
  onError?: (error: string) => void;
}

export const useFileUpload = (options: UseFileUploadOptions) => {
  const {
    maxFileSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    onFileUpload,
    onError
  } = options;

  const objectUrls = useRef<Set<string>>(new Set());

  // Clean up object URLs to prevent memory leaks
  const cleanupObjectUrls = useCallback(() => {
    objectUrls.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    objectUrls.current.clear();
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`;
    }

    // Check file size
    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size: ${maxFileSizeMB}MB`;
    }

    return null;
  }, [maxFileSizeMB, allowedTypes]);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    cleanupObjectUrls();

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        onError?.(error);
        return;
      }

      // Use FileReader for small files, createObjectURL for large files
      if (file.size < 5 * 1024 * 1024) { // 5MB threshold
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          onFileUpload(file, dataUrl);
        };
        reader.onerror = () => {
          onError?.(`Failed to read file: ${file.name}`);
        };
        reader.readAsDataURL(file);
      } else {
        // For larger files, use object URL and clean up later
        const objectUrl = URL.createObjectURL(file);
        objectUrls.current.add(objectUrl);

        // Convert to data URL asynchronously
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          onFileUpload(file, dataUrl);
          // Clean up object URL after conversion
          URL.revokeObjectURL(objectUrl);
          objectUrls.current.delete(objectUrl);
        };
        reader.onerror = () => {
          onError?.(`Failed to read file: ${file.name}`);
          URL.revokeObjectURL(objectUrl);
          objectUrls.current.delete(objectUrl);
        };
        reader.readAsDataURL(file);
      }
    });
  }, [validateFile, onFileUpload, onError, cleanupObjectUrls]);

  // Clean up on component unmount
  React.useEffect(() => {
    return () => {
      cleanupObjectUrls();
    };
  }, [cleanupObjectUrls]);

  return {
    handleFileUpload,
    cleanupObjectUrls
  };
};