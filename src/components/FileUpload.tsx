import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';

interface FileUploadProps {
  onUrlsExtracted: (urls: string[]) => void;
}

export const FileUpload = ({ onUrlsExtracted }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|txt)$/i)) {
      setError('Please upload a CSV, Excel, or text file');
      return;
    }

    setUploadedFile(file);

    try {
      const text = await file.text();
      const urls = extractUrls(text);

      if (urls.length === 0) {
        setError('No valid URLs found in the file');
        return;
      }

      onUrlsExtracted(urls);
    } catch (err) {
      setError('Failed to read file. Please try again.');
    }
  };

  const extractUrls = (text: string): string[] => {
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s,;"\'\n\r]*)?/g;
    const matches = text.match(urlPattern) || [];

    const urls = matches
      .map(url => {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return 'https://' + url;
        }
        return url;
      })
      .filter((url, index, self) => self.indexOf(url) === index);

    return urls;
  };

  const clearFile = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-kelpie-400 bg-kelpie-400/10'
            : 'border-gray-700 bg-gray-800/50 hover:border-kelpie-500 hover:bg-gray-800'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          {uploadedFile ? (
            <>
              <FileSpreadsheet className="w-10 h-10 text-kelpie-400" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">{uploadedFile.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400" />
              <div>
                <p className="text-gray-300 font-medium">
                  Drop your spreadsheet here or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports CSV, Excel (.xlsx, .xls), and text files
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
};
