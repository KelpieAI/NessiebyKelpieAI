import { Code, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export const DocsPage = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const webhookUrl = `${supabaseUrl}/functions/v1/scrape-failed`;
  const successUrl = `${supabaseUrl}/functions/v1/scrape-success`;

  const failureExample = `{
  "event": "scrape_failed",
  "source": "make_scrapeninja",
  "timestamp": "2025-10-20T10:30:00.000Z",
  "website": "https://example.com",
  "error_code": "TIMEOUT",
  "error_message": "Request timed out after 30 seconds",
  "batch_id": "batch_12345",
  "attempt": 1
}`;

  const successExample = `{
  "website": "https://example.com",
  "batch_id": "batch_12345",
  "timestamp": "2025-10-20T10:35:00.000Z"
}`;

  const failureCurl = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Nessie-Secret: *****" \\
  -d '${failureExample.replace(/\n/g, ' ')}'`;

  const successCurl = `curl -X POST ${successUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Nessie-Secret: *****" \\
  -d '${successExample.replace(/\n/g, ' ')}'`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-100 flex items-center gap-3">
            <Code className="w-10 h-10 text-blue-500" />
            Nessie API Documentation
          </h1>
          <p className="text-gray-400 mt-2">Webhook endpoints for failed scrape ingestion</p>
        </div>

        <div className="space-y-6">
          <section className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Authentication</h2>
            <p className="text-gray-300 mb-4">
              All webhook requests must include the <code className="bg-gray-900 px-2 py-1 rounded text-blue-400">X-Nessie-Secret</code> header with your secret key.
            </p>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <code className="text-gray-300">X-Nessie-Secret: *****</code>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Contact your administrator for the secret key value.
            </p>
          </section>

          <section className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">POST /webhooks/scrape-failed</h2>
            <p className="text-gray-300 mb-4">Report a failed website scrape attempt.</p>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Endpoint URL</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <code className="text-blue-400 break-all">{webhookUrl}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(webhookUrl, 'webhook-url')}
                  className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {copied === 'webhook-url' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Required Fields</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400">event</code>: Must be "scrape_failed"</li>
                <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400">source</code>: String identifying the source system</li>
                <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400">timestamp</code>: ISO 8601 timestamp</li>
                <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400">website</code>: The URL that failed</li>
                <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400">error_code</code>: Error code (string or number)</li>
                <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400">error_message</code>: Human-readable error description</li>
                <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400">batch_id</code>: Unique identifier for the batch</li>
                <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400">attempt</code> (optional): Attempt number</li>
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Example JSON Payload</h3>
              <div className="relative">
                <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{failureExample}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(failureExample, 'failure-json')}
                  className="absolute top-2 right-2 p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {copied === 'failure-json' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Example cURL Request</h3>
              <div className="relative">
                <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{failureCurl}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(failureCurl, 'failure-curl')}
                  className="absolute top-2 right-2 p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {copied === 'failure-curl' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Response</h3>
              <p className="text-gray-300 mb-2">
                <span className="text-green-400 font-semibold">202 Accepted:</span> Request processed successfully
              </p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <code className="text-gray-300">{'{ "ok": true }'}</code>
              </div>
              <p className="text-gray-300 mt-4 mb-2">
                <span className="text-red-400 font-semibold">401 Unauthorized:</span> Invalid or missing secret
              </p>
              <p className="text-gray-300 mb-2">
                <span className="text-red-400 font-semibold">400 Bad Request:</span> Missing required fields or invalid event type
              </p>
            </div>
          </section>

          <section className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">POST /webhooks/scrape-success</h2>
            <p className="text-gray-300 mb-4">Report a successful website scrape attempt.</p>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Endpoint URL</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <code className="text-blue-400 break-all">{successUrl}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(successUrl, 'success-url')}
                  className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {copied === 'success-url' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Required Fields</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400">website</code>: The URL that was successfully scraped</li>
                <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400">batch_id</code>: The batch identifier</li>
                <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400">timestamp</code> (optional): ISO 8601 timestamp of success</li>
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Behavior</h3>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>If the website was <strong>never failed</strong>, it will be marked as <code className="bg-gray-800 px-2 py-1 rounded text-green-400">success</code></li>
                  <li>If the website was <strong>previously failed</strong>, it will be marked as <code className="bg-gray-800 px-2 py-1 rounded text-blue-400">resolved</code></li>
                  <li>The system automatically determines the appropriate status based on failure history</li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Example JSON Payload</h3>
              <div className="relative">
                <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{successExample}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(successExample, 'success-json')}
                  className="absolute top-2 right-2 p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {copied === 'success-json' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Example cURL Request</h3>
              <div className="relative">
                <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{successCurl}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(successCurl, 'success-curl')}
                  className="absolute top-2 right-2 p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {copied === 'success-curl' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Response</h3>
              <p className="text-gray-300 mb-2">
                <span className="text-green-400 font-semibold">200 OK:</span> Scrape marked as successful
              </p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
                <code className="text-gray-300">{'{ "ok": true, "status": "success", "message": "Scrape marked as successful" }'}</code>
              </div>
              <p className="text-gray-300 mb-2">
                <span className="text-green-400 font-semibold">200 OK:</span> Previously failed scrape marked as resolved
              </p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
                <code className="text-gray-300">{'{ "ok": true, "status": "resolved", "message": "Previously failed scrape marked as resolved" }'}</code>
              </div>
              <p className="text-gray-300 mb-2">
                <span className="text-red-400 font-semibold">409 Conflict:</span> Duplicate entry (already marked as successful)
              </p>
              <p className="text-gray-300 mb-2">
                <span className="text-red-400 font-semibold">401 Unauthorized:</span> Invalid or missing secret
              </p>
              <p className="text-gray-300 mb-2">
                <span className="text-red-400 font-semibold">400 Bad Request:</span> Missing required fields
              </p>
            </div>
          </section>

          <section className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Behavior Notes</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>The system uses a composite unique key on (website + batch_id) for both failed and successful scrapes</li>
              <li>If a failed record with the same website and batch_id already exists, the attempt counter is incremented</li>
              <li>All timestamps are stored in ISO 8601 UTC format</li>
              <li>Failed scrape status can be: "failed", "retrying", or "resolved"</li>
              <li>Successful scrape status can be: "success" (never failed) or "resolved" (recovered from failure)</li>
              <li>Retry requests can be triggered from the Nessie UI dashboard</li>
              <li>When a successful scrape is reported, the system automatically checks failure history to determine the correct status</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
