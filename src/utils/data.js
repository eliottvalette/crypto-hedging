import axios from 'axios';

export async function getSpotPrice(symbol, platform = 'binance') {
  const urls = {
    binance: `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
    coinbase: `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`,
    coingecko: `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`,
    okx: `https://www.okx.com/api/v5/market/ticker?instId=${symbol}-USDT`,
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
      case 'coinbase':
        price = response.data.data.amount;
        break;
      case 'coingecko':
        price = response.data[symbol.toLowerCase()].usd;
        break;
      case 'okx':
        price = response.data.data[0].last;
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
    okx: `https://www.okx.com/api/v5/market/ticker?instId=${symbol}-USDT-SWAP`,
    bybit: `https://api.bybit.com/v2/public/tickers?symbol=${symbol}`,
    bitmex: `https://www.bitmex.com/api/v1/instrument?symbol=${symbol}`,
    huobi: `https://api.hbdm.com/market/detail/merged?symbol=${symbol}`,
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
      case 'okx':
        price = response.data.data[0]?.last;
        break;
      case 'bybit':
        price = response.data.result.find(ticker => ticker.symbol === symbol)?.last_price;
        break;
      case 'bitmex':
        price = response.data.find(item => item.symbol === symbol)?.lastPrice;
        break;
      case 'huobi':
        price = response.data.tick?.close;
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