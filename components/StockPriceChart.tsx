
import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale, // Import TimeScale
  type TimeUnit, // Import TimeUnit type
} from 'chart.js';
import 'chart.js/auto'; // Ensure all controllers, elements, scales, and plugins are registered
import 'chartjs-adapter-date-fns'; // Import the date adapter

import { HistoricalPricePoint, TimeRange } from '../types';
import { fetchHistoricalStockData } from '../services/financialDataService';
import LoadingSpinner from './LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale, // Register TimeScale
  Title,
  Tooltip,
  Legend
);

interface StockPriceChartProps {
  ticker: string;
  selectedTimeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const timeRanges: TimeRange[] = ["1D", "1W", "1M", "1Y", "5Y"];

const StockPriceChart: React.FC<StockPriceChartProps> = ({ ticker, selectedTimeRange, onTimeRangeChange }) => {
  const [chartData, setChartData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChartData = async () => {
      if (!ticker) return;
      setIsLoading(true);
      setError(null);
      setChartData(null); 
      try {
        const historicalData = await fetchHistoricalStockData(ticker, selectedTimeRange);

        if (historicalData.length === 0) {
          setError('No historical data available for this stock or time range from the provider.');
          setChartData(null);
        } else {
          setChartData({
            labels: historicalData.map(d => d.date),
            datasets: [
              {
                label: `${ticker.toUpperCase()} Price`,
                data: historicalData.map(d => d.price),
                borderColor: 'rgb(56, 189, 248)', // sky-400
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                tension: 0.1,
                pointRadius: selectedTimeRange === '1D' || selectedTimeRange === '1W' ? 2 : 0,
                pointBackgroundColor: 'rgb(56, 189, 248)',
                fill: true,
              },
            ],
          });
        }
      } catch (e) {
        console.error(`Error fetching chart data for ${ticker} (${selectedTimeRange}):`, e);
        let displayError = e instanceof Error ? e.message : "Failed to load chart data.";
        if (displayError.includes("FMP API Error: Invalid API KEY") || displayError.includes("Invalid API KEY")) {
            displayError = "FMP API Error: The 'demo' API key is invalid or restricted. It may not support all stock tickers or may have daily limits. Try common tickers like AAPL, or verify FMP's demo key policy.";
        } else if (displayError.includes("No historical data returned")) {
            displayError = `No historical data found for ${ticker} with range ${selectedTimeRange}. The ticker might be invalid or delisted, or data may not be available from the provider for this specific query.`;
        }
        setError(displayError);
        setChartData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadChartData();
  }, [ticker, selectedTimeRange]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Historical Price for ${ticker.toUpperCase()} (${selectedTimeRange}) - Market Data (Demo)`,
        color: '#e2e8f0', // slate-200
        font: {
          size: 16,
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: (selectedTimeRange === '1D' ? 'hour' : 
                 selectedTimeRange === '1W' ? 'day' : 
                 selectedTimeRange === '1M' ? 'day' : 
                 selectedTimeRange === '1Y' ? 'month' :
                 'year') as TimeUnit,
          tooltipFormat: 'MMM d, yyyy HH:mm',
           displayFormats: {
            hour: 'HH:mm',
            day: 'MMM d',
            week: 'MMM d, yy',
            month: 'MMM yyyy',
            year: 'yyyy'
          }
        },
        grid: {
          color: 'rgba(71, 85, 105, 0.5)', 
        },
        ticks: {
          color: '#94a3b8', 
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: selectedTimeRange === '1D' ? 8 : (selectedTimeRange === '1W' || selectedTimeRange === '1M') ? 7 : 10,
        },
      },
      y: {
        grid: {
          color: 'rgba(71, 85, 105, 0.5)', 
        },
        ticks: {
          color: '#94a3b8', 
          callback: function(value: any) {
            if (typeof value === 'number') {
              return '$' + value.toFixed(2);
            }
            return value;
          }
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  }), [ticker, selectedTimeRange]);


  return (
    <div className="bg-slate-800 shadow-xl rounded-lg p-4 md:p-6">
      <div className="mb-4 flex flex-wrap justify-center md:justify-start gap-2">
        {timeRanges.map(range => (
          <button
            key={range}
            onClick={() => onTimeRangeChange(range)}
            disabled={isLoading}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
              ${selectedTimeRange === range 
                ? 'bg-sky-600 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {range}
          </button>
        ))}
      </div>
      <div className="h-64 md:h-80 lg:h-96 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 z-10">
            <LoadingSpinner />
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center">
            <p className="font-semibold">Error Loading Chart:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!isLoading && !error && chartData && (
          <Line options={chartOptions as any} data={chartData} />
        )}
         {!isLoading && !error && !chartData && ( 
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <p>No chart data available for the selected stock/range.</p>
            </div>
        )}
      </div>
       <p className="text-xs text-slate-500 mt-3 text-center md:text-right">
        Note: Price data is fetched from Financial Modeling Prep using a demo API key. Data may be limited or delayed. For educational purposes only.
      </p>
    </div>
  );
};

export default StockPriceChart;
