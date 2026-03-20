import { useState } from 'react';
import { Header } from './Header';
import { InputSection } from './InputSection';
import { ProgressBar } from './ProgressBar';
import { ResultsTable } from './ResultsTable';
import { OutreachResult } from '../types/outreach';
import { sendOutreachRequest } from '../services/webhook';

export const OutreachSystem = () => {
  const [results, setResults] = useState<OutreachResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleSubmit = async (websites: string[]) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: websites.length });

    try {
      const response = await sendOutreachRequest(websites);

      setResults(response.results || []);
      setProgress({
        current: response.processed || websites.length,
        total: response.total || websites.length,
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      <div
        className="absolute -right-[15%] top-1/2 -translate-y-1/2 w-[900px] h-[900px] opacity-40 pointer-events-none z-5"
        style={{
          backgroundImage: 'url(/Logo white.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'brightness(1.2) contrast(1.1)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <Header />

        <InputSection onSubmit={handleSubmit} isLoading={isLoading} error={error} />

        {isLoading && <ProgressBar current={progress.current} total={progress.total} />}

        <ResultsTable results={results} />
      </div>
    </div>
  );
};
