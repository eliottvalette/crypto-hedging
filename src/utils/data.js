import axios from 'axios';

export async function getAvailableSymbols() {
  const url = 'https://api.binance.com/api/v3/exchangeInfo';

  try {
    const response = await axios.get(url);
    const symbols = response.data.symbols.map((symbol) => symbol.symbol);
    console.log('Available symbols (binance):', symbols);
    return symbols;
  } catch (error) {
    console.error('Error retrieving available symbols from binance:', error.message);
    return [];
  }
}

export async function getSpotPrice(symbol) {
  if (symbol === 'HYPEUSDT') {
    const coingeckoUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=hype&vs_currencies=usd';

    try {
      const response = await axios.get(coingeckoUrl);
      const price = response.data?.hype?.usd;
      console.log(`Spot price (CoinGecko, ${symbol}):`, price);
      return parseFloat(price);
    } catch (error) {
      console.error('Error retrieving spot price from CoinGecko for HYPE:', error.message);
      return null;
    }
  }

  const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;

  try {
    const response = await axios.get(url);
    const price = response.data.price;
    console.log(`Spot price (binance, ${symbol}):`, price);
    return parseFloat(price);
  } catch (error) {
    console.error('Error retrieving spot price from binance:', error.message);
    return null;
  }
}

export async function getFuturesPrice(symbol, setError) {
  const url = `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`;

  try {
    const response = await axios.get(url);
    const price = response.data.price;
    console.log(`Futures price (binance, ${symbol}):`, price);
    return parseFloat(price);
  } catch (error) {
    console.error('Error retrieving futures price from binance:', error.message);
    setError('Error retrieving futures price from binance');
    return null;
  }
}