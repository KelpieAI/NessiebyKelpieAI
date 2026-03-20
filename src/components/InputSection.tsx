import { AlertCircle, Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { FileUpload } from './FileUpload';

interface InputSectionProps {
  onSubmit: (websites: string[]) => void;
  isLoading: boolean;
  error: string | null;
}

export const InputSection = ({ onSubmit, isLoading, error }: InputSectionProps) => {
  const [input, setInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleUrlsExtracted = (urls: string[]) => {
    const urlsText = urls.slice(0, 25).join('\n');
    setInput(urlsText);
    setLocalError(null);
  };

  const handleSubmit = () => {
    setLocalError(null);

    let websites = input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (websites.length === 0) {
      setLocalError('Please enter at least one website');
      return;
    }

    if (websites.length > 25) {
      setLocalError('Maximum 25 websites allowed');
      return;
    }

    const urlPattern = /^https?:\/\//i;
    websites = websites.map(url => {
      if (!urlPattern.test(url)) {
        return `https://${url}`;
      }
      return url;
    });

    onSubmit(websites);
  };

  const lineCount = input.split('\n').filter(line => line.trim().length > 0).length;
  const isAtLimit = lineCount >= 25;

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newLineCount = newValue.split('\n').filter(line => line.trim().length > 0).length;

    if (newLineCount <= 25) {
      setInput(newValue);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 mb-8">
      <label htmlFor="websites" className="block text-lg font-semibold text-gray-100 mb-3">
        Company Websites
      </label>
      <p className="text-sm text-gray-400 mb-4">
        Enter up to 25 company websites, one per line. https:// will be added automatically if missing.
      </p>

      <div className="mb-4">
        <FileUpload onUrlsExtracted={handleUrlsExtracted} />
      </div>

      <textarea
        id="websites"
        value={input}
        onChange={handleTextareaChange}
        placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"
        className="w-full h-64 px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-kelpie-500 focus:border-transparent resize-none font-mono text-sm"
        disabled={isLoading}
      />

      <div className="flex items-center justify-between mt-4">
        <div className={`text-sm ${isAtLimit ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
          {lineCount} / 25 websites
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading || input.trim().length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-kelpie-600 text-white font-semibold rounded-xl hover:bg-kelpie-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Run Outreach
            </>
          )}
        </button>
      </div>

      {(localError || error) && (
        <div className="mt-4 flex items-start gap-2 p-4 bg-red-950 border border-red-800 rounded-xl text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{localError || error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4 italic">
        Your data isn't stored — it's processed securely via Kelpie's AI system.
      </p>
    </div>
  );
};
