import { pdf } from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

export class ResumeParser {
  /**
   * Extract text from a file based on its type
   */
  static async extractText(filePath: string): Promise<string> {
    const extension = path.extname(filePath).toLowerCase();
    const fileBuffer = await fs.readFile(filePath);

    try {
      switch (extension) {
        case '.pdf':
          return await this.extractFromPDF(fileBuffer);
        case '.docx':
          return await this.extractFromDOCX(fileBuffer);
        case '.doc':
          throw new BadRequestError('.doc files are not supported. Please convert to .docx or PDF');
        default:
          throw new BadRequestError(`Unsupported file type: ${extension}`);
      }
    } catch (error) {
      logger.error(`Error extracting text from ${filePath}:`, error);
      throw new BadRequestError('Failed to extract text from file');
    }
  }

  /**
   * Extract text from PDF file
   */
  private static async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      logger.error('Error parsing PDF:', error);
      throw new BadRequestError('Failed to parse PDF file');
    }
  }

  /**
   * Extract text from DOCX file
   */
  private static async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      logger.error('Error parsing DOCX:', error);
      throw new BadRequestError('Failed to parse DOCX file');
    }
  }

  /**
   * Extract basic metadata from text
   */
  static extractMetadata(text: string): {
    skills: string[];
    education: { degree: string; institution: string; year: number }[];
    experience: number;
  } {
    // This is a basic implementation - should be enhanced with NLP/ML
    const skills = this.extractSkills(text);
    const education = this.extractEducation(text);
    const experience = this.estimateExperience(text);

    return {
      skills,
      education,
      experience,
    };
  }

  /**
   * Extract skills from text
   */
  private static extractSkills(text: string): string[] {
    // This is a basic implementation - should be enhanced with ML
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'sql',
      'aws', 'docker', 'kubernetes', 'machine learning', 'ai',
      'typescript', 'mongodb', 'postgresql', 'rest api'
    ];

    return commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
  }

  /**
   * Extract education information
   */
  private static extractEducation(text: string): { degree: string; institution: string; year: number }[] {
    // This is a basic implementation - should be enhanced with NLP
    const educationSection = text.match(/education(.*?)(experience|skills|projects)/is)?.[1] || '';
    
    // Basic pattern matching for degree and year
    const degrees = educationSection.match(/(?:bachelor|master|phd|b\.?(?:tech|sc|a)|m\.?(?:tech|sc|ba)|doctorate).*?(?:20\d{2}|\d{2})/gi) || [];

    return degrees.map(match => ({
      degree: match.split(/\s+/)[0],
      institution: 'Unknown', // Would need more sophisticated NLP
      year: parseInt(match.match(/\d{4}|\d{2}/)?.[0] || '0'),
    }));
  }

  /**
   * Estimate years of experience
   */
  private static estimateExperience(text: string): number {
    // This is a basic implementation - should be enhanced with ML
    const experienceSection = text.match(/experience(.*?)(education|skills|projects)/is)?.[1] || '';
    const years = experienceSection.match(/(\d+)(?:\s*-\s*\d+)?\s*years?/gi) || [];
    
    return years.reduce((total, year) => {
      const num = parseInt(year.match(/\d+/)?.[0] || '0');
      return total + num;
    }, 0);
  }
}