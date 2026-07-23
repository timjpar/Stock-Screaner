import type { Stock } from "./types";

/*
  A compact, representative slice of large-cap US equities used when no FMP key is
  configured (or the live API is unreachable / rate-limited). Values are an approximate
  snapshot for demonstration — clearly surfaced in the UI as "sample" data, never as live.

  Tuple order:
  [symbol, name, price, changePct, marketCap, pe, eps, beta, dividend, volume, sector, industry, exchange]
*/
type Row = [
  string, string, number, number, number, number | null, number,
  number, number, number, string, string, string,
];

const ROWS: Row[] = [
  // Technology
  ["AAPL", "Apple Inc.", 212.44, 1.2, 3.31e12, 32.9, 6.46, 1.25, 1.0, 52e6, "Technology", "Consumer Electronics", "NASDAQ"],
  ["MSFT", "Microsoft Corp.", 449.1, -0.4, 3.34e12, 38.0, 11.82, 0.9, 3.0, 22e6, "Technology", "Software—Infrastructure", "NASDAQ"],
  ["NVDA", "NVIDIA Corp.", 128.2, 2.6, 3.15e12, 68.0, 1.88, 1.68, 0.04, 240e6, "Technology", "Semiconductors", "NASDAQ"],
  ["AVGO", "Broadcom Inc.", 172.4, 0.9, 8.0e11, 62.0, 2.78, 1.1, 2.36, 25e6, "Technology", "Semiconductors", "NASDAQ"],
  ["ORCL", "Oracle Corp.", 142.1, -0.7, 3.9e11, 39.0, 3.64, 1.02, 1.6, 8e6, "Technology", "Software—Infrastructure", "NYSE"],
  ["CRM", "Salesforce Inc.", 265.3, 0.5, 2.55e11, 47.0, 5.64, 1.29, 1.6, 6e6, "Technology", "Software—Application", "NYSE"],
  ["ADBE", "Adobe Inc.", 560.2, -1.1, 2.5e11, 44.0, 12.73, 1.3, 0, 3e6, "Technology", "Software—Application", "NASDAQ"],
  ["AMD", "Advanced Micro Devices", 162.8, 1.8, 2.63e11, 200.0, 0.81, 1.7, 0, 55e6, "Technology", "Semiconductors", "NASDAQ"],
  ["INTC", "Intel Corp.", 31.2, -2.3, 1.33e11, null, -0.2, 1.05, 0.5, 45e6, "Technology", "Semiconductors", "NASDAQ"],
  ["CSCO", "Cisco Systems", 47.9, 0.2, 1.94e11, 20.0, 2.4, 0.85, 1.6, 18e6, "Technology", "Communication Equipment", "NASDAQ"],
  ["QCOM", "Qualcomm Inc.", 168.4, 0.6, 1.87e11, 22.0, 7.65, 1.3, 3.4, 9e6, "Technology", "Semiconductors", "NASDAQ"],
  ["TXN", "Texas Instruments", 196.7, -0.3, 1.79e11, 35.0, 5.62, 1.05, 5.44, 5e6, "Technology", "Semiconductors", "NASDAQ"],

  // Communication Services
  ["GOOGL", "Alphabet Inc.", 178.3, 0.8, 2.19e12, 27.0, 6.6, 1.05, 0.8, 26e6, "Communication Services", "Internet Content & Information", "NASDAQ"],
  ["META", "Meta Platforms", 512.6, 1.4, 1.3e12, 27.0, 18.99, 1.2, 2.0, 15e6, "Communication Services", "Internet Content & Information", "NASDAQ"],
  ["NFLX", "Netflix Inc.", 685.4, -0.6, 2.95e11, 43.0, 15.94, 1.28, 0, 4e6, "Communication Services", "Entertainment", "NASDAQ"],
  ["DIS", "Walt Disney Co.", 98.2, 0.3, 1.78e11, 38.0, 2.58, 1.4, 0.9, 10e6, "Communication Services", "Entertainment", "NYSE"],
  ["T", "AT&T Inc.", 19.1, 0.5, 1.37e11, 9.5, 2.01, 0.6, 1.11, 35e6, "Communication Services", "Telecom Services", "NYSE"],
  ["VZ", "Verizon Communications", 40.3, -0.2, 1.7e11, 9.0, 4.48, 0.4, 2.66, 18e6, "Communication Services", "Telecom Services", "NYSE"],
  ["TMUS", "T-Mobile US", 186.5, 0.7, 2.19e11, 24.0, 7.77, 0.55, 3.28, 4e6, "Communication Services", "Telecom Services", "NASDAQ"],

  // Consumer Cyclical
  ["AMZN", "Amazon.com Inc.", 185.2, 1.1, 1.93e12, 44.0, 4.21, 1.15, 0, 40e6, "Consumer Cyclical", "Internet Retail", "NASDAQ"],
  ["TSLA", "Tesla Inc.", 248.5, 3.2, 7.9e11, 62.0, 4.01, 2.3, 0, 95e6, "Consumer Cyclical", "Auto Manufacturers", "NASDAQ"],
  ["HD", "Home Depot Inc.", 355.8, -0.4, 3.53e11, 24.0, 14.83, 1.05, 9.0, 3e6, "Consumer Cyclical", "Home Improvement Retail", "NYSE"],
  ["MCD", "McDonald's Corp.", 258.6, 0.2, 1.86e11, 24.0, 10.78, 0.65, 6.68, 3e6, "Consumer Cyclical", "Restaurants", "NYSE"],
  ["NKE", "Nike Inc.", 75.4, -1.5, 1.13e11, 21.0, 3.59, 1.1, 1.48, 9e6, "Consumer Cyclical", "Footwear & Accessories", "NYSE"],
  ["SBUX", "Starbucks Corp.", 93.2, 0.6, 1.06e11, 25.0, 3.73, 1.0, 2.28, 8e6, "Consumer Cyclical", "Restaurants", "NASDAQ"],
  ["LOW", "Lowe's Companies", 245.1, -0.3, 1.4e11, 20.0, 12.26, 1.05, 4.4, 3e6, "Consumer Cyclical", "Home Improvement Retail", "NYSE"],

  // Consumer Defensive
  ["WMT", "Walmart Inc.", 68.9, 0.4, 5.54e11, 30.0, 2.3, 0.5, 0.83, 15e6, "Consumer Defensive", "Discount Stores", "NYSE"],
  ["PG", "Procter & Gamble", 167.4, 0.1, 3.94e11, 27.0, 6.2, 0.4, 4.03, 6e6, "Consumer Defensive", "Household & Personal Products", "NYSE"],
  ["KO", "Coca-Cola Co.", 62.8, 0.3, 2.71e11, 25.0, 2.51, 0.55, 1.94, 14e6, "Consumer Defensive", "Beverages—Non-Alcoholic", "NYSE"],
  ["PEP", "PepsiCo Inc.", 168.2, -0.2, 2.31e11, 24.0, 7.01, 0.5, 5.42, 5e6, "Consumer Defensive", "Beverages—Non-Alcoholic", "NASDAQ"],
  ["COST", "Costco Wholesale", 845.3, 0.7, 3.75e11, 52.0, 16.26, 0.75, 4.64, 2e6, "Consumer Defensive", "Discount Stores", "NASDAQ"],
  ["PM", "Philip Morris Intl.", 103.4, 0.5, 1.61e11, 18.0, 5.74, 0.65, 5.2, 6e6, "Consumer Defensive", "Tobacco", "NYSE"],

  // Healthcare
  ["LLY", "Eli Lilly and Co.", 895.2, 1.6, 8.5e11, 120.0, 7.46, 0.35, 5.2, 3e6, "Healthcare", "Drug Manufacturers—General", "NYSE"],
  ["UNH", "UnitedHealth Group", 512.4, -0.5, 4.72e11, 22.0, 23.29, 0.55, 8.4, 3e6, "Healthcare", "Healthcare Plans", "NYSE"],
  ["JNJ", "Johnson & Johnson", 148.6, 0.2, 3.58e11, 22.0, 6.75, 0.5, 4.76, 6e6, "Healthcare", "Drug Manufacturers—General", "NYSE"],
  ["ABBV", "AbbVie Inc.", 178.3, 0.4, 3.15e11, 60.0, 2.97, 0.65, 6.2, 5e6, "Healthcare", "Drug Manufacturers—General", "NYSE"],
  ["MRK", "Merck & Co.", 124.7, -0.3, 3.16e11, 21.0, 5.94, 0.4, 3.08, 8e6, "Healthcare", "Drug Manufacturers—General", "NYSE"],
  ["PFE", "Pfizer Inc.", 28.4, 0.6, 1.61e11, 30.0, 0.95, 0.65, 1.68, 30e6, "Healthcare", "Drug Manufacturers—General", "NYSE"],
  ["TMO", "Thermo Fisher Scientific", 585.1, -0.4, 2.24e11, 34.0, 17.21, 0.85, 1.56, 1.5e6, "Healthcare", "Diagnostics & Research", "NYSE"],
  ["ABT", "Abbott Laboratories", 108.2, 0.3, 1.88e11, 34.0, 3.18, 0.75, 2.2, 5e6, "Healthcare", "Medical Devices", "NYSE"],

  // Financial Services
  ["BRK-B", "Berkshire Hathaway B", 442.1, 0.3, 9.5e11, 22.0, 20.1, 0.85, 0, 4e6, "Financial Services", "Insurance—Diversified", "NYSE"],
  ["JPM", "JPMorgan Chase & Co.", 205.3, 0.5, 5.88e11, 12.0, 17.11, 1.1, 4.6, 8e6, "Financial Services", "Banks—Diversified", "NYSE"],
  ["V", "Visa Inc.", 268.4, 0.2, 5.3e11, 30.0, 8.95, 0.95, 2.08, 6e6, "Financial Services", "Credit Services", "NYSE"],
  ["MA", "Mastercard Inc.", 462.1, 0.4, 4.3e11, 36.0, 12.84, 1.05, 2.64, 3e6, "Financial Services", "Credit Services", "NYSE"],
  ["BAC", "Bank of America", 39.8, -0.6, 3.09e11, 13.0, 3.06, 1.35, 1.04, 35e6, "Financial Services", "Banks—Diversified", "NYSE"],
  ["WFC", "Wells Fargo & Co.", 59.2, 0.7, 2.03e11, 12.0, 4.93, 1.15, 1.4, 15e6, "Financial Services", "Banks—Diversified", "NYSE"],
  ["GS", "Goldman Sachs Group", 452.6, 0.9, 1.5e11, 16.0, 28.29, 1.3, 11.0, 2e6, "Financial Services", "Capital Markets", "NYSE"],

  // Industrials
  ["CAT", "Caterpillar Inc.", 335.2, -0.8, 1.62e11, 16.0, 20.95, 1.05, 5.64, 3e6, "Industrials", "Farm & Heavy Construction Machinery", "NYSE"],
  ["BA", "Boeing Co.", 178.4, -1.2, 1.09e11, null, -3.3, 1.5, 0, 6e6, "Industrials", "Aerospace & Defense", "NYSE"],
  ["HON", "Honeywell International", 208.6, 0.1, 1.37e11, 22.0, 9.48, 1.05, 4.32, 3e6, "Industrials", "Specialty Industrial Machinery", "NASDAQ"],
  ["UPS", "United Parcel Service", 132.1, -0.5, 1.13e11, 18.0, 7.34, 0.95, 6.52, 4e6, "Industrials", "Integrated Freight & Logistics", "NYSE"],
  ["GE", "GE Aerospace", 168.3, 1.0, 1.81e11, 40.0, 4.21, 1.2, 1.12, 5e6, "Industrials", "Aerospace & Defense", "NYSE"],
  ["RTX", "RTX Corp.", 118.4, 0.3, 1.58e11, 40.0, 2.96, 0.75, 2.52, 6e6, "Industrials", "Aerospace & Defense", "NYSE"],

  // Energy
  ["XOM", "Exxon Mobil Corp.", 114.2, 0.8, 5.08e11, 14.0, 8.16, 0.9, 3.8, 15e6, "Energy", "Oil & Gas Integrated", "NYSE"],
  ["CVX", "Chevron Corp.", 156.3, 0.6, 2.88e11, 15.0, 10.42, 1.05, 6.52, 8e6, "Energy", "Oil & Gas Integrated", "NYSE"],
  ["COP", "ConocoPhillips", 108.7, 1.1, 1.28e11, 13.0, 8.36, 1.1, 3.08, 6e6, "Energy", "Oil & Gas E&P", "NYSE"],
  ["SLB", "Schlumberger Ltd.", 43.2, 0.9, 6.1e10, 15.0, 2.88, 1.55, 1.1, 10e6, "Energy", "Oil & Gas Equipment & Services", "NYSE"],

  // Utilities
  ["NEE", "NextEra Energy", 73.1, 0.2, 1.5e11, 24.0, 3.05, 0.55, 2.06, 10e6, "Utilities", "Utilities—Regulated Electric", "NYSE"],
  ["DUK", "Duke Energy Corp.", 105.2, -0.1, 8.1e10, 19.0, 5.54, 0.45, 4.18, 3e6, "Utilities", "Utilities—Regulated Electric", "NYSE"],
  ["SO", "Southern Co.", 82.4, 0.3, 9.0e10, 20.0, 4.12, 0.5, 2.88, 4e6, "Utilities", "Utilities—Regulated Electric", "NYSE"],

  // Basic Materials
  ["LIN", "Linde plc", 462.3, 0.4, 2.21e11, 33.0, 14.01, 1.0, 5.7, 1.5e6, "Basic Materials", "Specialty Chemicals", "NASDAQ"],
  ["SHW", "Sherwin-Williams", 348.2, -0.2, 8.8e10, 34.0, 10.24, 1.1, 2.86, 1.5e6, "Basic Materials", "Specialty Chemicals", "NYSE"],
  ["FCX", "Freeport-McMoRan", 47.6, 1.3, 6.8e10, 33.0, 1.44, 1.75, 0.6, 12e6, "Basic Materials", "Copper", "NYSE"],

  // Real Estate
  ["PLD", "Prologis Inc.", 112.4, -0.4, 1.04e11, 36.0, 3.12, 1.05, 3.84, 4e6, "Real Estate", "REIT—Industrial", "NYSE"],
  ["AMT", "American Tower Corp.", 195.3, 0.2, 9.1e10, 42.0, 4.65, 0.85, 6.48, 3e6, "Real Estate", "REIT—Specialty", "NYSE"],
  ["SPG", "Simon Property Group", 152.1, 0.6, 5.7e10, 22.0, 6.91, 1.4, 8.0, 2e6, "Real Estate", "REIT—Retail", "NYSE"],
];

function toStock(r: Row): Stock {
  const [symbol, name, price, changePct, marketCap, pe, eps, beta, dividend, volume, sector, industry, exchange] = r;
  return {
    symbol,
    name,
    price,
    change: +(price * (changePct / 100)).toFixed(2),
    changePercent: changePct,
    marketCap,
    pe,
    eps,
    beta,
    dividend,
    dividendYield: dividend > 0 ? +((dividend / price) * 100).toFixed(2) : 0,
    volume,
    sector,
    industry,
    exchange,
  };
}

export const SAMPLE_UNIVERSE: Stock[] = ROWS.map(toStock);
