import { WebhookRequest, WebhookResponse, WebsiteItem } from '../types/outreach';

const WEBHOOK_URL = 'https://hook.eu2.make.com/nb39n4fb6b3yfmr8n2yut30orm8d8e2i';

export const sendOutreachRequest = async (websites: string[]): Promise<WebhookResponse> => {
  const websiteItems: WebsiteItem[] = websites.map((url, index) => ({
    url,
    index: index + 1,
  }));

  const payload: WebhookRequest = {
    websites: websiteItems,
    total_count: websites.length,
    timestamp: new Date().toISOString(),
  };

  console.log('Sending webhook payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);

    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Make webhook did not return JSON. Content-Type:', contentType);
      const textResponse = await response.text();
      console.log('Non-JSON response body:', textResponse);

      return {
        results: [],
        processed: websites.length,
        total: websites.length,
      };
    }

    let data;
    try {
      data = await response.json();
      console.log('Parsed JSON response:', data);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      const textResponse = await response.text();
      console.log('Failed response body:', textResponse);
      throw new Error('Make webhook returned invalid JSON. Please check the webhook configuration.');
    }

    if (!data || typeof data !== 'object') {
      console.warn('Make webhook returned non-object data:', data);
      return {
        results: [],
        processed: websites.length,
        total: websites.length,
      };
    }

    const validatedResponse: WebhookResponse = {
      results: Array.isArray(data.results) ? data.results : [],
      processed: typeof data.processed === 'number' ? data.processed : websites.length,
      total: typeof data.total === 'number' ? data.total : websites.length,
    };

    if (validatedResponse.results.length === 0 && websites.length > 0) {
      console.warn('Make webhook returned no results. This may indicate an issue with the webhook processing.');
    }

    return validatedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to connect to Make webhook: ${error.message}`);
    }
    throw new Error('Failed to connect to Make webhook');
  }
};
