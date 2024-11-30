import axios from 'axios';

// Configuration des clés API
const apiKey = 'PK2S0D4VH3CU12CHZQ66';
const apiSecret = 'WWpcF15UaNdDKO3v7tBSzjj4DEciWJmw4mNft7Bd';
const baseUrl = 'https://data.alpaca.markets/v2';

// En-têtes pour l'authentification
const headers = {
  'APCA-API-KEY-ID': apiKey,
  'APCA-API-SECRET-KEY': apiSecret,
};

export async function fetchHistoricalData(symbol, startDate, endDate, timeframe) {
  try {
    const url = `${baseUrl}/stock/bars?symbol=${symbol}&start=${startDate}&end=${endDate}&timeframe=${timeframe}`;
    const response = await axios.get(url, { headers });
    const data = response.data;
    return data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des données : ${error.message}`);
    return null;
  }
}

export async function getSpotPrice(symbol) {
  const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
  try {
      const response = await axios.get(url);
      console.log(`Prix spot (${symbol}):`, response.data.price);
      return parseFloat(response.data.price);
  } catch (error) {
      console.error('Erreur lors de la récupération du prix spot:', error.message);
  }
}

export async function getFuturesPrice(symbol) {
  const url = `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`;
  try {
      const response = await axios.get(url);
      console.log(`Prix futures (${symbol}):`, response.data.price);
      return parseFloat(response.data.price);
  } catch (error) {
      console.error('Erreur lors de la récupération du prix futures:', error.message);
  }
}