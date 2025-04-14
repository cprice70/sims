import sanitizeHtmlLib from 'sanitize-html';

// Sanitize HTML content to prevent XSS attacks
export function sanitizeHtml(content: string | null | undefined): string {
  if (content === null || content === undefined) {
    return '';
  }
  
  return sanitizeHtmlLib(content, {
    allowedTags: [], // Allow no HTML tags
    allowedAttributes: {}, // Allow no HTML attributes
    disallowedTagsMode: 'recursiveEscape' // Encode all HTML entities
  });
}

// Sanitize a URL to prevent malicious links
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Check if URL is valid
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return url;
  } catch (e) {
    // If URL parsing fails, it's not a valid URL
    return '';
  }
}

// Helper to validate and convert numeric inputs
export function validateNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return !isNaN(num) ? num : defaultValue;
}