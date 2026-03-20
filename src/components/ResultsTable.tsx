import { Download } from 'lucide-react';
import { OutreachResult } from '../types/outreach';
import { downloadCSV } from '../utils/csv';

interface ResultsTableProps {
  results: OutreachResult[];
}

export const ResultsTable = ({ results }: ResultsTableProps) => {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-100">
          Outreach Results ({results.length})
        </h2>
        <button
          onClick={() => downloadCSV(results)}
          className="flex items-center gap-2 px-4 py-2 bg-kelpie-600 text-white font-semibold rounded-xl hover:bg-kelpie-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Download className="w-5 h-5" />
          Download CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-700">
              <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                Company / Domain
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                Industry
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                Contact Name
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                Email
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                Icebreaker
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                Full Email
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr
                key={index}
                className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
              >
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-gray-100">{result.company}</div>
                    <div className="text-xs text-gray-500 mt-1">{result.domain}</div>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-300">
                  {result.industry}
                </td>
                <td className="py-4 px-4 text-sm text-gray-300">
                  {result.contactName}
                </td>
                <td className="py-4 px-4">
                  <a
                    href={`mailto:${result.email}`}
                    className="text-sm text-kelpie-400 hover:text-kelpie-300 underline"
                  >
                    {result.email}
                  </a>
                </td>
                <td className="py-4 px-4 text-sm text-gray-300 max-w-xs">
                  <div className="line-clamp-3">{result.icebreaker}</div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-300 max-w-md">
                  <div className="line-clamp-4">{result.fullEmail}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
