// trends.js
const generateStockPrices = (startPrice, drift, volatility, count) => {
  const data = [];
  let previousClose = startPrice;

  for (let i = 0; i < count; i++) {
    // Generate random change using GBM formula
    const randomShock = (Math.random() - 0.5) * volatility;
    const priceChange = drift + randomShock;
    const close = parseFloat((previousClose * (1 + priceChange)).toFixed(4));

    const open = previousClose;
    const high = parseFloat((Math.max(open,close) + (Math.max(open,close)-Math.min(open,close))*(Math.random()**(1/2))).toFixed(4));
    const low = parseFloat((Math.min(open,close) - (Math.max(open,close)-Math.min(open,close))*(Math.random()**(1/2))).toFixed(4));

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
  upTrend: generateStockPrices(100, 0.002, 0.1, 150),
  downTrend: generateStockPrices(100, -0.002, 0.1, 150),
  sideTrend: generateStockPrices(100, 0.0, 0.08, 150)
};

export { savedTrends, generateNewTrend };
