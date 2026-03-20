interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-100">Processing Progress</h3>
        <span className="text-sm font-medium text-kelpie-400">
          {current} / {total} completed
        </span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-kelpie-500 to-kelpie-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Generating personalized outreach emails...
      </p>
    </div>
  );
};
