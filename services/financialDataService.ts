import { HistoricalPricePoint, TimeRange } from '../types';

const FMP_API_KEY = 'C1FCXhlT4LtWtr7HJh43crxHM3NvrJVj'; // Using FMP's public demo key
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

interface FMPErrorResponse {
  "Error Message": string;
}

interface FMPHistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface FMPIntradayPrice {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// Helper to transform FMP data to our HistoricalPricePoint format
const transformFMPData = (data: FMPHistoricalPrice[] | FMPIntradayPrice[], isIntraday: boolean): HistoricalPricePoint[] => {
  return data
    .map(item => ({
      date: item.date, // FMP provides date in "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD"
      price: item.close,
    }))
    .reverse(); // FMP data often comes in reverse chronological order
};

export const fetchHistoricalStockData = async (
  ticker: string,
  range: TimeRange
): Promise<HistoricalPricePoint[]> => {
  let url = '';
  let isIntraday = false;

  switch (range) {
    case '1D':
      // FMP provides 1, 5, 15, 30 min, 1 hour. Let's use 1 hour for '1D'.
      // For demo key, intraday might be limited.
      // Example: https://financialmodelingprep.com/api/v3/historical-chart/1hour/AAPL?apikey=demo
      // This will return many days of hourly data, we'll need to filter for the last 24 hours (approx)
      url = `${FMP_BASE_URL}/historical-chart/1hour/${ticker.toUpperCase()}?apikey=${FMP_API_KEY}`;
      isIntraday = true;
      break;
    case '1W':
    case '1M':
    case '1Y':
    case '5Y':
      // Daily data
      // Example: https://financialmodelingprep.com/api/v3/historical-price-full/AAPL?apikey=demo
      // This returns a lot of data, we'll slice it based on range.
      url = `${FMP_BASE_URL}/historical-price-full/${ticker.toUpperCase()}?apikey=${FMP_API_KEY}`;
      break;
    default:
      throw new Error(`Time range ${range} is not supported yet.`);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorMsg = `Failed to fetch historical data: ${response.statusText}`;
      try {
        const errorData: FMPErrorResponse | any = await response.json();
        if (errorData && errorData["Error Message"]) {
            errorMsg = `FMP API Error: ${errorData["Error Message"]}`;
        }
      } catch (e) { /* ignore json parsing error for error message */ }
      throw new Error(errorMsg);
    }

    const data: any = await response.json();
    
    if (data["Error Message"]) {
        throw new Error(`FMP API Error: ${data["Error Message"]}`);
    }

    let historicalData: FMPHistoricalPrice[] | FMPIntradayPrice[];

    if (isIntraday) {
        // Data is directly an array of intraday points
        historicalData = data as FMPIntradayPrice[];
    } else {
        // Data is under a 'historical' key for daily
        if (!data.historical || !Array.isArray(data.historical)) {
            console.warn("Unexpected data structure for daily data:", data);
            return [];
        }
        historicalData = data.historical as FMPHistoricalPrice[];
    }
    
    if (!Array.isArray(historicalData) || historicalData.length === 0) {
        console.warn(`No historical data returned for ${ticker} with range ${range}. Data:`, historicalData);
        return [];
    }

    // Transform and slice data appropriately
    const transformedData = transformFMPData(historicalData, isIntraday);

    if (range === '1D') { // Get last ~24 hourly points if available
      return transformedData.slice(-24);
    }
    if (range === '1W') { // Approx 7 days
      return transformedData.slice(-7);
    }
    if (range === '1M') { // Approx 30 days
      return transformedData.slice(-30);
    }
    if (range === '1Y') { // Approx 252 trading days
      return transformedData.slice(-252);
    }
    if (range === '5Y') { // Approx 252 * 5 trading days
      return transformedData.slice(- (252 * 5));
    }
    
    return transformedData;

  } catch (error) {
    console.error(`Error fetching historical stock data for ${ticker} (${range}):`, error);
    throw error; // Re-throw to be caught by the component
  }
};
