/**
 * File Processing Utilities
 * Handles parsing and extracting content from various file types
 * Supported: Images, PDFs, Excel (XLS/XLSX), Word docs (DOCX)
 */

import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  pdf: 20 * 1024 * 1024, // 20MB
  excel: 15 * 1024 * 1024, // 15MB
  document: 10 * 1024 * 1024, // 10MB
  default: 10 * 1024 * 1024, // 10MB
};

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  image: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
  excel: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  document: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  category?: 'image' | 'document' | 'spreadsheet' | 'other';
}

export interface FileProcessingResult {
  success: boolean;
  extractedText?: string;
  error?: string;
  metadata?: {
    pageCount?: number;
    sheetCount?: number;
    rowCount?: number;
    width?: number;
    height?: number;
  };
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): FileValidationResult {
  // Determine file category
  let category: 'image' | 'document' | 'spreadsheet' | 'other' = 'other';

  if (SUPPORTED_FILE_TYPES.image.includes(file.type)) {
    category = 'image';
  } else if (SUPPORTED_FILE_TYPES.pdf.includes(file.type)) {
    category = 'document';
  } else if (SUPPORTED_FILE_TYPES.excel.includes(file.type)) {
    category = 'spreadsheet';
  } else if (SUPPORTED_FILE_TYPES.document.includes(file.type)) {
    category = 'document';
  }

  // Check if file type is supported
  const allSupportedTypes = Object.values(SUPPORTED_FILE_TYPES).flat();
  if (!allSupportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: images (PNG, JPEG, GIF, WebP), PDFs, Excel (XLS, XLSX), Word (DOCX), and text files.`,
    };
  }

  // Check file size
  const sizeLimit = FILE_SIZE_LIMITS[category] || FILE_SIZE_LIMITS.default;
  if (file.size > sizeLimit) {
    const sizeMB = (sizeLimit / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size exceeds limit of ${sizeMB}MB for ${category} files.`,
    };
  }

  return { valid: true, category };
}

/**
 * Process Excel file and extract text content
 */
export async function processExcelFile(
  file: File
): Promise<FileProcessingResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const extractedText: string[] = [];
    let totalRows = 0;

    // Process each sheet
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON for easier processing
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      totalRows += jsonData.length;

      // Add sheet name as heading
      extractedText.push(`\n## Sheet: ${sheetName}\n`);

      // Convert to CSV-like text format
      const csvText = XLSX.utils.sheet_to_csv(worksheet);
      extractedText.push(csvText);
    });

    return {
      success: true,
      extractedText: extractedText.join('\n'),
      metadata: {
        sheetCount: workbook.SheetNames.length,
        rowCount: totalRows,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Process PDF file and extract text content
 */
export async function processPdfFile(
  file: File
): Promise<FileProcessingResult> {
  try {
    // Dynamic import to avoid SSR issues
    const pdfParse = (await import('pdf-parse')).default;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdfParse(buffer);

    return {
      success: true,
      extractedText: data.text,
      metadata: {
        pageCount: data.numpages,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to process PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Process Word document and extract text content
 */
export async function processWordDocument(
  file: File
): Promise<FileProcessingResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    return {
      success: true,
      extractedText: result.value,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to process Word document: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Process text file and extract content
 */
export async function processTextFile(
  file: File
): Promise<FileProcessingResult> {
  try {
    const text = await file.text();

    return {
      success: true,
      extractedText: text,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to process text file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Convert image file to base64 for vision models
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data:image/xxx;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Main file processing function - routes to appropriate processor
 */
export async function processFile(
  file: File,
  category: 'image' | 'document' | 'spreadsheet' | 'other'
): Promise<FileProcessingResult> {
  switch (category) {
    case 'image':
      // For images, just get dimensions
      const dimensions = await getImageDimensions(file);
      return {
        success: true,
        metadata: dimensions || undefined,
      };

    case 'spreadsheet':
      return await processExcelFile(file);

    case 'document':
      if (file.type === 'application/pdf') {
        return await processPdfFile(file);
      } else if (
        file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        return await processWordDocument(file);
      } else if (file.type === 'text/plain') {
        return await processTextFile(file);
      }
      return {
        success: false,
        error: 'Unsupported document type',
      };

    default:
      return {
        success: false,
        error: 'Unsupported file category',
      };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
