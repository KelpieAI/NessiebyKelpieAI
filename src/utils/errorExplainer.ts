// Error Explanation System
// Provides human-readable explanations for scraping errors

export interface ErrorExplanation {
  simple: string;
  causes: string[];
  fix: string;
  severity: 'low' | 'medium' | 'high';
}

// Static dictionary for common errors (fast, free)
const ERROR_DICTIONARY: Record<string, ErrorExplanation> = {
  'ERR_CONNECTION_RESET': {
    simple: 'The server closed the connection unexpectedly',
    causes: [
      'Website is temporarily down',
      'Server is overloaded with traffic',
      'Firewall blocking automated requests',
    ],
    fix: 'Try again in a few minutes',
    severity: 'medium',
  },
  'ERR_CONNECTION_REFUSED': {
    simple: 'The server refused to connect',
    causes: [
      'Website is offline',
      'Server firewall blocking our IP',
      'Wrong port or configuration',
    ],
    fix: 'Check if the website is accessible in a browser',
    severity: 'high',
  },
  'ERR_NAME_NOT_RESOLVED': {
    simple: 'The website domain could not be found',
    causes: [
      'Typo in the URL',
      'Domain has expired',
      'Website no longer exists',
    ],
    fix: 'Double-check the URL for typos',
    severity: 'high',
  },
  'DNS_PROBE_FINISHED_NXDOMAIN': {
    simple: 'Domain name does not exist',
    causes: [
      'Typo in URL (check spelling)',
      'Domain registration expired',
      'Website permanently shut down',
    ],
    fix: 'Verify the domain name is correct',
    severity: 'high',
  },
  'ERR_TIMED_OUT': {
    simple: 'Request took too long and timed out',
    causes: [
      'Website is very slow to respond',
      'Server is under heavy load',
      'Network connectivity issues',
    ],
    fix: 'Retry - the website might be slow right now',
    severity: 'medium',
  },
  'ERR_CONNECTION_TIMED_OUT': {
    simple: 'Connection attempt took too long',
    causes: [
      'Website server is slow or unresponsive',
      'Network issues between us and the site',
      'Firewall blocking the connection',
    ],
    fix: 'Retry in a few minutes',
    severity: 'medium',
  },
  'ERR_CERT_COMMON_NAME_INVALID': {
    simple: 'SSL certificate has the wrong domain name',
    causes: [
      'Website misconfigured their SSL',
      'Using wrong certificate',
      'Domain recently changed',
    ],
    fix: 'Contact the website owner - this is their issue',
    severity: 'medium',
  },
  'ERR_CERT_AUTHORITY_INVALID': {
    simple: 'SSL certificate is not trusted',
    causes: [
      'Self-signed certificate',
      'Certificate from untrusted authority',
      'Man-in-the-middle attack (rare)',
    ],
    fix: 'Proceed with caution - security risk',
    severity: 'high',
  },
  'ERR_SSL_PROTOCOL_ERROR': {
    simple: 'Problem with the website\'s security setup',
    causes: [
      'Outdated SSL/TLS configuration',
      'Server misconfiguration',
      'Incompatible encryption',
    ],
    fix: 'Contact the website owner',
    severity: 'medium',
  },
  'ERR_TOO_MANY_REDIRECTS': {
    simple: 'Website has a redirect loop',
    causes: [
      'Misconfigured redirects on their server',
      'Cookie or session issues',
      'Conflicting redirect rules',
    ],
    fix: 'Contact the website owner - configuration issue',
    severity: 'medium',
  },
  'ERR_INVALID_URL': {
    simple: 'The URL format is incorrect',
    causes: [
      'Missing http:// or https://',
      'Invalid characters in URL',
      'Malformed domain name',
    ],
    fix: 'Check the URL format (must start with http:// or https://)',
    severity: 'high',
  },
  'ERR_ABORTED': {
    simple: 'Request was cancelled',
    causes: [
      'Our system stopped the request',
      'Timeout limit reached',
      'Website returned incomplete data',
    ],
    fix: 'Retry - this was likely a temporary issue',
    severity: 'low',
  },
  'ERR_NETWORK_CHANGED': {
    simple: 'Network connection changed during request',
    causes: [
      'Network connectivity issues',
      'Connection switched between networks',
      'Internet dropped momentarily',
    ],
    fix: 'Retry - this is usually temporary',
    severity: 'low',
  },
  'ERR_BLOCKED_BY_CLIENT': {
    simple: 'Request blocked by security software',
    causes: [
      'Ad blocker or browser extension',
      'Corporate firewall',
      'VPN blocking the connection',
    ],
    fix: 'Check network security settings',
    severity: 'medium',
  },
  'DataError': {
    simple: 'Unable to extract data from the website',
    causes: [
      'Website structure is unusual or complex',
      'Content is behind a login wall',
      'Website uses heavy JavaScript rendering',
    ],
    fix: 'The website may require special handling',
    severity: 'medium',
  },
  'AssertionFailureError': {
    simple: 'Website content didn\'t match expectations',
    causes: [
      'Website structure changed recently',
      'Page loaded but content is missing',
      'Anti-bot protection active',
    ],
    fix: 'Website may have changed - may need manual check',
    severity: 'medium',
  },
  '404': {
    simple: 'Page not found',
    causes: [
      'URL path is incorrect',
      'Page was removed or moved',
      'Website restructured',
    ],
    fix: 'Check if the correct URL was provided',
    severity: 'high',
  },
  '403': {
    simple: 'Access forbidden',
    causes: [
      'Website blocking automated access',
      'IP address is blocked',
      'Authentication required',
    ],
    fix: 'Website is blocking our scraper',
    severity: 'high',
  },
  '500': {
    simple: 'Server error on their end',
    causes: [
      'Website\'s server is having issues',
      'Database problems',
      'Application crashed',
    ],
    fix: 'Retry later - this is their server issue',
    severity: 'medium',
  },
  '503': {
    simple: 'Service temporarily unavailable',
    causes: [
      'Website under maintenance',
      'Server overloaded',
      'Temporary downtime',
    ],
    fix: 'Retry in 10-15 minutes',
    severity: 'medium',
  },
};

