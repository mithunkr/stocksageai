
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { StockInsights } from "../types";
import { GEMINI_MODEL_NAME } from "../constants";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set. Please set it to use the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generatePrompt = (stockTicker: string): string => `
Provide a comprehensive analysis for the stock ticker ${stockTicker.toUpperCase()}.
Your response MUST be a single, valid JSON object. Do not include any text, comments, or markdown formatting (like \`\`\`json) outside of this JSON object.
All property names (keys) and string values within the JSON object MUST be enclosed in double quotes (e.g., "key": "value").
Ensure there are no trailing commas.

The JSON object should conform to the following structure and content guidelines:
{
  "stockName": "string - The full official name of the company (e.g., \"Apple Inc.\", \"Microsoft Corporation\").",
  "sentimentAnalysis": "string - A concise paragraph describing market sentiment (e.g., bullish, bearish, neutral) and its key driving factors. Consider hypothetical recent news, social media trends, and overall market conditions.",
  "predictiveInsights": [
    "string - A potential price trend or key support/resistance level for the next week.",
    "string - Another distinct insight, catalyst, or risk for the next week."
  ],
  "riskAssessment": [
    "string - A main risk factor based on historical volatility, sector, or company specifics.",
    "string - Another distinct risk factor."
  ],
  "mediumTermInvestment": "string - A general outlook for medium-term investment (approximately 3-12 months), with brief reasoning (1-2 sentences). Example: \"Favorable outlook if market conditions improve; consider accumulation on dips.\"",
  "longTermInvestment": "string - A general outlook for long-term investment (approximately 1-5 years), with brief reasoning (1-2 sentences). Example: \"Strong long-term growth potential if key strategic initiatives succeed.\"",
  "overallRecommendation": "string - MUST be one of 'Buy', 'Hold', or 'Sell'. This recommendation should be based on a holistic consideration of all the above factors (sentiment, predictions, risks, medium/long term outlook)."
}

For example, for a hypothetical stock ticker "ACME" representing "Acme Innovations Ltd.", the JSON response should look like this:
{
  "stockName": "Acme Innovations Ltd.",
  "sentimentAnalysis": "Current sentiment for ACME is cautiously optimistic. Positive product announcements are balanced by concerns over increased sector competition and broader economic uncertainty. Social media discussion is moderately positive.",
  "predictiveInsights": [
    "ACME may attempt to breach the $210 resistance level in the coming week if overall market sentiment remains positive.",
    "The upcoming quarterly earnings report, expected on MM/DD/YYYY, will be a significant catalyst."
  ],
  "riskAssessment": [
    "High reliance on a key supplier for critical components presents a notable operational risk.",
    "The company faces increasing competition from new entrants in its primary market, which could impact future market share."
  ],
  "mediumTermInvestment": "The medium-term outlook appears neutral to slightly positive. Success will depend on the market adoption of their new product line and navigating supply chain pressures effectively. Monitor upcoming financial reports.",
  "longTermInvestment": "ACME has strong long-term growth prospects if it can successfully execute its international expansion strategy and maintain its innovation lead. The evolving regulatory landscape is a factor to watch.",
  "overallRecommendation": "Hold"
}

Please generate this JSON object for the stock ticker: ${stockTicker.toUpperCase()}.
Ensure the "predictiveInsights" array contains 2 to 3 distinct string points.
Ensure the "riskAssessment" array contains 2 to 3 distinct string points.
The "overallRecommendation" must be exactly 'Buy', 'Hold', or 'Sell'.
IMPORTANT: The information provided should be general and for informational purposes only. It MUST NOT constitute financial advice or specific buy/sell recommendations, even with the 'overallRecommendation' field. The 'overallRecommendation' is an AI-generated summary of its own analysis.
Maintain a factual, objective, and neutral tone. Keep all descriptions concise yet well-reasoned.
`;


export const fetchStockInsights = async (stockTicker: string): Promise<StockInsights> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: generatePrompt(stockTicker),
      config: {
        responseMimeType: "application/json",
        temperature: 0.5, 
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as StockInsights;

    // Basic validation for presence of key fields
    if (
      !parsedData.stockName || typeof parsedData.stockName !== 'string' ||
      !parsedData.sentimentAnalysis || typeof parsedData.sentimentAnalysis !== 'string' ||
      !Array.isArray(parsedData.predictiveInsights) || !parsedData.predictiveInsights.every(item => typeof item === 'string') ||
      !Array.isArray(parsedData.riskAssessment) || !parsedData.riskAssessment.every(item => typeof item === 'string') ||
      !parsedData.mediumTermInvestment || typeof parsedData.mediumTermInvestment !== 'string' ||
      !parsedData.longTermInvestment || typeof parsedData.longTermInvestment !== 'string' ||
      !parsedData.overallRecommendation || !["Buy", "Hold", "Sell"].includes(parsedData.overallRecommendation) // Validate overallRecommendation
    ) {
      console.error("Malformed data structure received or missing/invalid fields:", parsedData);
      throw new Error("Received malformed or incomplete data structure from API.");
    }
    
    return parsedData;

  } catch (error) {
    console.error("Error fetching stock insights:", error);
    if (error instanceof SyntaxError) { // Specifically catch JSON parsing errors
        console.error("Failed to parse JSON response:", error.message);
        console.error("Raw response text (if available and parse failed):", (error as any).sourceText || "N/A"); // Attempt to log raw text if possible
        throw new Error(`Failed to parse insights from Gemini API due to invalid JSON format: ${error.message}`);
    }
    if (error instanceof Error) {
        throw new Error(`Failed to fetch insights from Gemini API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching insights.");
  }
};