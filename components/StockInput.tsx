
import React, { useState } from 'react';
import SearchIcon from './icons/SearchIcon';

interface StockInputProps {
  onSubmit: (ticker: string) => void;
  isLoading: boolean;
}

const StockInput: React.FC<StockInputProps> = ({ onSubmit, isLoading }) => {
  const [ticker, setTicker] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      onSubmit(ticker.trim().toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-8 w-full max-w-lg mx-auto">
      <input
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        placeholder="Enter stock ticker (e.g., AAPL, MSFT)"
        className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none placeholder-slate-400"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !ticker.trim()}
        className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-500 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        ) : (
          <>
            <SearchIcon className="w-5 h-5 mr-2" />
            Get Insights
          </>
        )}
      </button>
    </form>
  );
};

export default StockInput;
