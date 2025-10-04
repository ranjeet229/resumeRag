import { EmbeddingService } from './embedding.service';
import { TextChunker } from '../utils/text-chunker';
import logger from '../utils/logger';

interface ParsedRequirements {
  skills: {
    required: string[];
    preferred: string[];
  };
  experience: {
    years: number;
    level: 'entry' | 'mid' | 'senior' | 'lead';
  };
  education: {
    required: string[];
    preferred: string[];
  };
  other: string[];
}

export class JobParser {
  private static instance: JobParser;
  private embeddingService: EmbeddingService;

  private constructor() {
    this.embeddingService = EmbeddingService.getInstance();
  }

  public static getInstance(): JobParser {
    if (!JobParser.instance) {
      JobParser.instance = new JobParser();
    }
    return JobParser.instance;
  }

  /**
   * Parse job description and extract structured requirements
   */
  async parseRequirements(description: string): Promise<ParsedRequirements> {
    try {
      const sections = this.splitIntoSections(description);
      const requirements = await this.extractRequirements(sections);
      const experience = this.extractExperienceDetails(description);
      
      return {
        ...requirements,
        experience,
      };
    } catch (error) {
      logger.error('Error parsing job requirements:', error);
      throw error;
    }
  }

  /**
   * Split job description into logical sections
   */
  private splitIntoSections(description: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const text = description.toLowerCase();

    // Common section markers
    const sectionMarkers = {
      requirements: ['requirements', 'qualifications', 'what you need'],
      responsibilities: ['responsibilities', 'what you will do', 'duties'],
      skills: ['skills', 'technical skills', 'technologies'],
      education: ['education', 'academic', 'qualifications'],
      experience: ['experience', 'background', 'work history'],
    };

    // Extract sections
    for (const [key, markers] of Object.entries(sectionMarkers)) {
      for (const marker of markers) {
        const regex = new RegExp(`${marker}[:\\s]+(.*?)(?=\\n\\s*(?:${Object.values(sectionMarkers).flat().join('|')})[:\\s]|$)`, 'is');
        const match = text.match(regex);
        if (match) {
          sections[key] = match[1].trim();
          break;
        }
      }
    }

    return sections;
  }

  /**
   * Extract structured requirements from sections
   */
  private async extractRequirements(sections: Record<string, string>): Promise<Omit<ParsedRequirements, 'experience'>> {
    const requirements: Omit<ParsedRequirements, 'experience'> = {
      skills: { required: [], preferred: [] },
      education: { required: [], preferred: [] },
      other: [],
    };

    // Process requirements section
    for (const sectionKey of ['requirements', 'qualifications', 'skills', 'education']) {
      if (!sections[sectionKey]) continue;

      const lines = sections[sectionKey].split('\n');
      for (let line of lines) {
        line = line.trim().toLowerCase();
        if (!line) continue;

        // Skip bullet points and dashes
        line = line.replace(/^[-•*]\s*/, '');

        // Check if requirement is required or preferred
        const isPreferred = /preferred|plus|nice to have|optional/i.test(line);

        // Extract requirements based on line content
        await this.processRequirementLine(line, isPreferred, requirements);
      }
    }

    // Deduplicate arrays
    requirements.skills.required = [...new Set(requirements.skills.required)];
    requirements.skills.preferred = [...new Set(requirements.skills.preferred)];
    requirements.education.required = [...new Set(requirements.education.required)];
    requirements.education.preferred = [...new Set(requirements.education.preferred)];

    return requirements;
  }

  /**
   * Process a single requirement line and update requirements object
   */
  private async processRequirementLine(
    line: string,
    isPreferred: boolean,
    requirements: Omit<ParsedRequirements, 'experience'>
  ): Promise<void> {
    // Check for education requirements first
    if (this.isEducationRequirement(line)) {
      const educationRequirements = this.extractEducation(line);
      const target = isPreferred ? requirements.education.preferred : requirements.education.required;
      target.push(...educationRequirements);
      return;
    }

    // Extract skills from the line
    if (this.isSkillRequirement(line)) {
      const skills = await this.extractSkills(line);
      const target = isPreferred ? requirements.skills.preferred : requirements.skills.required;
      target.push(...skills);
      return;
    }

    // If there are any technology keywords in the line, treat them as skills
    const techSkills = await this.extractSkills(line);
    if (techSkills.length > 0) {
      const target = isPreferred ? requirements.skills.preferred : requirements.skills.required;
      target.push(...techSkills);
      return;
    }

    // Add to other requirements if not categorized
    requirements.other.push(line);
  }

