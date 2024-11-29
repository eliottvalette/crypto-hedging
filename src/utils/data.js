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