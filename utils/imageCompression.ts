/**
 * Image compression utilities for optimizing medical document storage
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  preserveAspectRatio?: boolean;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
  format: string;
  quality: number;
}

export class ImageCompressor {
  private static readonly DEFAULT_OPTIONS: Required<CompressionOptions> = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'jpeg',
    preserveAspectRatio: true,
  };

  /**
   * Compress an image file with specified options
   */
  static async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Calculate new dimensions
          let { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            finalOptions.maxWidth,
            finalOptions.maxHeight,
            finalOptions.preserveAspectRatio
          );

          canvas.width = width;
          canvas.height = height;

          // Draw image with compression
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedFile = new File(
                [blob],
                this.generateCompressedFileName(file.name, finalOptions.format),
                { type: this.getMimeType(finalOptions.format) }
              );

              resolve({
                compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: Math.round((1 - blob.size / file.size) * 100),
                dimensions: { width, height },
                format: finalOptions.format,
                quality: finalOptions.quality,
              });
            },
            this.getMimeType(finalOptions.format),
            finalOptions.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Compress multiple images in parallel
   */
  static async compressMultipleImages(
    files: File[],
    options: CompressionOptions = {}
  ): Promise<CompressionResult[]> {
    const compressionPromises = files.map(file => this.compressImage(file, options));
    return Promise.all(compressionPromises);
  }

  /**
   * Get image dimensions without loading the full image
   */
  static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Check if file is an image
   */
  static isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Get recommended compression options based on image type
   */
  static getRecommendedOptions(file: File): CompressionOptions {
    const isMedicalImage = file.name.toLowerCase().includes('x-ray') ||
                          file.name.toLowerCase().includes('mri') ||
                          file.name.toLowerCase().includes('scan');

    if (isMedicalImage) {
      return {
        maxWidth: 2560,
        maxHeight: 1440,
        quality: 0.9,
        format: 'png',
        preserveAspectRatio: true,
      };
    }

    // Default for photos and documents
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      format: 'jpeg',
      preserveAspectRatio: true,
    };
  }

  /**
   * Calculate new dimensions while preserving aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    preserveAspectRatio: boolean
  ): { width: number; height: number } {
    if (!preserveAspectRatio) {
      return { width: maxWidth, height: maxHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    if (originalWidth / maxWidth > originalHeight / maxHeight) {
      return {
        width: maxWidth,
        height: Math.round(maxWidth / aspectRatio),
      };
    } else {
      return {
        width: Math.round(maxHeight * aspectRatio),
        height: maxHeight,
      };
    }
  }

  /**
   * Generate compressed file name
   */
  private static generateCompressedFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_compressed.${format}`;
  }

  /**
   * Get MIME type for format
   */
  private static getMimeType(format: string): string {
    switch (format) {
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }
}

/**
 * Hook for image compression in React components
 */
export const useImageCompression = () => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const compressImage = async (
    file: File,
    options?: CompressionOptions
  ): Promise<CompressionResult> => {
    setIsCompressing(true);
    setError(null);
    setProgress(0);

    try {
      setProgress(50);
      const result = await ImageCompressor.compressImage(file, options);
      setProgress(100);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compress image');
      throw err;
    } finally {
      setIsCompressing(false);
    }
  };

  const compressMultipleImages = async (
    files: File[],
    options?: CompressionOptions
  ): Promise<CompressionResult[]> => {
    setIsCompressing(true);
    setError(null);
    setProgress(0);

    try {
      const totalFiles = files.length;
      const results: CompressionResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const result = await ImageCompressor.compressImage(files[i], options);
        results.push(result);
        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compress images');
      throw err;
    } finally {
      setIsCompressing(false);
    }
  };

  return {
    compressImage,
    compressMultipleImages,
    isCompressing,
    error,
    progress,
  };
};

import { useState } from 'react';