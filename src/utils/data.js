import axios from 'axios';

export async function getAvailableSymbols(platform = 'binance') {
  const urls = {
    binance: 'https://api.binance.com/api/v3/exchangeInfo',
  };

  const url = urls[platform.toLowerCase()];
  if (!url) {
    console.error(`Unsupported platform: ${platform}`);
    return [];
  }

  try {
    const response = await axios.get(url);
    let symbols;
    switch (platform.toLowerCase()) {
      case 'binance':
        symbols = response.data.symbols.map((symbol) => symbol.symbol);
        break;
      default:
        console.error(`Symbol extraction not defined for platform: ${platform}`);
        return [];
    }
    console.log(`Available symbols (${platform}):`, symbols);
    return symbols;
  } catch (error) {
    console.error(`Error retrieving available symbols from ${platform}:`, error.message);
    return [];
  }
}

export async function getSpotPrice(symbol, platform = 'binance') {
  const urls = {
    binance: `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
  };

  const url = urls[platform.toLowerCase()];
  if (!url) {
    console.error(`Unsupported platform: ${platform}`);
    return null;
  }

  try {
    const response = await axios.get(url);
    let price;
    switch (platform.toLowerCase()) {
      case 'binance':
        price = response.data.price;
        break;
      default:
        console.error(`Price extraction not defined for platform: ${platform}`);
        return null;
    }
    console.log(`Spot price (${platform}, ${symbol}):`, price);
    return parseFloat(price);
  } catch (error) {
    console.error(`Error retrieving spot price from ${platform}:`, error.message);
    return null;
  }
}

export async function getFuturesPrice(symbol, platform = 'binance') {
  const urls = {
    binance: `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`,
  };

  const url = urls[platform.toLowerCase()];
  if (!url) {
    console.error(`Unsupported platform: ${platform}`);
    return null;
  }

  try {
    const response = await axios.get(url);
    let price;
    switch (platform.toLowerCase()) {
      case 'binance':
        price = response.data.price;
        break;
      default:
        console.error(`Price extraction not defined for platform: ${platform}`);
        return null;
    }
    console.log(`Futures price (${platform}, ${symbol}):`, price);
    return parseFloat(price);
  } catch (error) {
    console.error(`Error retrieving futures price from ${platform}:`, error.message);
    return null;
  }
}