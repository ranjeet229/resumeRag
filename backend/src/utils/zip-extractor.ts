import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs/promises';
import { BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

export class ZipExtractor {
  /**
   * Extract files from a ZIP archive
   * @param zipPath Path to the ZIP file
   * @param extractPath Path to extract files to
   * @returns Array of extracted file paths
   */
  static async extract(zipPath: string, extractPath: string): Promise<string[]> {
    try {
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();
      const extractedFiles: string[] = [];

      // Create extraction directory if it doesn't exist
      await fs.mkdir(extractPath, { recursive: true });

      for (const entry of zipEntries) {
        if (!entry.isDirectory) {
          const filePath = path.join(extractPath, entry.name);
          
          // Skip if file is not of allowed type
          if (!this.isAllowedFile(entry.name)) {
            logger.warn(`Skipping file ${entry.name} - not an allowed type`);
            continue;
          }

          // Extract file
          zip.extractEntryTo(entry, extractPath, false, true);
          extractedFiles.push(filePath);
          logger.info(`Extracted file: ${entry.name}`);
        }
      }

      // Delete the ZIP file after extraction
      await fs.unlink(zipPath);

      return extractedFiles;
    } catch (error) {
      logger.error('Error extracting ZIP file:', error);
      throw new BadRequestError('Failed to process ZIP file');
    }
  }

  /**
   * Check if file is of allowed type
   */
  private static isAllowedFile(filename: string): boolean {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
  }

  /**
   * Clean up extracted files
   */
  static async cleanup(files: string[]): Promise<void> {
    try {
      await Promise.all(
        files.map(file => fs.unlink(file).catch(err => 
          logger.error(`Error deleting file ${file}:`, err)
        ))
      );
    } catch (error) {
      logger.error('Error cleaning up files:', error);
    }
  }
}