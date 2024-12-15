// trends.js
import goodUpwardTrend from '../temp/good_upward_trend.json';
import goodDownwardTrend from '../temp/good_downward_trend.json';
import goodSideTrend from '../temp/good_side_trend.json';

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

const generateNewTrend = () => {
  const newTrends = {
    upTrend: generateStockPrices(100, 0.002, 0.1, 150),
    downTrend: generateStockPrices(100, -0.002, 0.1, 150),
    sideTrend: generateStockPrices(100, 0.0, 0.08, 150)
  };
  return newTrends;
};

const savedTrends = {
  upTrend: goodUpwardTrend,
  downTrend: goodDownwardTrend,
  sideTrend: goodSideTrend
};

export { savedTrends, generateStockPrices, generateNewTrend };
