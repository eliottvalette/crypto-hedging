// trends.js
const generateStockPrices = (startPrice, drift, volatility, count) => {
  const data = [];
  let previousClose = startPrice;

  for (let i = 0; i < count; i++) {
    // Generate random change using GBM formula
    const randomShock = (Math.random() - 0.5) * volatility;
    const priceChange = drift + randomShock;
    const close = parseFloat((previousClose * (1 + priceChange)).toFixed(2));

    const open = previousClose;
    const high = parseFloat(Math.max(open, close).toFixed(2));
    const low = parseFloat(Math.min(open, close).toFixed(2));

    data.push({
      x: i + 1,
      y:[open,high,low,close]
    });

    previousClose = close;
  }

  return data;
};


const upTrend = generateStockPrices(100, 0.004, 0.4, 100); // Upward trend
const downTrend = generateStockPrices(100, -0.004, 0.4, 100); // Downward trend
const sideTrend = generateStockPrices(100, 0, 0.4, 100); // Sideways trend

export default { upTrend, downTrend, sideTrend };
