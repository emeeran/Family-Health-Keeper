import React, { useRef, useState } from 'react';
import { ImageCompressor, type CompressionResult, type CompressionOptions } from '../../utils/imageCompression';
import { AccessibleButton } from './AccessibleButton';
import { LoadingSpinner } from './LoadingSpinner';

interface ImageUploadProps {
  onImageCompressed: (result: CompressionResult) => void;
  onImagesCompressed?: (results: CompressionResult[]) => void;
  multiple?: boolean;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  compressionOptions?: CompressionOptions;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageCompressed,
  onImagesCompressed,
  multiple = false,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeMB = 10,
  compressionOptions,
  className = '',
  disabled = false,
  placeholder = 'Click to upload or drag and drop',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const fileArray = Array.from(files);

      // Validate files
      for (const file of fileArray) {
        if (!acceptedTypes.includes(file.type)) {
          throw new Error(`File type ${file.type} is not supported`);
        }

        if (file.size > maxSizeBytes) {
          throw new Error(`File ${file.name} is too large. Maximum size is ${maxSizeMB}MB`);
        }
      }

      setProgress(20);

      // Get recommended compression options if none provided
      const options = compressionOptions || ImageCompressor.getRecommendedOptions(fileArray[0]);

      setProgress(40);

      if (multiple) {
        const results = await ImageCompressor.compressMultipleImages(fileArray, options);
        setProgress(100);
        onImagesCompressed?.(results);
      } else {
        const result = await ImageCompressor.compressImage(fileArray[0], options);
        setProgress(100);
        onImageCompressed(result);

        // Show preview
        const url = URL.createObjectURL(result.compressedFile);
        setPreviewUrl(url);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!disabled && !isProcessing) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${previewUrl ? 'border-green-300 dark:border-green-600' : ''}
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {isProcessing ? (
          <div className="space-y-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Compressing image... {progress}%
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : previewUrl ? (
          <div className="space-y-3">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg shadow-md"
            />
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              Image compressed successfully
            </p>
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearPreview();
              }}
            >
              Remove Preview
            </AccessibleButton>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {placeholder}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {multiple ? 'Upload multiple images' : 'Upload an image'}
                ({acceptedTypes.join(', ')}) up to {maxSizeMB}MB
              </p>
            </div>

            <AccessibleButton variant="secondary" size="sm">
              Select File{multiple ? 's' : ''}
            </AccessibleButton>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        <p>Images will be automatically compressed for optimal storage and performance.</p>
        <p>Medical images (X-rays, MRIs, scans) receive higher quality preservation.</p>
      </div>
    </div>
  );
};

ImageUpload.displayName = 'ImageUpload';