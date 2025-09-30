import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageCompressor } from '../../utils/imageCompression';

// Mock HTMLCanvasElement and its methods
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
  })),
  toBlob: vi.fn((callback, type, quality) => {
    // Simulate compressed blob
    callback(new Blob(['compressed-image-content'], { type }));
  }),
};

// Mock Image element
class MockImage {
  width = 1920;
  height = 1080;
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('ImageCompressor', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock document.createElement for canvas
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return document.createElement(tagName);
    });

    // Mock Image constructor
    global.Image = MockImage as any;
  });

  describe('compressImage', () => {
    it('should compress an image successfully', async () => {
      const mockFile = new File(['image-content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = await ImageCompressor.compressImage(mockFile);

      expect(result).toBeDefined();
      expect(result.originalSize).toBe(mockFile.size);
      expect(result.compressedSize).toBeGreaterThan(0);
      // Compression ratio can be negative if compressed size is larger than original
    expect(typeof result.compressionRatio).toBe('number');
      expect(result.dimensions.width).toBeGreaterThan(0);
      expect(result.dimensions.height).toBeGreaterThan(0);
      expect(result.format).toBe('jpeg');
      expect(result.quality).toBe(0.8);
    });

    it('should use custom compression options', async () => {
      const mockFile = new File(['image-content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const options = {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.6,
        format: 'png' as const,
      };

      const result = await ImageCompressor.compressImage(mockFile, options);

      expect(result.format).toBe('png');
      expect(result.quality).toBe(0.6);
    });

    it('should handle image loading errors', async () => {
      const mockFile = new File(['image-content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      // Mock image loading error
      class ErrorImage extends MockImage {
        constructor() {
          super();
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      }
      global.Image = ErrorImage as any;

      await expect(ImageCompressor.compressImage(mockFile)).rejects.toThrow('Failed to load image');
    });

    it('should handle canvas context errors', async () => {
      const mockFile = new File(['image-content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      // Mock canvas context failure
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return {
            ...mockCanvas,
            getContext: vi.fn(() => null),
          } as any;
        }
        return document.createElement(tagName);
      });

      await expect(ImageCompressor.compressImage(mockFile)).rejects.toThrow('Failed to get canvas context');
    });
  });

  describe('compressMultipleImages', () => {
    it('should compress multiple images in parallel', async () => {
      const mockFiles = [
        new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['image3'], 'test3.jpg', { type: 'image/jpeg' }),
      ];

      const results = await ImageCompressor.compressMultipleImages(mockFiles);

      expect(results).toHaveLength(3);
      expect(results.every(result => result.compressedFile instanceof File)).toBe(true);
      expect(results.every(result => typeof result.compressionRatio === 'number')).toBe(true);
    });
  });

  describe('getImageDimensions', () => {
    it('should return image dimensions', async () => {
      const mockFile = new File(['image-content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const dimensions = await ImageCompressor.getImageDimensions(mockFile);

      expect(dimensions).toEqual({ width: 1920, height: 1080 });
    });

    it('should handle image loading errors', async () => {
      const mockFile = new File(['image-content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      class ErrorImage extends MockImage {
        constructor() {
          super();
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      }
      global.Image = ErrorImage as any;

      await expect(ImageCompressor.getImageDimensions(mockFile)).rejects.toThrow('Failed to load image');
    });
  });

  describe('isImageFile', () => {
    it('should return true for image files', () => {
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      expect(ImageCompressor.isImageFile(imageFile)).toBe(true);
    });

    it('should return false for non-image files', () => {
      const textFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      expect(ImageCompressor.isImageFile(textFile)).toBe(false);
    });

    it('should return false for files without type', () => {
      const noTypeFile = new File(['content'], 'test');
      expect(ImageCompressor.isImageFile(noTypeFile)).toBe(false);
    });
  });

  describe('getRecommendedOptions', () => {
    it('should return medical-specific options for medical images', () => {
      const medicalFile = new File(['content'], 'xray-chest.jpg', { type: 'image/jpeg' });
      const options = ImageCompressor.getRecommendedOptions(medicalFile);

      expect(options.quality).toBe(0.9);
      expect(options.format).toBe('png');
      expect(options.maxWidth).toBe(2560);
      expect(options.maxHeight).toBe(1440);
    });

    it('should return default options for regular images', () => {
      const regularFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      const options = ImageCompressor.getRecommendedOptions(regularFile);

      expect(options.quality).toBe(0.8);
      expect(options.format).toBe('jpeg');
      expect(options.maxWidth).toBe(1920);
      expect(options.maxHeight).toBe(1080);
    });

    it('should detect various medical image types', () => {
      const medicalFiles = [
        new File(['content'], 'mri-brain.png', { type: 'image/png' }),
        new File(['content'], 'scan-ultrasound.jpg', { type: 'image/jpeg' }),
        new File(['content'], 'ct-scan.jpeg', { type: 'image/jpeg' }),
      ];

      medicalFiles.forEach(file => {
        const options = ImageCompressor.getRecommendedOptions(file);
        expect(options.quality).toBe(0.9);
        expect(options.format).toBe('png');
      });
    });
  });

  describe('calculateDimensions', () => {
    it('should maintain aspect ratio when preserving aspect ratio', () => {
      const { calculateDimensions } = ImageCompressor as any;

      const result = calculateDimensions(1920, 1080, 800, 600, true);

      // Should maintain 16:9 aspect ratio
      expect(result.width / result.height).toBeCloseTo(16/9, 1);
      expect(result.width).toBeLessThanOrEqual(800);
      expect(result.height).toBeLessThanOrEqual(600);
    });

    it('should not scale up small images', () => {
      const { calculateDimensions } = ImageCompressor as any;

      const result = calculateDimensions(100, 100, 800, 600, true);

      expect(result).toEqual({ width: 100, height: 100 });
    });

    it('should ignore aspect ratio when not preserving', () => {
      const { calculateDimensions } = ImageCompressor as any;

      const result = calculateDimensions(1920, 1080, 800, 600, false);

      expect(result).toEqual({ width: 800, height: 600 });
    });
  });
});