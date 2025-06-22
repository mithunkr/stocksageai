
export interface StockInsights {
  stockName: string;
  sentimentAnalysis: string;
  predictiveInsights: string[];
  riskAssessment: string[];
  mediumTermInvestment: string;
  longTermInvestment: string;
  overallRecommendation: "Buy" | "Hold" | "Sell"; // Added this line
}

export enum InsightFetchState {
  IDLE = "IDLE",
  LOADING = "LOADING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export type TimeRange = "1D" | "1W" | "1M" | "1Y" | "5Y";

export interface HistoricalPricePoint {
  date: string; // ISO string format for dates
  price: number;
}