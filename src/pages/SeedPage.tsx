import { useState } from 'react';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const SeedPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [secretInput, setSecretInput] = useState('');

  const handleAuthorize = () => {
    if (secretInput === 'dev-seed-access') {
      setAuthorized(true);
      setMessage({ text: 'Authorized! You can now seed test data.', type: 'success' });
    } else {
      setMessage({ text: 'Invalid secret. Access denied.', type: 'error' });
    }
  };

  const seedTestData = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const testData = [
        {
          website: 'https://test-failed-1.com',
          batch_id: 'test_batch_001',
          timestamp: new Date().toISOString(),
          error_code: 'TIMEOUT',
          error_message: 'Request timed out after 30 seconds',
          attempts: 1,
          status: 'failed',
          last_updated: new Date().toISOString(),
        },
        {
          website: 'https://test-failed-2.com',
          batch_id: 'test_batch_002',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          error_code: '404',
          error_message: 'Page not found - website may have moved or been deleted',
          attempts: 3,
          status: 'failed',
          last_updated: new Date().toISOString(),
        },
      ];

      const { error } = await supabase
        .from('failed_scrapes')
        .insert(testData);

      if (error) {
        throw new Error(error.message);
      }

      setMessage({
        text: 'Successfully seeded 2 test records!',
        type: 'success',
      });
    } catch (error) {
      setMessage({
        text: `Failed to seed data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-100 mb-4 flex items-center gap-2">
            <Database className="w-8 h-8 text-blue-500" />
            Developer Seed Page
          </h1>
          <p className="text-gray-400 mb-6">
            This page is restricted to developers. Please enter the Nessie secret to continue.
          </p>

          <input
            type="password"
            placeholder="Enter dev seed password"
            value={secretInput}
            onChange={e => setSecretInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleAuthorize()}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <p className="text-sm text-gray-500 mb-4">Hint: dev-seed-access</p>

          <button
            onClick={handleAuthorize}
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Authorize
          </button>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-100 flex items-center gap-3">
            <Database className="w-10 h-10 text-blue-500" />
            Developer Seed Page
          </h1>
          <p className="text-gray-400 mt-2">Insert test data for UI development and testing</p>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">Seed Test Records</h2>
          <p className="text-gray-300 mb-6">
            This will insert 2 test failed scrape records into the database for UI testing purposes.
          </p>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">Test Data Preview</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <span className="font-semibold text-blue-400">Record 1:</span> test-failed-1.com - TIMEOUT error, 1 attempt
              </li>
              <li>
                <span className="font-semibold text-blue-400">Record 2:</span> test-failed-2.com - 404 error, 3 attempts
              </li>
            </ul>
          </div>

          <button
            onClick={seedTestData}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Seed Test Data
              </>
            )}
          </button>

          {message && (
            <div
              className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-900 border border-green-700 text-green-200'
                  : 'bg-red-900 border border-red-700 text-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        <div className="mt-6 bg-amber-900 border border-amber-700 rounded-lg p-4">
          <p className="text-amber-200 text-sm">
            <strong>Warning:</strong> This page should only be used in development. Never expose this functionality in production.
          </p>
        </div>
      </div>
    </div>
  );
};