// Get explanation from dictionary or generate with AI
export async function explainError(
  errorCode: string,
  errorMessage: string,
  useAI: boolean = true
): Promise<ErrorExplanation> {
  // Try dictionary first
  const dictionaryMatch = findDictionaryMatch(errorCode, errorMessage);
  if (dictionaryMatch) {
    return dictionaryMatch;
  }

  // Fall back to AI if enabled
  if (useAI) {
    try {
      return await getAIExplanation(errorCode, errorMessage);
    } catch (error) {
      console.error('AI explanation failed:', error);
      return getGenericExplanation();
    }
  }

  return getGenericExplanation();
}

// Find best match in dictionary
function findDictionaryMatch(
  errorCode: string,
  errorMessage: string
): ErrorExplanation | null {
  // Direct match on error code
  if (ERROR_DICTIONARY[errorCode]) {
    return ERROR_DICTIONARY[errorCode];
  }

  // Try to find error code in message
  for (const [code, explanation] of Object.entries(ERROR_DICTIONARY)) {
    if (errorMessage.includes(code)) {
      return explanation;
    }
  }

  // Check for HTTP status codes
  const statusMatch = errorMessage.match(/\b([45]\d{2})\b/);
  if (statusMatch && ERROR_DICTIONARY[statusMatch[1]]) {
    return ERROR_DICTIONARY[statusMatch[1]];
  }

  return null;
}

// Get AI explanation using Claude API
async function getAIExplanation(
  errorCode: string,
  errorMessage: string
): Promise<ErrorExplanation> {
  // This would call your Claude API or use the Anthropic API directly
  // For now, returning a placeholder structure
  
  const prompt = `Explain this web scraping error in simple terms for a non-technical user:

Error Code: ${errorCode}
Error Message: ${errorMessage}

Provide:
1. A simple one-sentence explanation
2. 2-3 possible causes
3. What action to take
4. Severity (low/medium/high)

Format as JSON.`;

  // TODO: Implement actual API call
  // const response = await callClaudeAPI(prompt);
  
  // For now, return generic
  return getGenericExplanation();
}

// Generic fallback explanation
function getGenericExplanation(): ErrorExplanation {
  return {
    simple: 'An unexpected error occurred while scraping this website',
    causes: [
      'Website may have anti-bot protection',
      'Server configuration issue',
      'Network connectivity problem',
    ],
    fix: 'Try again, or contact support if the issue persists',
    severity: 'medium',
  };
}

// Get severity color for UI
export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low':
      return 'rgb(34, 197, 94)'; // Green
    case 'medium':
      return 'rgb(251, 191, 36)'; // Yellow
    case 'high':
      return 'rgb(239, 68, 68)'; // Red
  }
}

// Get severity icon
export function getSeverityIcon(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low':
      return 'ℹ️';
    case 'medium':
      return '⚠️';
    case 'high':
      return '🚨';
  }
}