import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Search, Copy, CheckCircle } from 'lucide-react';
import { FailedScrape } from '../../types/nessie';
import { getFailedScrapes, retryFailedScrape } from '../../services/nessie';
import { getRelativeTime } from '../../utils/time';

type StatusFilter = 'All' | 'Failed' | 'Retrying' | 'Resolved';
type TimeFilter = '24h' | '7d' | '30d' | 'All';

export const FailedWebsitesPage = () => {
  const [scrapes, setScrapes] = useState<FailedScrape[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Failed');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchScrapes = async () => {
    setLoading(true);
    try {
      const data = await getFailedScrapes({
        status: statusFilter,
        timeFilter,
        search: searchQuery,
      });
      setScrapes(data);
    } catch (error) {
      console.error('Failed to fetch scrapes:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScrapes();
  }, [statusFilter, timeFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchScrapes();
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRetry = async (website: string, batch_id: string) => {
    const key = `${website}-${batch_id}`;
    setRetryingIds(prev => new Set(prev).add(key));

    setScrapes(prev =>
      prev.map(s =>
        s.website === website && s.batch_id === batch_id
          ? { ...s, status: 'retrying' }
          : s
      )
    );

    try {
      const result = await retryFailedScrape(website, batch_id);
      if (result.success) {
        showToast('Retry request sent successfully', 'success');
        await fetchScrapes();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showToast(`Failed to retry: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setScrapes(prev =>
        prev.map(s =>
          s.website === website && s.batch_id === batch_id
            ? { ...s, status: 'failed' }
            : s
        )
      );
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'failed':
        return 'bg-red-600';
      case 'retrying':
        return 'bg-amber-600 animate-pulse';
      case 'resolved':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-100 flex items-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-500" />
            Nessie – Failed Websites
          </h1>
          <p className="text-gray-400 mt-2">Monitor and retry failed website scrapes</p>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search website..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All</option>
              <option>Failed</option>
              <option>Retrying</option>
              <option>Resolved</option>
            </select>

            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as TimeFilter)}
              className="px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="All">All time</option>
            </select>

            <button
              onClick={fetchScrapes}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading && scrapes.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-12 text-center">
            <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading failed websites...</p>
          </div>
        ) : scrapes.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-100 mb-2">Zero failures in the selected window 🥳</h3>
            <p className="text-gray-400">All systems are running smoothly!</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Website</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Batch</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Attempts</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Last Error</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {scrapes.map(scrape => (
                    <tr key={scrape.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <a
                          href={scrape.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {scrape.website}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 font-mono text-sm">{scrape.batch_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(
                            scrape.status
                          )}`}
                        >
                          {scrape.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">{scrape.attempts}</span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div
                          className="text-gray-400 text-sm truncate"
                          title={scrape.error_message || 'No error message'}
                        >
                          {scrape.error_message || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">{getRelativeTime(scrape.timestamp)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRetry(scrape.website, scrape.batch_id)}
                            disabled={retryingIds.has(`${scrape.website}-${scrape.batch_id}`) || scrape.status === 'retrying'}
                            className="px-3 py-1 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Retry
                          </button>
                          <button
                            onClick={() => copyToClipboard(scrape.website)}
                            className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                            title="Copy website URL"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {toast && (
          <div
            className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white font-semibold animate-slide-in`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};
