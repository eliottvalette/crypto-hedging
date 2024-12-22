// trends.js
const generateStockPrices = (startPrice, drift, volatility, count) => {
  const data = [];
  let previousClose = startPrice;
  let previousSign = 0 
  let synergy = drift/2
  let magnitude = 0

  for (let i = 0; i < count; i++) {
    // Generate random change using GBM formula
    magnitude = previousSign === 1 ? (Math.random() - 0.5 + drift + synergy) : (Math.random() - 0.5 - drift - synergy)
    previousSign = magnitude > 0 ? 1 : -1 
    const randomShock = magnitude * volatility;
    const priceChange = drift + randomShock;
    const close = parseFloat((previousClose * (1 + priceChange)));

    const open = previousClose;
    const high = parseFloat((Math.max(open,close) + (Math.max(open,close)-Math.min(open,close))*(Math.random()**(1/2))));
    const low = parseFloat((Math.min(open,close) - (Math.max(open,close)-Math.min(open,close))*(Math.random()**(1/2))));

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
    upTrend: generateStockPrices(100, 0.002, 0.06, 150),
    downTrend: generateStockPrices(100, -0.002, 0.06, 150),
    sideTrend: generateStockPrices(100, 0.0, 0.04, 150)
  };
  return newTrends;
};

const savedTrends = {
  upTrend: generateStockPrices(100, 0.002, 0.1, 150),
  downTrend: generateStockPrices(100, -0.002, 0.1, 150),
  sideTrend: generateStockPrices(100, 0.0, 0.08, 150)
};

export { savedTrends, generateNewTrend };
