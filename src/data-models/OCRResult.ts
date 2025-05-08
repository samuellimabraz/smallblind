/**
 * OCR result for text extraction from images
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  type: 'paragraph' | 'line' | 'word';
}

export class OCRResult {
  /**
   * Extracted text content
   */
  text: string;
  
  /**
   * Overall confidence score
   */
  confidence: number;
  
  /**
   * Blocks of text with position information
   */
  blocks: TextBlock[];
  
  /**
   * Detected language of the text
   */
  language: string;
  
  constructor(data: Partial<OCRResult>) {
    this.text = data.text || '';
    this.confidence = data.confidence || 0;
    this.blocks = data.blocks || [];
    this.language = data.language || 'en';
  }
} 