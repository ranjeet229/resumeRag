// Regular expressions for identifying PII
const PII_PATTERNS = {
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PHONE: /(\+\d{1,3}[\s.-])?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
  SSN: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
  CREDIT_CARD: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
};

export interface RedactionOptions {
  keepEmail?: boolean;
  keepPhone?: boolean;
  keepName?: boolean;
  replacement?: string;
}

export class PIIRedactor {
  private static readonly DEFAULT_REPLACEMENT = '[REDACTED]';

  /**
   * Redact PII from text based on options
   */
  static redact(text: string, options: RedactionOptions = {}): string {
    const replacement = options.replacement || this.DEFAULT_REPLACEMENT;
    let redactedText = text;

    // Email redaction
    if (!options.keepEmail) {
      redactedText = redactedText.replace(PII_PATTERNS.EMAIL, replacement);
    }

    // Phone number redaction
    if (!options.keepPhone) {
      redactedText = redactedText.replace(PII_PATTERNS.PHONE, replacement);
    }

    // Always redact sensitive information
    redactedText = redactedText
      .replace(PII_PATTERNS.SSN, replacement)
      .replace(PII_PATTERNS.CREDIT_CARD, replacement);

    return redactedText;
  }

  /**
   * Extract PII from text for metadata while redacting
   */
  static extractAndRedact(text: string): {
    redactedText: string;
    metadata: {
      email?: string;
      phone?: string;
    };
  } {
    const metadata: { email?: string; phone?: string } = {};
    let redactedText = text;

    // Extract and redact email
    const emailMatch = text.match(PII_PATTERNS.EMAIL);
    if (emailMatch) {
      metadata.email = emailMatch[0];
      redactedText = redactedText.replace(PII_PATTERNS.EMAIL, this.DEFAULT_REPLACEMENT);
    }

    // Extract and redact phone
    const phoneMatch = text.match(PII_PATTERNS.PHONE);
    if (phoneMatch) {
      metadata.phone = phoneMatch[0];
      redactedText = redactedText.replace(PII_PATTERNS.PHONE, this.DEFAULT_REPLACEMENT);
    }

    // Redact other sensitive information
    redactedText = redactedText
      .replace(PII_PATTERNS.SSN, this.DEFAULT_REPLACEMENT)
      .replace(PII_PATTERNS.CREDIT_CARD, this.DEFAULT_REPLACEMENT);

    return { redactedText, metadata };
  }
}