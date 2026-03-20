export interface OutreachResult {
  domain: string;
  company: string;
  industry: string;
  contactName: string;
  email: string;
  icebreaker: string;
  fullEmail: string;
}

export interface WebsiteItem {
  url: string;
  index: number;
}

export interface WebhookRequest {
  websites: WebsiteItem[];
  total_count: number;
  timestamp: string;
}

export interface WebhookResponse {
  results: OutreachResult[];
  processed: number;
  total: number;
}
