import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface InsightCardProps {
  title: string;
  icon: React.ReactElement<{ className?: string }>; // Updated type for icon
  isLoading: boolean;
  content?: string | string[];
  error?: string | null;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, icon, isLoading, content, error }) => {
  return (
    <div className="bg-slate-800 shadow-xl rounded-lg p-6 min-h-[200px] flex flex-col">
      <div className="flex items-center text-sky-400 mb-4">
        {/* The cast 'as React.ReactElement' is no longer needed due to more specific prop type */}
        {React.cloneElement(icon, { className: "w-7 h-7 mr-3" })}
        <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : content ? (
        <div className="text-slate-300 space-y-2 text-sm">
          {typeof content === 'string' ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <ul className="list-disc list-inside space-y-1">
              {content.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
         <p className="text-slate-400 italic text-sm">No data available. Enter a stock ticker to get insights.</p>
      )}
    </div>
  );
};

export default InsightCard;