  /**
   * Extract experience details from text
   */
  private extractExperienceDetails(text: string): ParsedRequirements['experience'] {
    const text_lower = text.toLowerCase();
    
    // Extract years of experience
    const yearsMatch = text_lower.match(/(\d+)(?:\+|\s*-\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i);
    const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;

    // Check for specific position levels
    const isLead = /(lead|principal|architect|head|director|manager)/i.test(text_lower);
    const isSenior = /(senior|sr\.)/i.test(text_lower);
    const isJunior = /(junior|jr\.?|entry|graduate)/i.test(text_lower);

    // Determine experience level based on both title and years
    let level: ParsedRequirements['experience']['level'];
    
    if (isLead || years >= 10) {
      level = 'lead';
    } else if (isSenior || years >= 7) {
      level = 'senior';
    } else if (isJunior || years <= 2) {
      level = 'entry';
    } else {
      level = 'mid';
    }

    return { years, level };
  }

  /**
   * Check if text contains skill requirements
   */
  private isSkillRequirement(text: string): boolean {
    const skillIndicators = [
      'experience with', 'knowledge of', 'proficiency in',
      'familiarity with', 'understanding of', 'expertise in',
      'skills in', 'ability to', 'proficient in', 'skilled in',
      'experienced in', 'competency in', 'competent in',
      'strong in', 'background in', 'exposure to',
    ];

    const containsIndicator = skillIndicators.some(indicator => text.includes(indicator));
    if (containsIndicator) return true;

    // Also check if the text is in a skills list or section
    const skillSectionMarkers = ['technical skills:', 'skills:', 'technologies:', 'requirements:'];
    return skillSectionMarkers.some(marker => text.startsWith(marker));
  }

  /**
   * Check if text contains education requirements
   */
  private isEducationRequirement(text: string): boolean {
    const educationIndicators = [
      'degree', 'bachelor', 'master', 'phd', 'diploma',
      'certification', 'graduate', 'education', 'mba',
      'bs', 'ba', 'ms', 'ma', 'academic',
    ];

    return educationIndicators.some(indicator => 
      text.includes(indicator) && 
      !text.includes('skill') && 
      !text.includes('experience')
    );
  }

  /**
   * Extract skills from text using embedding similarity
   */
  private async extractSkills(text: string): Promise<string[]> {
    // Common technology skills to match against
    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust',
      'react', 'angular', 'vue.js', 'node.js', 'express', 'next.js', 'nuxt.js',
      'mongodb', 'postgresql', 'mysql', 'redis', 'oracle', 'sql server',
      'aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda', 'microservices',
      'docker', 'kubernetes', 'ci/cd', 'jenkins', 'github actions', 'gitlab ci',
      'git', 'svn', 'mercurial', 'agile', 'scrum', 'kanban', 'jira',
      'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch', 'scikit-learn',
      'html', 'css', 'sass', 'less', 'webpack', 'babel', 'graphql', 'rest',
      'linux', 'unix', 'windows', 'networking', 'security', 'authentication',
      'testing', 'jest', 'mocha', 'cypress', 'selenium', 'junit', 'pytest',
    ];

    const textLower = text.toLowerCase();
    const skills: string[] = [];

    // First, try direct matching
    for (const skill of commonSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        skills.push(skill);
        continue;
      }
    }

    // Then try semantic matching for remaining text
    if (skills.length === 0) {
      const embedding = await this.embeddingService.generateEmbedding(text);
      
      for (const skill of commonSkills) {
        const skillEmbedding = await this.embeddingService.generateEmbedding(skill);
        const similarity = this.cosineSimilarity(embedding, skillEmbedding);

        if (similarity > 0.85) {
          skills.push(skill);
        }
      }
    }

    return skills;
  }

  /**
   * Extract education requirements from text
   */
  private extractEducation(text: string): string[] {
    const education: string[] = [];
    const educationPatterns = [
      /(?:bachelor'?s?|master'?s?|phd|doctorate)\s+(?:degree\s+)?(?:in\s+)?([^,\.]+)/gi,
      /(?:bs|ba|ms|ma|mba|phd)\s+(?:in\s+)?([^,\.]+)/gi,
      /degree\s+in\s+([^,\.]+)/gi,
    ];

    for (const pattern of educationPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const field = match[1].trim().toLowerCase();
        if (!education.includes(field)) {
          education.push(field);
        }
      }
    }

    // Check for standalone education keywords
    const standaloneKeywords = [
      "master's", "masters", "bachelor's", "bachelors",
      "phd", "doctorate", "degree", "mba",
    ];

    for (const keyword of standaloneKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        education.push(keyword);
      }
    }

    return education;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
    const norm1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
    const norm2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (norm1 * norm2);
  }
}