
import React, { useState, useCallback } from 'react';
import { StockInsights, InsightFetchState, TimeRange } from './types';
import { fetchStockInsights } from './services/geminiService';
import StockInput from './components/StockInput';
import InsightCard from './components/InsightCard';
import MarketSentimentIcon from './components/icons/MarketSentimentIcon';
import PredictionIcon from './components/icons/PredictionIcon';
import RiskIcon from './components/icons/RiskIcon';
// import ChartIcon from './components/icons/ChartIcon'; // No longer needed for placeholder
import StockPriceChart from './components/StockPriceChart'; // New Chart Component

const App: React.FC = () => {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [insights, setInsights] = useState<StockInsights | null>(null);
  const [fetchState, setFetchState] = useState<InsightFetchState>(InsightFetchState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1M'); // Default time range

  const handleFetchInsights = useCallback(async (ticker: string) => {
    setSelectedStock(ticker);
    setFetchState(InsightFetchState.LOADING);
    setError(null);
    setInsights(null); 

    try {
      const fetchedInsights = await fetchStockInsights(ticker);
      setInsights(fetchedInsights);
      setFetchState(InsightFetchState.SUCCESS);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setFetchState(InsightFetchState.ERROR);
    }
  }, []);

  const isLoading = fetchState === InsightFetchState.LOADING;

  const getRecommendationColor = (recommendation?: "Buy" | "Hold" | "Sell"): string => {
    if (!recommendation) return "text-slate-400";
    switch (recommendation) {
      case "Buy":
        return "text-green-400";
      case "Hold":
        return "text-yellow-400";
      case "Sell":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-sky-400">
          StockSage<span className="text-slate-100">AI</span>
        </h1>
        <p className="text-slate-400 mt-2 text-lg">Your Intelligent Investment Co-Pilot</p>
      </header>

      <main className="w-full max-w-5xl">
        <StockInput onSubmit={handleFetchInsights} isLoading={isLoading} />

        {fetchState === InsightFetchState.IDLE && !selectedStock && (
          <div className="text-center text-slate-400 py-10">
            <p className="text-lg">Enter a stock ticker to get AI-powered insights.</p>
            <p className="text-sm">For example: AAPL, GOOGL, TSLA, MSFT</p>
          </div>
        )}

        {fetchState === InsightFetchState.ERROR && error && !insights && ( // Show general error only if no insights are partially loaded
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 text-center" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline ml-2">{error}</span>
            </div>
        )}
        
        {/* Stock Name and Chart - displayed only on success or if insights are partially available during error */}
        {(fetchState === InsightFetchState.SUCCESS || (fetchState === InsightFetchState.ERROR && insights)) && insights && selectedStock && (
          <div className="mb-8">
            <div className="p-6 bg-slate-800 shadow-xl rounded-lg mb-8">
              <h2 className="text-3xl font-bold text-sky-400 mb-1 flex items-baseline flex-wrap">
                {insights.stockName}
                <span className="text-2xl text-slate-400 ml-2">({selectedStock.toUpperCase()})</span>
              </h2>
               {insights.overallRecommendation && (
                <p className={`text-lg font-semibold ${getRecommendationColor(insights.overallRecommendation)} mt-1`}>
                  Overall Recommendation: {insights.overallRecommendation}
                </p>
              )}
              <p className="text-sm text-slate-500 mt-2 mb-4">AI-generated analysis summary.</p>
            </div>
            
            <StockPriceChart 
              ticker={selectedStock} 
              selectedTimeRange={selectedTimeRange}
              onTimeRangeChange={setSelectedTimeRange}
            />
          </div>
        )}

        {/* Insights Grid - displayed if loading, success, or error (when a stock has been selected) */}
        {(isLoading || (selectedStock && (fetchState === InsightFetchState.SUCCESS || fetchState === InsightFetchState.ERROR))) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InsightCard
              title="Market Sentiment"
              icon={<MarketSentimentIcon />}
              isLoading={isLoading}
              content={insights?.sentimentAnalysis}
              error={fetchState === InsightFetchState.ERROR && !insights?.sentimentAnalysis && selectedStock ? "Failed to load sentiment" : undefined}
            />
            <InsightCard
              title="Predictive Insights"
              icon={<PredictionIcon />}
              isLoading={isLoading}
              content={insights?.predictiveInsights}
              error={fetchState === InsightFetchState.ERROR && !insights?.predictiveInsights && selectedStock ? "Failed to load predictions" : undefined}
            />
            <InsightCard
              title="Risk Assessment"
              icon={<RiskIcon />}
              isLoading={isLoading}
              content={insights?.riskAssessment}
              error={fetchState === InsightFetchState.ERROR && !insights?.riskAssessment && selectedStock ? "Failed to load risk assessment" : undefined}
            />
            <InsightCard
              title="Medium-Term Outlook"
              icon={<PredictionIcon />} 
              isLoading={isLoading}
              content={insights?.mediumTermInvestment}
              error={fetchState === InsightFetchState.ERROR && !insights?.mediumTermInvestment && selectedStock ? "Failed to load M-T outlook" : undefined}
            />
            <InsightCard
              title="Long-Term Outlook"
              icon={<PredictionIcon />}
              isLoading={isLoading}
              content={insights?.longTermInvestment}
              error={fetchState === InsightFetchState.ERROR && !insights?.longTermInvestment && selectedStock ? "Failed to load L-T outlook" : undefined}
            />
             {/* Empty card for layout balance if needed, or another insight */}
            <div className="bg-slate-800 shadow-xl rounded-lg p-6 min-h-[200px] flex flex-col items-center justify-center text-slate-500 italic hidden lg:flex">
              Additional Insights (Future)
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} StockSageAI. All insights are AI-generated and for informational purposes only.</p>
        <p>This application does not provide financial advice. The 'Overall Recommendation' is an AI-generated summary based on its analysis and not a directive to trade.</p>
      </footer>
    </div>
  );
};

export default App;